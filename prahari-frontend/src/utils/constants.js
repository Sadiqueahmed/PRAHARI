/**
 * Prahari Frontend Constants
 * Central configuration for API URLs, map defaults, and hazard colors.
 */

/** Backend API base URL — proxied in dev via Vite config */
export const API_BASE_URL = '/api';

/** Mapbox access token — loaded from .env */
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

/**
 * Default map center: Guwahati, Assam
 * Gateway to Northeast India, center of the Brahmaputra basin.
 */
export const MAP_CENTER = [91.7362, 26.1445];

/** Default map zoom level — shows all of NE India */
export const MAP_ZOOM = 6.5;

/** Default map pitch for 2.5D terrain effect */
export const MAP_PITCH = 45;

/** Default map bearing (rotation) */
export const MAP_BEARING = -10;

/**
 * Hazard type color mapping — used for map layers and UI badges.
 * Each hazard type has a primary, light, and dark variant.
 */
export const HAZARD_COLORS = {
  FLOOD: { primary: '#3B82F6', light: '#60A5FA', dark: '#1D4ED8' },
  EARTHQUAKE: { primary: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
  LANDSLIDE: { primary: '#EF4444', light: '#F87171', dark: '#DC2626' },
  AIR_QUALITY: { primary: '#8B5CF6', light: '#A78BFA', dark: '#7C3AED' },
};

/**
 * Severity level colors — used for badges and alert priority rendering.
 */
export const SEVERITY_COLORS = {
  CRITICAL: '#DC2626',
  HIGH: '#EF4444',
  MEDIUM: '#F59E0B',
  LOW: '#10B981',
};

/** RBAC Role labels for UI display */
export const ROLE_LABELS = {
  CITIZEN: 'Citizen',
  NGO: 'NGO Worker',
  GOVERNMENT: 'Government Official',
  SUPER_ADMIN: 'Super Admin',
};
