/**
 * HomeAccess - Layout Principal del Dashboard
 * =============================================
 * Estructura: Sidebar fijo (izquierda) + área de contenido principal.
 * Usa Outlet de React Router para renderizar las páginas hijas.
 */

import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, DoorOpen,
  Package, Menu, X, LogOut, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

/**
 * Configuración del menú de navegación.
 * roles: si se especifica, solo se muestra a esos roles.
 */
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/usuarios', label: 'Usuarios', icon: Users, roles: ['admin'] },
  { to: '/unidades', label: 'Unidades', icon: Building2 },
  { to: '/control-acceso', label: 'Control Acceso', icon: DoorOpen, roles: ['admin', 'portero', 'vigilante'] },
  { to: '/paquetes', label: 'Paquetes', icon: Package },
];

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /**
   * Filtra los items de navegación según el rol del usuario.
   */
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* === SIDEBAR === */}
      <aside
        className={`
          flex flex-col bg-slate-900 text-white transition-all duration-300
          ${sidebarOpen ? 'w-64' : 'w-16'}
        `}
      >
        {/* Logo y toggle */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-lg text-blue-400">HomeAccess</h1>
              <p className="text-xs text-slate-400 truncate">{user?.conjunto_id?.nombre || 'Conjunto'}</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded hover:bg-slate-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={20} className="flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer del sidebar: info del usuario */}
        <div className="border-t border-slate-700 p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              {/* Avatar con iniciales */}
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {user?.nombres?.[0]}{user?.apellidos?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.nombres} {user?.apellidos}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </div>
              <button onClick={handleLogout} className="p-1.5 hover:bg-slate-700 rounded transition-colors" title="Cerrar sesión">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center p-2 hover:bg-slate-700 rounded" title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* === ÁREA DE CONTENIDO PRINCIPAL === */}
      <main className="flex-1 overflow-y-auto">
        {/* Header superior */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          {/* Breadcrumb sencillo */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>HomeAccess</span>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium">Panel</span>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* Contenido de la página actual */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
