/**
 * LoadingSkeleton — Animated placeholder for widgets while data loads.
 * 
 * Renders pulsing gray bars that mimic the shape of the widget content.
 * Matches the light glassmorphism theme.
 * 
 * @param {string} variant - 'chart' | 'card' | 'list' — controls the skeleton shape
 */
export default function LoadingSkeleton({ variant = 'chart' }) {
  const pulseStyle = {
    background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease-in-out infinite',
    borderRadius: '8px',
  };

  return (
    <div style={{ padding: '4px 0' }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {variant === 'chart' && (
        <div style={{ height: '180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ ...pulseStyle, height: '140px', width: '100%' }} />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <div style={{ ...pulseStyle, height: '12px', width: '50px' }} />
            <div style={{ ...pulseStyle, height: '12px', width: '60px' }} />
            <div style={{ ...pulseStyle, height: '12px', width: '45px' }} />
          </div>
        </div>
      )}

      {variant === 'card' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ ...pulseStyle, height: '48px', width: '48px', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ ...pulseStyle, height: '16px', width: '80%' }} />
              <div style={{ ...pulseStyle, height: '12px', width: '50%' }} />
            </div>
          </div>
          <div style={{ ...pulseStyle, height: '36px', width: '100%' }} />
          <div style={{ ...pulseStyle, height: '8px', width: '100%' }} />
        </div>
      )}

      {variant === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ ...pulseStyle, height: '48px', width: '48px', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ ...pulseStyle, height: '20px', width: '40%' }} />
              <div style={{ ...pulseStyle, height: '12px', width: '60%' }} />
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ ...pulseStyle, height: '40px', width: '100%' }} />
          ))}
        </div>
      )}
    </div>
  );
}
