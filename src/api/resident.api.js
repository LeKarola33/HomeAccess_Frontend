/**
 * src/api/resident.api.js
 * Llamadas API específicas para el portal de residentes.
 * Todas las rutas devuelven solo datos del residente autenticado.
 */

import apiClient from './apiClient';

// Paquetes del residente autenticado
export const getMyPackages  = (params = {}) =>
  apiClient.get('/resident/packages', { params }).then(r => r.data);

// Vehículos del residente autenticado
export const getMyVehicles  = ()              =>
  apiClient.get('/resident/vehicles').then(r => r.data);

// Áreas comunes (solo lectura)
export const getCommonAreas = (params = {})  =>
  apiClient.get('/resident/common-areas', { params }).then(r => r.data);

// Eventos (solo lectura)
export const getEvents      = (params = {})  =>
  apiClient.get('/resident/events', { params }).then(r => r.data);

// Info del residente (unidad, propietario, etc.)
export const getMyProfile   = ()              =>
  apiClient.get('/auth/me').then(r => r.data);
