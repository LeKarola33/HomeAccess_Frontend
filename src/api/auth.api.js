/**
 * HomeAccess - API de Autenticación
 * ====================================
 * Funciones para interactuar con los endpoints de auth del backend.
 */

import apiClient from './apiClient';

/**
 * Registra un nuevo usuario.
 * @param {Object} userData - { nombres, apellidos, cedula, email, password }
 */
export const registerUser = async (userData) => {
  const { data } = await apiClient.post('/auth/register', userData);
  return data;
};

/**
 * Autentica un usuario con email y contraseña.
 * @param {string} email
 * @param {string} password
 */
export const loginUser = async (email, password) => {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
};

/**
 * Obtiene los datos del usuario autenticado.
 */
export const getMe = async () => {
  const { data } = await apiClient.get('/auth/me');
  return data;
};
