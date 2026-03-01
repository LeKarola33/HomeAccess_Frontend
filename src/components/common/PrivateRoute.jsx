/**
 * HomeAccess - Componente de Ruta Privada
 * =========================================
 * Protege rutas que requieren autenticación y/o roles específicos.
 *
 * Comportamiento:
 * - Sin sesión → redirige a /login o /admin/login según la ruta intentada
 * - Con sesión pero sin rol → muestra pantalla de acceso denegado
 * - OK → renderiza la página hija (Outlet)
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

// Roles del panel de administración
const ADMIN_ROLES = ['admin', 'portero', 'vigilante'];

const PrivateRoute = ({ roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // ── 1. No autenticado ──
  if (!isAuthenticated || !user) {
    // Si la ruta que intenta acceder es del área admin, redirigir al login admin
    const isAdminArea = ADMIN_ROLES.includes(user?.role);
    const loginPath = isAdminArea ? '/admin/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // ── 2. Autenticado pero sin el rol requerido ──
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <ShieldX size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
        <p className="text-gray-500 text-sm max-w-xs mb-1">
          No tienes permisos para acceder a esta sección.
        </p>
        <p className="text-xs text-gray-400">
          Tu rol actual es: <span className="font-semibold capitalize text-gray-600">{user.role}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Roles requeridos: <span className="font-semibold text-gray-600">{roles.join(', ')}</span>
        </p>
      </div>
    );
  }

  // ── 3. OK → renderizar página ──
  return <Outlet />;
};

export default PrivateRoute;
