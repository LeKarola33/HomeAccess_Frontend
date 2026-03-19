/**
 * src/components/layout/ResidentLayout.jsx
 * Layout con sidebar para el portal de residentes
 */

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home, Package, Car, Building2, Calendar,
  LogOut, Menu, X, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import logo from '@/img/logo.jpeg';

const NAV_ITEMS = [
  { to: '/residente/inicio',       icon: Home,      label: 'Inicio' },
  { to: '/residente/paquetes',     icon: Package,   label: 'Mis Paquetes' },
  { to: '/residente/vehiculos',    icon: Car,       label: 'Mis Vehículos' },
  { to: '/residente/areas-comunes',icon: Building2, label: 'Áreas Comunes' },
  { to: '/residente/eventos',      icon: Calendar,  label: 'Eventos' },
];

const ResidentLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full bg-gray-900 ${mobile ? 'w-64' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-blue-600 shrink-0">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">HomeAccess</p>
            <p className="text-blue-400 text-xs font-semibold">Portal Residente</p>
          </div>
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-colors group
              ${isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
            }>
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="text-blue-200" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Usuario + logout */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.nombres?.[0]}{user?.apellidos?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">
              {user?.nombres} {user?.apellidos}
            </p>
            <p className="text-gray-500 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-gray-400
            hover:text-red-400 hover:bg-gray-800 rounded-lg text-sm transition-colors">
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar mobile */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3
          bg-white border-b border-gray-200 shrink-0">
          <button onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700">
            <Menu size={20} />
          </button>
          <span className="text-gray-800 font-semibold text-sm">HomeAccess</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ResidentLayout;
