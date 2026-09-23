import { useState } from 'react';

/**
 * ShareButton — Copy current map view as a shareable URL.
 *
 * Floating button that copies the current URL (which includes map state
 * from useShareableURL) to clipboard with visual feedback.
 */
export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      // Navigator share API (mobile) or clipboard fallback
      if (navigator.share) {
        await navigator.share({
          title: 'Prahari — Disaster Intelligence',
          text: 'Check this hazard zone view on Prahari',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled share dialog
    }
  };

  return (
    <button
      onClick={handleShare}
      title={copied ? 'Copied!' : 'Share this view'}
      style={{
        position: 'absolute',
        bottom: '220px',
        right: '12px',
        zIndex: 10,
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        border: copied
          ? '1px solid rgba(34, 197, 94, 0.4)'
          : '1px solid rgba(0,0,0,0.1)',
        background: copied
          ? 'rgba(34, 197, 94, 0.12)'
          : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        e.target.style.transform = 'scale(1.08)';
        e.target.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={e => {
        e.target.style.transform = 'scale(1)';
        e.target.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)';
      }}
    >
      {copied ? '✅' : '🔗'}
    </button>
  );
}
