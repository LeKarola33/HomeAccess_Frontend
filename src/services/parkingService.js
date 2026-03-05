/**
 * parkingService.js
 * Capa de servicio para el módulo de Parqueadero.
 * Todos los fetch al backend pasan por aquí.
 *
 * BASE URL: /api/v1/parking
 *
 * VEHÍCULOS:
 *   getVehicles(params)            GET  /parking/vehicles
 *   getVehicleById(id)             GET  /parking/vehicles/:id
 *   createVehicle(data)            POST /parking/vehicles
 *   updateVehicle(id, data)        PUT  /parking/vehicles/:id
 *   deleteVehicle(id)              DELETE /parking/vehicles/:id
 *
 * ASIGNACIÓN:
 *   assignSpot(vehicleId, spotId)  PATCH /parking/vehicles/:id/assign
 *   unassignSpot(vehicleId)        PATCH /parking/vehicles/:id/unassign
 *
 * PUESTOS:
 *   getSpots(params)               GET  /parking/spots
 *   getSpotById(spotId)            GET  /parking/spots/:spotId
 *
 * POR UNIDAD:
 *   getVehiclesByUnit(unitId)      GET  /parking/unit/:unitId
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// ─── Helper: leer token desde homeaccess-auth ─────────────────────────────────
// El store guarda: { "state": { "accessToken": "eyJ...", "user": {...} } }
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
  const token = getToken();
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
// VEHÍCULOS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Lista vehículos del conjunto.
 * @param {Object} params - Filtros opcionales: { tipo, placa, unit_id, page, limit }
 */
export const getVehicles = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/parking/vehicles${qs ? `?${qs}` : ''}`, {
    headers: authHeaders(),
  }).then(handleResponse);
};

/**
 * Detalle de un vehículo.
 * @param {string} id - Vehicle _id
 */
export const getVehicleById = (id) =>
  fetch(`${BASE_URL}/parking/vehicles/${id}`, {
    headers: authHeaders(),
  }).then(handleResponse);

/**
 * Registra un nuevo vehículo. Admin only.
 * @param {Object} data - { unit_id, propietario_id, placa, tipo, marca, modelo, color, anio }
 */
export const createVehicle = (data) =>
  fetch(`${BASE_URL}/parking/vehicles`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

/**
 * Actualiza datos del vehículo. Placa es inmutable. Admin only.
 * @param {string} id   - Vehicle _id
 * @param {Object} data - Campos a actualizar (marca, modelo, color, anio, etc.)
 */
export const updateVehicle = (id, data) =>
  fetch(`${BASE_URL}/parking/vehicles/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(handleResponse);

/**
 * Elimina un vehículo (soft delete). Libera el puesto si tenía uno. Admin only.
 * @param {string} id - Vehicle _id
 */
export const deleteVehicle = (id) =>
  fetch(`${BASE_URL}/parking/vehicles/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then(handleResponse);

// ═════════════════════════════════════════════════════════════════════════════
// ASIGNACIÓN DE PUESTOS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Asigna un puesto de parqueadero a un vehículo. Admin only.
 * @param {string} vehicleId     - Vehicle _id
 * @param {string} parqueadero_id - Unit _id con tipo='parqueadero'
 */
export const assignSpot = (vehicleId, parqueadero_id) =>
  fetch(`${BASE_URL}/parking/vehicles/${vehicleId}/assign`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ parqueadero_id }),
  }).then(handleResponse);

/**
 * Libera el puesto asignado a un vehículo. Admin only.
 * @param {string} vehicleId - Vehicle _id
 */
export const unassignSpot = (vehicleId) =>
  fetch(`${BASE_URL}/parking/vehicles/${vehicleId}/unassign`, {
    method: 'PATCH',
    headers: authHeaders(),
  }).then(handleResponse);

// ═════════════════════════════════════════════════════════════════════════════
// PUESTOS DE PARQUEADERO
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Lista todos los puestos del conjunto con su vehículo asignado.
 * Incluye resumen: { total, ocupados, libres, mantenimiento }
 * @param {Object} params - Filtros opcionales: { estado: 'desocupado' | 'ocupado' | 'en_mantenimiento' }
 */
export const getSpots = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/parking/spots${qs ? `?${qs}` : ''}`, {
    headers: authHeaders(),
  }).then(handleResponse);
};

/**
 * Detalle de un puesto específico con su vehículo asignado.
 * @param {string} spotId - Unit _id con tipo='parqueadero'
 */
export const getSpotById = (spotId) =>
  fetch(`${BASE_URL}/parking/spots/${spotId}`, {
    headers: authHeaders(),
  }).then(handleResponse);

// ═════════════════════════════════════════════════════════════════════════════
// POR UNIDAD RESIDENCIAL
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Lista todos los vehículos y puestos de un apartamento específico.
 * Útil en la vista de detalle de unidad.
 * @param {string} unitId - Unit _id (apartamento, no parqueadero)
 */
export const getVehiclesByUnit = (unitId) =>
  fetch(`${BASE_URL}/parking/unit/${unitId}`, {
    headers: authHeaders(),
  }).then(handleResponse);
