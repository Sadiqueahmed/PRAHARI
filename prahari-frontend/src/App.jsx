import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth/AuthContext';
import MapContainer from './components/map/MapContainer';
import Sidebar from './components/layout/Sidebar';
import FloatingPanel from './components/layout/FloatingPanel';
import SOSButton from './components/sos/SOSButton';
import HazardDonut from './components/widgets/HazardDonut';
import RiverLevelChart from './components/widgets/RiverLevelChart';
import SOSWidget from './components/widgets/SOSWidget';
import AirQualityCard from './components/widgets/AirQualityCard';
import LoadingSkeleton from './components/common/LoadingSkeleton';
import ErrorBoundary from './components/common/ErrorBoundary';
import HazardDetailPanel from './components/hazard/HazardDetailPanel';
import SOSManagement from './components/sos/SOSManagement';
import InventoryDashboard from './components/inventory/InventoryDashboard';
import client from './api/client';

/** Auto-refresh interval for live data (30 seconds) */
const REFRESH_INTERVAL_MS = 30000;

/**
 * App — Main dashboard layout.
 * 
 * Architecture:
 *   - Full-screen Mapbox 2.5D map as the background
 *   - Light-themed sidebar on the left for module navigation
 *   - Floating glassmorphism panels overlay the map
 *   - Context-sensitive side panels (SOS Management, Inventory, Hazard Details)
 *   - SOS panic button in the bottom-right
 * 
 * Sidebar modules control:
 *   1. Which hazard layers are visible on the map (filter by type)
 *   2. Which detail panels are shown (SOS Management, Inventory)
 *   3. Which floating widgets are relevant
 */
