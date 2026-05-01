/**
 * HomeAccess - API de Autenticación
 * Ruta: src/api/auth.api.js
 */

import apiClient from './apiClient';

export const registerUser = async (userData) => {
  const { data } = await apiClient.post('/auth/register', userData);
  return data;
};

export const loginUser = async (email, password) => {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data;
};

export const getMe = async () => {
  const { data } = await apiClient.get('/auth/me');
  return data;
};

export const forgotPassword = async (email) => {
  const { data } = await apiClient.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (token, password) => {
  const { data } = await apiClient.post('/auth/reset-password', { token, password });
  return data;
};
