/**
 * HomeAccess - Componente de Ruta Privada
 * Ruta: src/components/common/PrivateRoute.jsx
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const ADMIN_ROLES          = ['admin', 'portero', 'vigilante'];
const SECURITY_GUARD_ROLES = ['securityguard'];
const RESIDENT_ROLES       = ['residente', 'propietario'];

const PrivateRoute = ({ roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // ── 1. No autenticado ──
  if (!isAuthenticated || !user) {
    const path = location.pathname;
    let loginPath = '/login';

    if (path.startsWith('/securityguard')) {
      loginPath = '/securityguard/login';
    } else if (
      path.startsWith('/dashboard') ||
      path.startsWith('/usuarios') ||
      path.startsWith('/unidades') ||
      ADMIN_ROLES.includes(user?.role)
    ) {
      loginPath = '/admin/login';
    }

    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // ── 2. Residente/propietario que intenta ir al admin → redirigir a su portal ──
  if (
    !roles &&
    RESIDENT_ROLES.includes(user.role) &&
    !location.pathname.startsWith('/residente')
  ) {
    return <Navigate to="/residente/inicio" replace />;
  }

  // ── 3. Autenticado pero sin el rol requerido ──
  if (roles && !roles.includes(user.role)) {
    // Si es residente y trata de ir a ruta de admin → su portal
    if (RESIDENT_ROLES.includes(user.role)) {
      return <Navigate to="/residente/inicio" replace />;
    }
    // Si es security guard → su portal
    if (SECURITY_GUARD_ROLES.includes(user.role)) {
      return <Navigate to="/securityguard/access-logs" replace />;
    }

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
          Tu rol actual es:{' '}
          <span className="font-semibold capitalize text-gray-600">{user.role}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Roles requeridos:{' '}
          <span className="font-semibold text-gray-600">{roles.join(', ')}</span>
        </p>
      </div>
    );
  }

  return <Outlet />;
};

export default PrivateRoute;