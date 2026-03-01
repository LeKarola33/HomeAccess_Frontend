/**
 * HomeAccess - API de Recursos del MVP
 * =======================================
 * Agrupa las llamadas a la API para usuarios, unidades,
 * control de acceso y paquetes.
 */

import apiClient from './apiClient';

// ==========================================
// USUARIOS
// ==========================================
export const getUsers = async (params = {}) => {
  const { data } = await apiClient.get('/users', { params });
  return data;
};

export const getUserById = async (id) => {
  const { data } = await apiClient.get(`/users/${id}`);
  return data;
};

export const updateUser = async (id, payload) => {
  const { data } = await apiClient.put(`/users/${id}`, payload);
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await apiClient.delete(`/users/${id}`);
  return data;
};

// ==========================================
// UNIDADES
// ==========================================
export const getUnits = async (params = {}) => {
  const { data } = await apiClient.get('/units', { params });
  return data;
};

export const getUnitById = async (id) => {
  const { data } = await apiClient.get(`/units/${id}`);
  return data;
};

export const createUnit = async (payload) => {
  const { data } = await apiClient.post('/units', payload);
  return data;
};

export const updateUnit = async (id, payload) => {
  const { data } = await apiClient.put(`/units/${id}`, payload);
  return data;
};

// ==========================================
// CONTROL DE ACCESO
// ==========================================
export const getAccessLogs = async (params = {}) => {
  const { data } = await apiClient.get('/access-logs', { params });
  return data;
};

export const getActivePeople = async () => {
  const { data } = await apiClient.get('/access-logs/active');
  return data;
};

export const createAccessLog = async (payload) => {
  const { data } = await apiClient.post('/access-logs', payload);
  return data;
};

// ==========================================
// PAQUETES
// ==========================================
export const getPackages = async (params = {}) => {
  const { data } = await apiClient.get('/packages', { params });
  return data;
};

export const createPackage = async (payload) => {
  const { data } = await apiClient.post('/packages', payload);
  return data;
};

export const deliverPackage = async (id, payload) => {
  const { data } = await apiClient.patch(`/packages/${id}/entregar`, payload);
  return data;
};
