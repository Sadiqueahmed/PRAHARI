import { useEffect, useCallback } from 'react';

/**
 * useShareableURL — Encode/decode map state in URL params.
 *
 * Enables shareable links like:
 *   https://prahari.app/?lat=26.14&lng=91.73&zoom=10&hazard=FLOOD
 *
 * On page load, reads URL params and returns initial state.
 * Provides updateURL() to sync current view state to the URL bar.
 */

/**
 * Parse initial state from URL search params.
 * Returns null for any param not present.
 */
export function getInitialStateFromURL() {
  const params = new URLSearchParams(window.location.search);

  return {
    lat: params.has('lat') ? parseFloat(params.get('lat')) : null,
    lng: params.has('lng') ? parseFloat(params.get('lng')) : null,
    zoom: params.has('zoom') ? parseFloat(params.get('zoom')) : null,
    hazardType: params.get('hazard') || null,
    zoneId: params.get('zone') || null,
  };
}

/**
 * Update the URL bar with current map state (without page reload).
 */
export function updateURL({ lat, lng, zoom, hazardType, zoneId }) {
  const params = new URLSearchParams();

  if (lat != null && lng != null) {
    params.set('lat', lat.toFixed(4));
    params.set('lng', lng.toFixed(4));
  }
  if (zoom != null) {
    params.set('zoom', zoom.toFixed(1));
  }
  if (hazardType) {
    params.set('hazard', hazardType);
  }
  if (zoneId) {
    params.set('zone', zoneId);
  }

  const query = params.toString();
  const newURL = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState(null, '', newURL);
}

/**
 * React hook that syncs map view state with URL params.
 *
 * @param {Object} mapRef - Mapbox GL map reference
 * @param {string|null} activeHazardType - Current hazard filter
 * @param {boolean} mapLoaded - Whether the map is ready
 */
export default function useShareableURL(mapRef, activeHazardType, mapLoaded) {

  // On mount: apply URL state to map
  useEffect(() => {
    if (!mapLoaded || !mapRef?.current) return;

    const initial = getInitialStateFromURL();

    if (initial.lat != null && initial.lng != null) {
      const opts = {
        center: [initial.lng, initial.lat],
        duration: 1500,
      };
      if (initial.zoom != null) opts.zoom = initial.zoom;
      mapRef.current.flyTo(opts);
    }
  }, [mapLoaded]);

  // Sync map movements to URL (debounced)
  useEffect(() => {
    if (!mapLoaded || !mapRef?.current) return;

    let timeout;
    const handleMoveEnd = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const center = mapRef.current.getCenter();
        const zoom = mapRef.current.getZoom();
        updateURL({
          lat: center.lat,
          lng: center.lng,
          zoom,
          hazardType: activeHazardType,
        });
      }, 500);
    };

    mapRef.current.on('moveend', handleMoveEnd);
    return () => {
      clearTimeout(timeout);
      if (mapRef.current) {
        mapRef.current.off('moveend', handleMoveEnd);
      }
    };
  }, [mapLoaded, activeHazardType]);

  // Generate share link
  const getShareLink = useCallback(() => {
    return window.location.href;
  }, []);

  return { getShareLink };
}
