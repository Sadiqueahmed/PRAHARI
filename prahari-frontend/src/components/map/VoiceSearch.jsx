import { useState, useRef, useCallback } from 'react';

/**
 * VoiceSearch — Browser-native voice search for hazard navigation.
 *
 * Uses the Web Speech API (free, no API key) to parse voice commands like:
 *   "Show me floods near Guwahati"
 *   "Zoom to earthquakes"
 *   "Find shelters in Silchar"
 *
 * Renders as a floating microphone button with visual feedback.
 *
 * @param {Function} onCommand - Callback with parsed {action, hazardType, location}
 * @param {Object} mapRef - Mapbox GL map reference for flyTo navigation
 */

// Known locations in NE India for voice matching
const LOCATIONS = {
  guwahati:  { lng: 91.7362, lat: 26.1445 },
  shillong:  { lng: 91.8933, lat: 25.5788 },
  dibrugarh: { lng: 94.9120, lat: 27.4728 },
  imphal:    { lng: 93.9368, lat: 24.8170 },
  agartala:  { lng: 91.2868, lat: 23.8315 },
  silchar:   { lng: 92.7789, lat: 24.8333 },
  jorhat:    { lng: 94.2163, lat: 26.7509 },
  tezpur:    { lng: 92.8000, lat: 26.6338 },
  kohima:    { lng: 94.1086, lat: 25.6751 },
  aizawl:    { lng: 92.7176, lat: 23.7271 },
  itanagar:  { lng: 93.6166, lat: 27.0844 },
  gangtok:   { lng: 88.6138, lat: 27.3314 },
};

// Hazard type keywords
const HAZARD_KEYWORDS = {
  flood: 'FLOOD', floods: 'FLOOD', flooding: 'FLOOD', river: 'FLOOD',
  earthquake: 'EARTHQUAKE', earthquakes: 'EARTHQUAKE', quake: 'EARTHQUAKE', seismic: 'EARTHQUAKE',
  landslide: 'LANDSLIDE', landslides: 'LANDSLIDE',
  air: 'AIR_QUALITY', pollution: 'AIR_QUALITY', aqi: 'AIR_QUALITY', 'air quality': 'AIR_QUALITY',
};

function parseVoiceCommand(transcript) {
  const lower = transcript.toLowerCase().trim();

  // Parse hazard type
  let hazardType = null;
  for (const [keyword, type] of Object.entries(HAZARD_KEYWORDS)) {
    if (lower.includes(keyword)) {
      hazardType = type;
      break;
    }
  }

  // Parse location
  let location = null;
  for (const [name, coords] of Object.entries(LOCATIONS)) {
    if (lower.includes(name)) {
      location = { name, ...coords };
      break;
    }
  }

  // Parse action
  let action = 'search';
  if (lower.includes('zoom out') || lower.includes('reset') || lower.includes('globe')) {
    action = 'reset';
  } else if (lower.includes('show') || lower.includes('find') || lower.includes('where')) {
    action = 'navigate';
  } else if (lower.includes('zoom') || lower.includes('go to') || lower.includes('take me')) {
    action = 'flyto';
  }

  return { action, hazardType, location, transcript: lower };
}

export default function VoiceSearch({ onCommand, mapRef }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const recognitionRef = useRef(null);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setFeedback('Voice not supported in this browser');
      setTimeout(() => setFeedback(''), 3000);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setListening(true);
      setFeedback('Listening...');
    };

    recognition.onresult = (event) => {
      const current = event.results[event.results.length - 1];
      const text = current[0].transcript;
      setTranscript(text);

      if (current.isFinal) {
        const command = parseVoiceCommand(text);
        setFeedback(`"${text}"`);

        // Execute command
        if (command.action === 'reset' && mapRef?.current) {
          mapRef.current.flyTo({
            center: [91.7362, 26.1445],
            zoom: 6.5,
            pitch: 45,
            bearing: -10,
            duration: 2000,
          });
          setFeedback('Resetting view...');
        } else if (command.location && mapRef?.current) {
          mapRef.current.flyTo({
            center: [command.location.lng, command.location.lat],
            zoom: 11,
            duration: 2000,
          });
          setFeedback(`Flying to ${command.location.name}...`);
        }

        if (onCommand) onCommand(command);
        setTimeout(() => {
          setFeedback('');
          setTranscript('');
        }, 3000);
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === 'not-allowed') {
        setFeedback('Microphone access denied');
      } else {
        setFeedback(`Error: ${event.error}`);
      }
      setTimeout(() => setFeedback(''), 3000);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, mapRef, onCommand]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  }, []);

  return (
    <div style={{
      position: 'absolute',
      bottom: '170px',
      right: '12px',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '6px',
    }}>
      {/* Feedback bubble */}
      {feedback && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          borderRadius: '10px',
          padding: '8px 14px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.08)',
          fontSize: '12px',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#334155',
          maxWidth: '220px',
          animation: 'fadeSlideUp 0.2s ease-out',
        }}>
          {listening && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: transcript ? '4px' : 0,
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#EF4444',
                animation: 'pulse 1s infinite',
              }} />
              <span style={{ fontWeight: 500 }}>Listening...</span>
            </div>
          )}
          {transcript && (
            <div style={{ color: '#64748B', fontStyle: 'italic' }}>
              "{transcript}"
            </div>
          )}
          {!listening && feedback && !transcript && (
            <span>{feedback}</span>
          )}
        </div>
      )}

      {/* Mic button */}
      <button
        onClick={listening ? stopListening : startListening}
        title={listening ? 'Stop listening' : 'Voice search'}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: listening ? '2px solid #EF4444' : '1px solid rgba(0,0,0,0.1)',
          background: listening
            ? 'rgba(239, 68, 68, 0.12)'
            : 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          boxShadow: listening
            ? '0 0 0 4px rgba(239, 68, 68, 0.2), 0 4px 16px rgba(0,0,0,0.1)'
            : '0 2px 12px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          transition: 'all 0.2s',
          animation: listening ? 'pulse 1.5s infinite' : 'none',
        }}
      >
        {listening ? '⏹️' : '🎙️'}
      </button>
    </div>
  );
}