export default function App() {
  const { user } = useAuth();
  const [activeModule, setActiveModule] = useState('floods');

  // ================================================================
  // Data State — fetched from backend APIs
  // ================================================================
  const [hazardZones, setHazardZones] = useState([]);
  const [hazardSummary, setHazardSummary] = useState([]);
  const [riverStations, setRiverStations] = useState([]);
  const [sosActiveCount, setSosActiveCount] = useState(0);
  const [sosRecent, setSosRecent] = useState([]);
  const [airQuality, setAirQuality] = useState(null);

  // ================================================================
  // UI State — panels & selection
  // ================================================================
  const [selectedHazard, setSelectedHazard] = useState(null);

  // ================================================================
  // Loading & Error State
  // ================================================================
  const [loading, setLoading] = useState({
    hazards: true,
    rivers: true,
    sos: true,
  });
  const [errors, setErrors] = useState({
    hazards: null,
    rivers: null,
    sos: null,
  });

  const isNGOPlus = ['NGO', 'GOVERNMENT', 'SUPER_ADMIN'].includes(user?.role);
  const isGovPlus = ['GOVERNMENT', 'SUPER_ADMIN'].includes(user?.role);

  // ================================================================
  // Data Fetching Functions
  // ================================================================

  /**
   * Fetch hazard zone summary (donut chart data).
   */
  const fetchHazardSummary = useCallback(async () => {
    try {
      const response = await client.get('/hazards/summary');
      if (response.data?.data) {
        setHazardSummary(response.data.data);
      }
      setErrors(prev => ({ ...prev, hazards: null }));
    } catch (err) {
      console.log('Hazard summary not available:', err.message);
      setErrors(prev => ({ ...prev, hazards: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, hazards: false }));
    }
  }, []);

  /**
   * Fetch river station data with latest readings.
   */
  const fetchRiverStations = useCallback(async () => {
    try {
      const response = await client.get('/rivers/stations');
      if (response.data?.data) {
        setRiverStations(response.data.data);
      }
      setErrors(prev => ({ ...prev, rivers: null }));
    } catch (err) {
      console.log('River data not available:', err.message);
      setErrors(prev => ({ ...prev, rivers: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, rivers: false }));
    }
  }, []);

  /**
   * Fetch SOS count and active SOS requests.
   */
  const fetchSOSData = useCallback(async () => {
    try {
      // Fetch active count (available to all roles)
      const countResponse = await client.get('/sos/count');
      if (countResponse.data?.data) {
        setSosActiveCount(countResponse.data.data.activeCount || 0);
      }

      // Fetch recent SOS list (NGO+ only)
      if (isNGOPlus) {
        const activeResponse = await client.get('/sos/active');
        if (activeResponse.data?.data) {
          setSosRecent(activeResponse.data.data);
        }
      }

      setErrors(prev => ({ ...prev, sos: null }));
    } catch (err) {
      console.log('SOS data not available:', err.message);
      setErrors(prev => ({ ...prev, sos: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, sos: false }));
    }
  }, [isNGOPlus]);

  /**
   * Fetch air quality data for Guwahati station.
   */
  const fetchAirQuality = useCallback(async () => {
    try {
      const response = await client.get('/airquality/latest');
      if (response.data?.data) {
        setAirQuality(response.data.data);
      }
    } catch {
      // AQI endpoint may not exist yet — fall back to defaults
      console.log('AQI data not available (endpoint may not be implemented yet)');
    }
  }, []);

  // ================================================================
  // Initial Data Fetch + Auto-Refresh
  // ================================================================

  useEffect(() => {
    // Initial fetch
    fetchHazardSummary();
    fetchRiverStations();
    fetchSOSData();
    fetchAirQuality();

    // Auto-refresh interval for live data
    const interval = setInterval(() => {
      fetchRiverStations();
      fetchSOSData();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchHazardSummary, fetchRiverStations, fetchSOSData, fetchAirQuality]);

  // ================================================================
  // Transform river station data for the bar chart
  // ================================================================
  const riverChartData = riverStations
    .filter(s => s.currentLevel != null)
    .map(s => ({
      station: s.stationName,
      river: s.riverName,
      level: s.currentLevel,
      danger: s.dangerLevel,
      warning: s.warningLevel,
    }));

  // ================================================================
  // Event Handlers
  // ================================================================

  /**
   * Handle sidebar module change.
   * Closes any open detail panels when switching modules.
   */
  const handleModuleChange = (moduleId) => {
    setActiveModule(moduleId);
    setSelectedHazard(null); // Close hazard detail panel on module switch
  };

  /**
   * Handle SOS trigger — sends GPS to backend.
   */
  const handleSOSTrigger = async ({ longitude, latitude }) => {
    const response = await client.post('/sos', {
      longitude,
      latitude,
      message: 'Emergency SOS triggered from dashboard',
    });
    // Refresh SOS data immediately after trigger
    fetchSOSData();
    return response.data;
  };

  /**
   * Callback when map finishes loading.
   * Fetches initial hazard zone data for map layers.
   */
  const handleMapLoad = async (mapInstance) => {
    if (!mapInstance) return; // Map may not be available (missing token)
    try {
      const response = await client.get('/hazards');
      if (response.data?.data) {
        setHazardZones(response.data.data);
      }
    } catch (err) {
      // API may not be running yet — render with empty data
      console.log('Hazard data not available yet (backend may be offline)');
    }
  };

  /**
   * Handle hazard zone click on the map — opens the detail panel.
   */
  const handleHazardClick = (hazard) => {
    setSelectedHazard(hazard);
  };

  /**
   * Deactivate a hazard zone (Government+ only).
   */
  const handleDeactivateHazard = async (hazardId) => {
    try {
      await client.put(`/hazards/${hazardId}/deactivate`);
      // Refresh hazard data
      setSelectedHazard(null);
      const response = await client.get('/hazards');
      if (response.data?.data) {
        setHazardZones(response.data.data);
      }
      fetchHazardSummary();
    } catch (err) {
      console.error('Failed to deactivate hazard:', err);
    }
  };

  // ================================================================
  // Determine which panels/widgets to show based on active module
  // ================================================================
  const showSOSPanel = activeModule === 'sos' && isNGOPlus;
  const showInventoryPanel = activeModule === 'logistics' && isNGOPlus;
  const showHazardDetail = selectedHazard && !showSOSPanel && !showInventoryPanel;

  // Show floating widgets only when no full-panel is open
  const showFloatingWidgets = !showSOSPanel && !showInventoryPanel;

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
      />

      {/* Map + Floating Panels */}
      <div className="flex-1 relative overflow-hidden">
        {/* Full-screen Map */}
        <MapContainer
          hazardZones={hazardZones}
          riverStations={riverStations}
          onMapLoad={handleMapLoad}
          activeHazardType={activeModule}
          onHazardClick={handleHazardClick}
        />

        {/* ============================================================
         * Floating Panels — positioned absolutely over the map
         * Only shown when no full-width panel (SOS/Inventory) is active
         * ============================================================ */}

        {showFloatingWidgets && (
          <>
            {/* Top-Left: Active Hazard Summary (Donut Chart) */}
            <FloatingPanel
              title="Active Hazards"
              className="top-4 left-4"
              accentColor="#3B82F6"
            >
              <ErrorBoundary fallbackMessage="Hazard data failed to load.">
                {loading.hazards ? (
                  <LoadingSkeleton variant="chart" />
                ) : (
                  <HazardDonut data={hazardSummary} />
                )}
              </ErrorBoundary>
            </FloatingPanel>

            {/* Top-Right: SOS Widget (only when hazard detail is not open) */}
            {!showHazardDetail && (
              <FloatingPanel
                title="SOS Alerts"
                className="top-4 right-4"
                accentColor="#DC2626"
              >
                <ErrorBoundary fallbackMessage="SOS data failed to load.">
                  {loading.sos ? (
                    <LoadingSkeleton variant="list" />
                  ) : (
                    <SOSWidget
                      activeCount={sosActiveCount}
                      recentSOS={sosRecent}
                    />
                  )}
                </ErrorBoundary>
              </FloatingPanel>
            )}

            {/* Bottom-Left: River Levels (Bar Chart) */}
            <FloatingPanel
              title="River Levels — NE India"
              className="bottom-4 left-4"
              accentColor="#3B82F6"
              defaultCollapsed={false}
            >
              <ErrorBoundary fallbackMessage="River data failed to load.">
                {loading.rivers ? (
                  <LoadingSkeleton variant="chart" />
                ) : (
                  <RiverLevelChart data={riverChartData} />
                )}
              </ErrorBoundary>
            </FloatingPanel>

            {/* Bottom-Center: Air Quality */}
            <FloatingPanel
              title="Air Quality Index"
              className="bottom-4 left-[320px]"
              accentColor="#8B5CF6"
              defaultCollapsed={true}
            >
              <ErrorBoundary fallbackMessage="AQI data failed to load.">
                <AirQualityCard
                  station={airQuality?.stationName || 'Guwahati'}
                  aqi={airQuality?.aqi || 85}
                  pollutant={airQuality?.dominantPollutant || 'PM2.5'}
                />
              </ErrorBoundary>
            </FloatingPanel>
          </>
        )}

        {/* ============================================================
         * Detail Panels — context-sensitive slide-outs
         * ============================================================ */}

        {/* Hazard Zone Detail (on map polygon click) */}
        {showHazardDetail && (
          <HazardDetailPanel
            hazard={selectedHazard}
            onClose={() => setSelectedHazard(null)}
            onDeactivate={handleDeactivateHazard}
            canManage={isGovPlus}
          />
        )}

        {/* SOS Management Panel (for NGO/Government users) */}
        {showSOSPanel && (
          <SOSManagement
            onClose={() => setActiveModule('floods')}
          />
        )}

        {/* Inventory Dashboard (for NGO/Government users) */}
        {showInventoryPanel && (
          <InventoryDashboard
            onClose={() => setActiveModule('floods')}
          />
        )}

        {/* SOS Panic Button — Always visible, bottom right */}
        <SOSButton onSOSTrigger={handleSOSTrigger} />
      </div>
    </div>
  );
}
