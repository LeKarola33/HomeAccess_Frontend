/**
 * vehicleService.js
 * Capa de servicio para el módulo de Vehículos.
 *
 * BASE URL: /api/v1/vehicles
 *
 * getVehicles(params)         GET  /vehicles
 * getVehicleById(id)          GET  /vehicles/:id
 * createVehicle(data)         POST /vehicles
 * updateVehicle(id, data)     PUT  /vehicles/:id
 * deleteVehicle(id)           DELETE /vehicles/:id
 * getVehiclesByUnit(unitId)   GET  /vehicles/unit/:unitId
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'https://home-access-b.vercel.app/api/v1';

// ─── Helper: leer token desde homeaccess-auth ─────────────────────────────────
const getToken = () => {
  try {
    const raw = localStorage.getItem('homeaccess-auth');
    if (!raw) return null;
    return JSON.parse(raw)?.state?.accessToken || null;
  } catch {
    return null;
  }
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

// ─── Vehículos ────────────────────────────────────────────────────────────────

/**
 * Lista vehículos con filtros opcionales.
 * @param {Object} params - { tipo, placa, unit_id, con_puesto, sin_puesto, page, limit }
 */
export const getVehicles = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  ).toString();
  return fetch(`${BASE_URL}/vehicles${qs ? `?${qs}` : ''}`, {
    headers: authHeaders(),
  }).then(handleResponse);
};

/**
 * Detalle de un vehículo.
 * @param {string} id - Vehicle _id
 */
export const getVehicleById = (id) =>
  fetch(`${BASE_URL}/vehicles/${id}`, { headers: authHeaders() }).then(handleResponse);

/**
 * Registra un nuevo vehículo.
 * @param {Object} data - { unit_id, propietario_id, tipo, placa?, marca?, modelo?, color?, anio? }
 */
export const createVehicle = (data) =>
  fetch(`${BASE_URL}/vehicles`, {
    method:  'POST',
    headers: authHeaders(),
    body:    JSON.stringify(data),
  }).then(handleResponse);

/**
 * Actualiza datos del vehículo. Placa es inmutable.
 * @param {string} id   - Vehicle _id
 * @param {Object} data - { marca?, modelo?, color?, anio?, tipo? }
 */
export const updateVehicle = (id, data) =>
  fetch(`${BASE_URL}/vehicles/${id}`, {
    method:  'PUT',
    headers: authHeaders(),
    body:    JSON.stringify(data),
  }).then(handleResponse);

/**
 * Elimina un vehículo (soft delete). Libera el puesto si tenía uno.
 * @param {string} id - Vehicle _id
 */
export const deleteVehicle = (id) =>
  fetch(`${BASE_URL}/vehicles/${id}`, {
    method:  'DELETE',
    headers: authHeaders(),
  }).then(handleResponse);

/**
 * Lista vehículos de un apartamento específico.
 * @param {string} unitId - Unit _id
 */
export const getVehiclesByUnit = (unitId) =>
  fetch(`${BASE_URL}/vehicles/unit/${unitId}`, {
    headers: authHeaders(),
  }).then(handleResponse);
