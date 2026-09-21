import { useState, useEffect, useCallback } from 'react';
import client from '../../api/client';

/**
 * InventoryDashboard — Relief camp and supply management panel.
 *
 * Features:
 *   - List all active relief camps with capacity bars
 *   - Drill into a camp's inventory items
 *   - Highlight deficits (red) and surpluses (green)
 *   - Update item quantities inline
 *
 * Props:
 *   @param {Function} onClose - Callback to close the panel
 */
export default function InventoryDashboard({ onClose }) {
  const [camps, setCamps] = useState([]);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCamps = useCallback(async () => {
    try {
      const response = await client.get('/inventory/camps');
      if (response.data?.data) {
        setCamps(response.data.data);
      }
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load relief camps');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCamps();
  }, [fetchCamps]);

  const fetchInventory = async (campId) => {
    setInventoryLoading(true);
    try {
      const response = await client.get(`/inventory/camps/${campId}/items`);
      if (response.data?.data) {
        setInventory(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
      setInventory([]);
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleCampClick = (camp) => {
    setSelectedCamp(camp);
    fetchInventory(camp.id);
  };

  const handleBack = () => {
    setSelectedCamp(null);
    setInventory([]);
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      await client.put(`/inventory/items/${itemId}`, { quantity: newQuantity });
      // Refresh inventory
      if (selectedCamp) fetchInventory(selectedCamp.id);
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const categoryIcons = {
    FOOD: '🍚',
    WATER: '💧',
    MEDICAL: '💊',
    SHELTER: '🏕️',
    CLOTHING: '👕',
    HYGIENE: '🧼',
    OTHER: '📦',
  };

  return (
    <div
      className="map-overlay glass-panel"
      style={{
        top: '16px',
        right: '16px',
        width: '380px',
        maxHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '3px solid #10B981',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-panel-border)' }}
      >
        <div className="flex items-center gap-2">
          {selectedCamp && (
            <button
              onClick={handleBack}
              className="p-1 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              title="Back to camps"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <span className="text-lg">{selectedCamp ? '📋' : '🏕️'}</span>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {selectedCamp ? selectedCamp.name : 'Relief Camps'}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          title="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {loading && (
          <div className="text-center py-8">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Loading camps...</p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg text-xs"
               style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#B91C1C' }}>
            {error}
          </div>
        )}

        {/* === Camp List View === */}
        {!selectedCamp && !loading && camps.length === 0 && (
          <div className="text-center py-8">
            <span className="text-3xl block mb-2">🏕️</span>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              No relief camps registered
            </p>
          </div>
        )}

        {!selectedCamp && camps.map((camp) => {
          const occupancyPct = camp.capacity > 0
            ? Math.min(100, Math.round((camp.currentOccupancy / camp.capacity) * 100))
            : 0;
          const isNearFull = occupancyPct >= 85;

          return (
            <button
              key={camp.id}
              onClick={() => handleCampClick(camp)}
              className="w-full text-left rounded-xl p-3 transition-all"
              style={{
                background: 'rgba(241, 245, 249, 0.8)',
                border: '1px solid var(--color-panel-border)',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {camp.name}
                </p>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: isNearFull ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: isNearFull ? '#DC2626' : '#059669',
                  }}
                >
                  {occupancyPct}% full
                </span>
              </div>

              {/* Capacity bar */}
              <div className="w-full h-1.5 rounded-full overflow-hidden mb-2"
                   style={{ background: 'rgba(148, 163, 184, 0.2)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${occupancyPct}%`,
                    background: isNearFull
                      ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
                      : 'linear-gradient(90deg, #10B981, #34D399)',
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {camp.currentOccupancy || 0} / {camp.capacity} occupants
                </p>
                {camp.address && (
                  <p className="text-xs truncate ml-2" style={{ color: 'var(--color-text-muted)', maxWidth: '150px' }}>
                    📍 {camp.address}
                  </p>
                )}
              </div>
            </button>
          );
        })}

        {/* === Inventory Detail View === */}
        {selectedCamp && inventoryLoading && (
          <div className="text-center py-8">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Loading inventory...</p>
          </div>
        )}

        {selectedCamp && !inventoryLoading && inventory.length === 0 && (
          <div className="text-center py-8">
            <span className="text-3xl block mb-2">📦</span>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              No inventory items registered
            </p>
          </div>
        )}

        {selectedCamp && !inventoryLoading && inventory.map((item) => {
          const isDeficit = item.quantity < item.minimumRequired;
          const isSurplus = item.quantity > item.minimumRequired * 1.5;

          return (
            <div
              key={item.id}
              className="rounded-xl p-3"
              style={{
                background: isDeficit
                  ? 'rgba(220, 38, 38, 0.04)'
                  : isSurplus
                  ? 'rgba(16, 185, 129, 0.04)'
                  : 'rgba(241, 245, 249, 0.8)',
                border: `1px solid ${
                  isDeficit
                    ? 'rgba(220, 38, 38, 0.15)'
                    : isSurplus
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'var(--color-panel-border)'
                }`,
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{categoryIcons[item.category] || '📦'}</span>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {item.itemName}
                  </p>
                </div>
                {isDeficit && (
                  <span className="badge badge-critical" style={{ fontSize: '9px' }}>DEFICIT</span>
                )}
                {isSurplus && (
                  <span className="badge badge-low" style={{ fontSize: '9px' }}>SURPLUS</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Quantity with inline edit buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                      className="w-5 h-5 rounded flex items-center justify-center text-xs"
                      style={{
                        background: 'rgba(148, 163, 184, 0.15)',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    >
                      −
                    </button>
                    <span className="text-xs font-bold px-1.5" style={{
                      color: isDeficit ? '#DC2626' : 'var(--color-text-primary)',
                    }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-5 h-5 rounded flex items-center justify-center text-xs"
                      style={{
                        background: 'rgba(148, 163, 184, 0.15)',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        border: 'none',
                      }}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {item.unit}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  min: {item.minimumRequired}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
