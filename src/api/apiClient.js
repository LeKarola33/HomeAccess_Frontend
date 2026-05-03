/**
 * HomeAccess - Cliente HTTP (Axios)
 * ==================================
 * Instancia de Axios configurada con:
 * - URL base de la API
 * - Interceptor para añadir el token JWT automáticamente
 * - Interceptor para manejar expiración de token y refresh automático
 */

import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// Crear instancia con configuración base
const apiClient = axios.create({
  //baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://home-access-b.vercel.app/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// INTERCEPTOR DE PETICIONES
// ==========================================
/**
 * Antes de cada request, añade el token JWT al header Authorization.
 * El token se lee del store de Zustand (estado global).
 */
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Variable para evitar múltiples intentos de refresh simultáneos
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ==========================================
// INTERCEPTOR DE RESPUESTAS
// ==========================================
/**
 * Si el server responde 401 (token expirado), intenta renovar el token
 * con el refreshToken y reintenta la petición original.
 * Si falla el refresh, cierra la sesión automáticamente.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Solo manejar 401 y evitar bucle infinito en el endpoint de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Encolar peticiones mientras se renueva el token
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken, setTokens, logout } = useAuthStore.getState();

        if (!refreshToken) {
          logout();
          return Promise.reject(error);
        }

        // Intentar renovar el token
        const { data } = await apiClient.post('/auth/refresh', { refreshToken });
        const newAccessToken = data.data.accessToken;

        setTokens(newAccessToken, data.data.refreshToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
