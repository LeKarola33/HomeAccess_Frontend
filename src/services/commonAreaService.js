/**
 * commonAreaService.js
 * Capa de servicio para Áreas Comunes y Reservas.
 * Todos los fetch al backend pasan por aquí — los componentes nunca llaman
 * directamente a fetch(). Esto facilita cambiar la base URL o agregar
 * interceptores (ej: refresh token) en un solo lugar.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'https://home-access-b.vercel.app/api/v1';

// ─── Helper: leer token desde homeaccess-auth ────────────────────────────────
// El store guarda: { "state": { "accessToken": "eyJ..." } }
const getToken = () => {
  try {
    const raw = localStorage.getItem('homeaccess-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken || null;
  } catch {
    return null;
  }
};

// ─── Helper: headers con JWT ──────────────────────────────────────────────────
const authHeaders = () => {
  const token = getToken();  // ← usa getToken(), no localStorage directo
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// ─── Helper: manejar respuesta ────────────────────────────────────────────────
const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error del servidor');
  return data;
};

// ═════════════════════════════════════════════════════════════════════════════
// ÁREAS COMUNES
// ═════════════════════════════════════════════════════════════════════════════

export const getAreas = () =>
  fetch(`${BASE_URL}/common-areas`, { headers: authHeaders() }).then(handleResponse);

export const getAreaById = (id) =>
  fetch(`${BASE_URL}/common-areas/${id}`, { headers: authHeaders() }).then(handleResponse);

export const createArea = (data) =>
  fetch(`${BASE_URL}/common-areas`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const updateArea = (id, data) =>
  fetch(`${BASE_URL}/common-areas/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const changeAreaStatus = (id, data) =>
  fetch(`${BASE_URL}/common-areas/${id}/estado`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const blockUnit = (areaId, data) =>
  fetch(`${BASE_URL}/common-areas/${areaId}/bloquear-unidad`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const unblockUnit = (areaId, data) =>
  fetch(`${BASE_URL}/common-areas/${areaId}/desbloquear-unidad`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

// ═════════════════════════════════════════════════════════════════════════════
// RESERVAS
// ═════════════════════════════════════════════════════════════════════════════

export const getAvailability = (areaId, date) =>
  fetch(`${BASE_URL}/common-areas/${areaId}/disponibilidad?fecha=${date}`, {
    headers: authHeaders(),
  }).then(handleResponse);

export const getBookings = (areaId, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/common-areas/${areaId}/reservas${qs ? `?${qs}` : ''}`, {
    headers: authHeaders(),
  }).then(handleResponse);
};

export const createBooking = (areaId, data) =>
  fetch(`${BASE_URL}/common-areas/${areaId}/reservas`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const approveBooking = (areaId, bookingId) =>
  fetch(`${BASE_URL}/common-areas/${areaId}/reservas/${bookingId}/aprobar`, {
    method: 'PATCH',
    headers: authHeaders(),
  }).then(handleResponse);

export const rejectBooking = (areaId, bookingId, motivo) =>
  fetch(`${BASE_URL}/common-areas/${areaId}/reservas/${bookingId}/rechazar`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ motivo }),
  }).then(handleResponse);

export const cancelBooking = (areaId, bookingId, motivo) =>
  fetch(`${BASE_URL}/common-areas/${areaId}/reservas/${bookingId}/cancelar`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ motivo }),
  }).then(handleResponse);