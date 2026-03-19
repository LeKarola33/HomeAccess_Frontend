/**
 * src/api/securityguard.api.js
 */

import apiClient from './apiClient';

const BASE = '/securityguard';

// ── Access Logs ───────────────────────────────────────────────
export const getAccessLogs     = (params = {}) =>
  apiClient.get(`${BASE}/access-logs`, { params }).then(r => r.data);

export const getActiveVisitors = () =>
  apiClient.get(`${BASE}/access-logs/active`).then(r => r.data);

export const registerEntry = (data) =>
  apiClient.post(`${BASE}/access-logs/entry`, data).then(r => r.data);

export const registerExit = (data) =>
  apiClient.post(`${BASE}/access-logs/exit`, data).then(r => r.data);

// ── Packages ──────────────────────────────────────────────────
export const getPackages     = (params = {}) =>
  apiClient.get(`${BASE}/packages`, { params }).then(r => r.data);

export const registerPackage = (data) =>
  apiClient.post(`${BASE}/packages`, data).then(r => r.data);

export const deliverPackage  = (id, data = {}) =>
  apiClient.patch(`${BASE}/packages/${id}/deliver`, data).then(r => r.data);

export const returnPackage   = (id, data = {}) =>
  apiClient.patch(`${BASE}/packages/${id}/return`, data).then(r => r.data);

// ── Units ─────────────────────────────────────────────────────
export const getUnits = (params = {}) =>
  apiClient.get(`${BASE}/units`, { params }).then(r => r.data);

// ── Common Areas ──────────────────────────────────────────────
export const getCommonAreas = (params = {}) =>
  apiClient.get(`${BASE}/common-areas`, { params }).then(r => r.data);

// ── Parking ───────────────────────────────────────────────────
export const getParking = (params = {}) =>
  apiClient.get(`${BASE}/parking`, { params }).then(r => r.data);

// Mapa de puestos (Units con tipo='parqueadero')
export const getParkingSpots = (params = {}) =>
  apiClient.get(`${BASE}/parking-spots`, { params }).then(r => r.data);

// ── Events ────────────────────────────────────────────────────
export const getEvents = () =>
  apiClient.get(`${BASE}/events`).then(r => r.data);
