/**
 * HomeAccess - Punto de entrada del Frontend
 * ===========================================
 * Monta la aplicación React con QueryClient y Router.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './styles/index.css';

/**
 * QueryClient: configuración global de React Query.
 * Gestiona caché, estados de carga y errores de las peticiones.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // No re-intentar en caso de error 4xx (cliente)
      retry: (failureCount, error) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5, // Datos frescos por 5 minutos
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
