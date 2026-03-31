/**
 * src/api/securityguard.api.js
 */
import apiClient from './apiClient';

const BASE = '/securityguard';

// ── Accesos ───────────────────────────────────────────────────
export const getAccessLogs     = (params = {}) => apiClient.get(`${BASE}/access-logs`,        { params }).then(r => r.data);
export const getActiveVisitors = ()             => apiClient.get(`${BASE}/access-logs/active`).then(r => r.data);
export const registerEntry     = (data)         => apiClient.post(`${BASE}/access-logs/entry`, data).then(r => r.data);
export const registerExit      = (data)         => apiClient.post(`${BASE}/access-logs/exit`,  data).then(r => r.data);

// ── Paquetes ──────────────────────────────────────────────────
export const getPackages    = (params = {}) => apiClient.get(`${BASE}/packages`,           { params }).then(r => r.data);
export const registerPackage= (data)        => apiClient.post(`${BASE}/packages`,          data).then(r => r.data);
export const deliverPackage = (id)          => apiClient.patch(`${BASE}/packages/${id}/deliver`).then(r => r.data);
export const returnPackage  = (id)          => apiClient.patch(`${BASE}/packages/${id}/return`).then(r => r.data);

// ── Unidades ──────────────────────────────────────────────────
export const getUnits       = (params = {}) => apiClient.get(`${BASE}/units`,        { params }).then(r => r.data);

// ── Áreas comunes ─────────────────────────────────────────────
export const getCommonAreas = (params = {}) => apiClient.get(`${BASE}/common-areas`, { params }).then(r => r.data);

// ── Parking ───────────────────────────────────────────────────
export const getParking     = (params = {}) => apiClient.get(`${BASE}/parking`,       { params }).then(r => r.data);
export const getParkingSpots= (params = {}) => apiClient.get(`${BASE}/parking-spots`, { params }).then(r => r.data);

// ── Eventos ───────────────────────────────────────────────────
export const getEvents      = (params = {}) => apiClient.get(`${BASE}/events`,        { params }).then(r => r.data);

// ── Visitantes pre-autorizados por residentes ─────────────────
export const searchVisitors = (params = {}) => apiClient.get('/resident/visitors/search', { params }).then(r => r.data);