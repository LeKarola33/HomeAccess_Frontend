/**
 * unitService.js
 * Capa de servicio para el módulo de Unidades Residenciales.
 * BASE URL: /api/v1/units
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const getToken = () => {
  try {
    const raw = localStorage.getItem('homeaccess-auth');
    return JSON.parse(raw)?.state?.accessToken || null;
  } catch { return null; }
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error del servidor');
  return data;
};

// ─── Unidades ─────────────────────────────────────────────────────────────────

export const getUnits = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  ).toString();
  return fetch(`${BASE_URL}/units${qs ? `?${qs}` : ''}`, {
    headers: authHeaders(),
  }).then(handleResponse);
};

export const getUnitById = (id) =>
  fetch(`${BASE_URL}/units/${id}`, { headers: authHeaders() }).then(handleResponse);

export const createUnit = (data) =>
  fetch(`${BASE_URL}/units`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  }).then(handleResponse);

export const updateUnit = (id, data) =>
  fetch(`${BASE_URL}/units/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(data),
  }).then(handleResponse);

export const deleteUnit = (id) =>
  fetch(`${BASE_URL}/units/${id}`, {
    method: 'DELETE', headers: authHeaders(),
  }).then(handleResponse);

// ─── Mascotas ─────────────────────────────────────────────────────────────────

export const addMascota = (unitId, data) =>
  fetch(`${BASE_URL}/units/${unitId}/mascotas`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  }).then(handleResponse);

export const removeMascota = (unitId, mascotaId) =>
  fetch(`${BASE_URL}/units/${unitId}/mascotas/${mascotaId}`, {
    method: 'DELETE', headers: authHeaders(),
  }).then(handleResponse);
