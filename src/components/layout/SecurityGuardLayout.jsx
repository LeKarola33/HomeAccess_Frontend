/**
 * src/components/layout/SecurityGuardLayout.jsx
 */

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LogOut, Menu, X, Home, UserCheck, Users,
  Package, Building2, Car, Calendar, Shield,
} from 'lucide-react';

const NAV = [
  {
    seccion: 'Visitantes',
    items: [
      { to: '/securityguard/access-logs',        icon: UserCheck, label: 'Registro de Accesos' },
      { to: '/securityguard/access-logs/active', icon: Users,     label: 'Adentro Ahora' },
      { to: '/securityguard/visitors', icon: Users, label: 'Visitantes Esperados' }
    ],
  },
  {
    seccion: 'Paquetes',
    items: [
      { to: '/securityguard/packages', icon: Package, label: 'Gestión de Paquetes' },
    ],
  },
  {
    seccion: 'Información',
    items: [
      { to: '/securityguard/units',        icon: Home,      label: 'Unidades' },
      { to: '/securityguard/common-areas', icon: Building2, label: 'Áreas Comunes' },
      { to: '/securityguard/parking',      icon: Car,       label: 'Parqueadero' },
      { to: '/securityguard/events',       icon: Calendar,  label: 'Eventos' },
    ],
  },
];

const SecurityGuardLayout = () => {
  const [abierto, setAbierto] = useState(true);
  const { user, logout }      = useAuthStore();
  const navigate              = useNavigate();

  const handleLogout = () => { logout(); navigate('/securityguard/login'); };

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`${abierto ? 'w-64' : 'w-16'} transition-all duration-300
        bg-gray-900 border-r border-gray-800 flex flex-col`}>

        {/* Cabecera */}
        <div className="flex items-center justify-between px-4 py-4
          border-b border-gray-800">
          {abierto && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center
                justify-center">
                <Shield size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-none">
                  HomeAccess
                </p>
                <p className="text-teal-400 text-xs">Security Guard</p>
              </div>
            </div>
          )}
          <button onClick={() => setAbierto(!abierto)}
            className="text-gray-400 hover:text-white p-1 rounded">
            {abierto ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {NAV.map(({ seccion, items }) => (
            <div key={seccion} className="mb-6">
              {abierto && (
                <p className="text-xs font-semibold text-gray-500 uppercase
                  tracking-wider px-2 mb-2">
                  {seccion}
                </p>
              )}
              {items.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} end
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg mb-1 text-sm
                    transition-colors
                    ${isActive
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
                  }>
                  <Icon size={18} className="shrink-0" />
                  {abierto && <span>{label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Usuario */}
        <div className="border-t border-gray-800 p-3">
          {abierto ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-700 rounded-full flex items-center
                justify-center text-white text-sm font-bold shrink-0">
                {user?.nombres?.[0]}{user?.apellidos?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user?.nombres} {user?.apellidos}
                </p>
                <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
              </div>
              <button onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 p-1 transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout}
              className="w-full flex justify-center text-gray-400
                hover:text-red-400 p-2 transition-colors">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default SecurityGuardLayout;
