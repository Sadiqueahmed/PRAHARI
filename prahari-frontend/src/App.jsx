import { useState, useEffect, useCallback, useRef } from 'react';
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
import client from './api/client';

/** Auto-refresh interval for live data (30 seconds) */
const REFRESH_INTERVAL_MS = 30000;

/**
 * App — Main dashboard layout.
 * 
 * Architecture:
 *   - Full-screen Mapbox 2.5D map as the background
 *   - Dark sidebar on the left for module navigation
 *   - Floating glassmorphism panels overlay the map
 *   - SOS panic button in the bottom-right
 * 
 * Layout:
 * ┌──────┬────────────────────────────────────────────┐
 * │      │  [Hazard Summary]      [SOS Widget]        │
 * │  S   │                                            │
 * │  I   │           M A P B O X                      │
 * │  D   │        2.5D TERRAIN                        │
 * │  E   │                                            │
 * │  B   │  [River Levels]    [Air Quality]           │
 * │  A   │                              [SOS Button]  │
 * │  R   │                                            │
 * └──────┴────────────────────────────────────────────┘
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

  // ================================================================
  // Initial Data Fetch + Auto-Refresh
  // ================================================================

  useEffect(() => {
    // Initial fetch
    fetchHazardSummary();
    fetchRiverStations();
    fetchSOSData();

    // Auto-refresh interval for live data
    const interval = setInterval(() => {
      fetchRiverStations();
      fetchSOSData();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchHazardSummary, fetchRiverStations, fetchSOSData]);

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

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
      />

      {/* Map + Floating Panels */}
      <div className="flex-1 relative overflow-hidden">
        {/* Full-screen Map */}
        <MapContainer
          hazardZones={hazardZones}
          riverStations={riverStations}
          onMapLoad={handleMapLoad}
        />

        {/* ============================================================
         * Floating Panels — positioned absolutely over the map
         * ============================================================ */}

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

        {/* Top-Right: SOS Widget */}
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
            <AirQualityCard />
          </ErrorBoundary>
        </FloatingPanel>

        {/* SOS Panic Button — Bottom Right */}
        <SOSButton onSOSTrigger={handleSOSTrigger} />
      </div>
    </div>
  );
}
