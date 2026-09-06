import { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import MapContainer from './components/map/MapContainer';
import Sidebar from './components/layout/Sidebar';
import FloatingPanel from './components/layout/FloatingPanel';
import SOSButton from './components/sos/SOSButton';
import HazardDonut from './components/widgets/HazardDonut';
import RiverLevelChart from './components/widgets/RiverLevelChart';
import SOSWidget from './components/widgets/SOSWidget';
import AirQualityCard from './components/widgets/AirQualityCard';
import client from './api/client';

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
  const [hazardZones, setHazardZones] = useState([]);

  const isNGOPlus = ['NGO', 'GOVERNMENT', 'SUPER_ADMIN'].includes(user?.role);

  /**
   * Handle SOS trigger — sends GPS to backend.
   */
  const handleSOSTrigger = async ({ longitude, latitude }) => {
    const response = await client.post('/sos', {
      longitude,
      latitude,
      message: 'Emergency SOS triggered from dashboard',
    });
    return response.data;
  };

  /**
   * Callback when map finishes loading.
   * Fetches initial hazard zone data.
   */
  const handleMapLoad = async (mapInstance) => {
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
          <HazardDonut />
        </FloatingPanel>

        {/* Top-Right: SOS Widget */}
        <FloatingPanel
          title="SOS Alerts"
          className="top-4 right-4"
          accentColor="#DC2626"
        >
          <SOSWidget />
        </FloatingPanel>

        {/* Bottom-Left: River Levels (Bar Chart) */}
        <FloatingPanel
          title="River Levels — NE India"
          className="bottom-4 left-4"
          accentColor="#3B82F6"
          defaultCollapsed={false}
        >
          <RiverLevelChart />
        </FloatingPanel>

        {/* Bottom-Center: Air Quality */}
        <FloatingPanel
          title="Air Quality Index"
          className="bottom-4 left-[320px]"
          accentColor="#8B5CF6"
          defaultCollapsed={true}
        >
          <AirQualityCard />
        </FloatingPanel>

        {/* SOS Panic Button — Bottom Right */}
        <SOSButton onSOSTrigger={handleSOSTrigger} />
      </div>
    </div>
  );
}
