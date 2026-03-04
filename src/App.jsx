/**
 * HomeAccess - Aplicación Principal y Enrutamiento
 * ==================================================
 * /login          → Portal de Residentes y Propietarios
 * /admin/login    → Portal de Administración (admin, portero, vigilante)
 * /dashboard      → Panel principal (requiere autenticación)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute    from '@/components/common/PrivateRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

// ─────────── AUTH ───────────
import LoginPage      from '@/pages/auth/LoginPage';
import AdminLoginPage from '@/pages/auth/AdminLoginPage';
import RegisterPage   from '@/pages/auth/RegisterPage';

// ─────────── DASHBOARD ───────────
import DashboardPage  from '@/pages/dashboard/DashboardPage';

// ─────────── USUARIOS ───────────
import UsersPage      from '@/pages/users/UsersPage';
import UserDetailPage from '@/pages/users/UserDetailPage';

// ─────────── UNIDADES ───────────
import UnitsPage      from '@/pages/units/UnitsPage';
import UnitDetailPage from '@/pages/units/UnitDetailPage';

// ─────────── CONTROL DE ACCESO ───────────
import AccessLogPage  from '@/pages/access/AccessLogPage';

// ─────────── PAQUETES ───────────
import PackagesPage   from '@/pages/packages/PackagesPage';

// ─────────── NUEVOS MÓDULOS ───────────
import CommonAreasPage from '@/pages/common-areas/CommonAreasPage';
import ParkingPage     from '@/pages/parking/ParkingPage';
import EventsPage      from '@/pages/events/EventsPage';
import VehiclesPage    from '@/pages/vehicles/VehiclesPage'; // 👈 NUEVO

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── RUTAS PÚBLICAS ───────────────────────────── */}
        <Route path="/login"       element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin"       element={<Navigate to="/admin/login" replace />} />
        <Route path="/register"    element={<RegisterPage />} />

        {/* ── RUTAS PRIVADAS (requieren JWT válido) ───── */}
        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>

            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Gestión de usuarios (solo admin) */}
            <Route path="/usuarios" element={<PrivateRoute roles={['admin']} />}>
              <Route index element={<UsersPage />} />
              <Route path=":id" element={<UserDetailPage />} />
            </Route>

            {/* Unidades (todos los autenticados) */}
            <Route path="/unidades"     element={<UnitsPage />} />
            <Route path="/unidades/:id" element={<UnitDetailPage />} />

            {/* Control de acceso (admin, portero, vigilante) */}
            <Route
              path="/control-acceso"
              element={<PrivateRoute roles={['admin', 'portero', 'vigilante']} />}
            >
              <Route index element={<AccessLogPage />} />
            </Route>

            {/* Paquetes */}
            <Route path="/paquetes" element={<PackagesPage />} />

            {/* ───────── NUEVAS FUNCIONALIDADES ───────── */}

            {/* Áreas Comunes (admin y residente) */}
            <Route
              path="/areas-comunes"
              element={<PrivateRoute roles={['admin', 'residente']} />}
            >
              <Route index element={<CommonAreasPage />} />
            </Route>

            {/* Parqueadero (admin, portero, vigilante) */}
            <Route
              path="/parqueadero"
              element={<PrivateRoute roles={['admin', 'portero', 'vigilante']} />}
            >
              <Route index element={<ParkingPage />} />
            </Route>

            {/* Vehículos (admin y residente) */}
            <Route
              path="/vehiculos"
              element={<PrivateRoute roles={['admin', 'residente']} />}
            >
              <Route index element={<VehiclesPage />} />
            </Route>

            {/* Eventos (todos los autenticados) */}
            <Route path="/eventos" element={<EventsPage />} />

          </Route>
        </Route>

        {/* ── REDIRECTS ───────────────────────────────── */}
        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;