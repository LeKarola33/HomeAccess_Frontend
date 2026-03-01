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

// Auth
import LoginPage      from '@/pages/auth/LoginPage';
import AdminLoginPage from '@/pages/auth/AdminLoginPage';
import RegisterPage   from '@/pages/auth/RegisterPage';

// Dashboard
import DashboardPage  from '@/pages/dashboard/DashboardPage';
import UsersPage      from '@/pages/users/UsersPage';
import UserDetailPage from '@/pages/users/UserDetailPage';
import UnitsPage      from '@/pages/units/UnitsPage';
import UnitDetailPage from '@/pages/units/UnitDetailPage';
import AccessLogPage  from '@/pages/access/AccessLogPage';
import PackagesPage   from '@/pages/packages/PackagesPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Rutas públicas ───────────────────────────────── */}
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/admin/login"  element={<AdminLoginPage />} />
        <Route path="/admin"        element={<Navigate to="/admin/login" replace />} />
        <Route path="/register"     element={<RegisterPage />} />

        {/* ── Rutas privadas (requieren JWT válido) ─────────── */}
        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>

            {/* Dashboard: todos los roles autenticados */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Gestión de usuarios: solo admin */}
            <Route path="/usuarios" element={<PrivateRoute roles={['admin']} />}>
              <Route index element={<UsersPage />} />
              <Route path=":id" element={<UserDetailPage />} />
            </Route>

            {/* Unidades: todos */}
            <Route path="/unidades"     element={<UnitsPage />} />
            <Route path="/unidades/:id" element={<UnitDetailPage />} />

            {/* Control de acceso: admin, portero, vigilante */}
            <Route path="/control-acceso"
              element={<PrivateRoute roles={['admin', 'portero', 'vigilante']} />}>
              <Route index element={<AccessLogPage />} />
            </Route>

            {/* Paquetes: todos (backend filtra por rol) */}
            <Route path="/paquetes" element={<PackagesPage />} />

          </Route>
        </Route>

        {/* ── Redirects ────────────────────────────────────── */}
        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;
