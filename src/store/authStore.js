/**
 * HomeAccess - Store de Autenticación (Zustand)
 * ================================================
 * Estado global para el usuario autenticado y los tokens JWT.
 * Persiste en localStorage para mantener la sesión entre recargas.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      /**
       * Establece el usuario y los tokens tras login/register exitoso.
       */
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      /**
       * Actualiza los tokens cuando se hace refresh.
       */
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      /**
       * Actualiza los datos del usuario (sin tocar los tokens).
       */
      setUser: (user) => set({ user }),

      /**
       * Cierra la sesión: limpia todo el estado.
       * El middleware persist se encarga de borrar del localStorage.
       */
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      /**
       * Helper: verifica si el usuario tiene alguno de los roles indicados.
       * @param {string[]} roles - Ej: ['admin', 'portero']
       */
      hasRole: (...roles) => {
        const { user } = get();
        return user ? roles.includes(user.role) : false;
      },
    }),
    {
      name: 'homeaccess-auth', // Clave en localStorage
      // Solo persistir los tokens y datos mínimos del usuario
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
