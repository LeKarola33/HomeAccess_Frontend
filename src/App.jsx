/**
 * HomeAccess - Aplicación Principal y Enrutamiento
 * ==================================================
 * /login                → Portal de Residentes y Propietarios
 * /admin/login          → Portal de Administración
 * /securityguard/login  → Portal Security Guard
 * /residente/*          → Portal Residente (layout propio)
 * /dashboard            → Panel Admin
 * /securityguard/*      → Módulo Security Guard
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute    from '@/components/common/PrivateRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

// ─────────── AUTH ───────────
import LoginPage              from '@/pages/auth/LoginPage';
import AdminLoginPage         from '@/pages/auth/AdminLoginPage';
import RegisterPage           from '@/pages/auth/RegisterPage';
import SecurityGuardLoginPage from '@/pages/auth/SecurityGuardLoginPage';

// ─────────── DASHBOARD ADMIN ───────────
import DashboardPage from '@/pages/dashboard/DashboardPage';

// ─────────── USUARIOS ───────────
import UsersPage      from '@/pages/users/UsersPage';
import UserDetailPage from '@/pages/users/UserDetailPage';

// ─────────── UNIDADES ───────────
import UnitsPage      from '@/pages/units/UnitsPage';
import UnitDetailPage from '@/pages/units/UnitDetailPage';

// ─────────── CONTROL DE ACCESO ───────────
import AccessLogPage from '@/pages/access/AccessLogPage';

// ─────────── PAQUETES ───────────
import PackagesPage from '@/pages/packages/PackagesPage';

// ─────────── NUEVOS MÓDULOS ───────────
import CommonAreasPage from '@/pages/common-areas/CommonAreasPage';
import ParkingPage     from '@/pages/parking/ParkingPage';
import EventsPage      from '@/pages/events/EventsPage';
import VehiclesPage    from '@/pages/vehicles/VehiclesPage';

// ─────────── SECURITY GUARD ───────────
import SecurityGuardLayout from '@/components/layout/SecurityGuardLayout';
import AccessLogsPage      from '@/pages/securityguard/AccessLogsPage';
import ActiveVisitorsPage  from '@/pages/securityguard/ActiveVisitorsPage';
import SGPackagesPage      from '@/pages/securityguard/PackagesPage';
import {
  UnitsPage       as SGUnitsPage,
  CommonAreasPage as SGCommonAreasPage,
  ParkingPage     as SGParkingPage,
  EventsPage      as SGEventsPage,
} from '@/pages/securityguard/InfoPages';

// ─────────── PORTAL RESIDENTE ───────────
import ResidentLayout      from '@/components/layout/ResidentLayout';
import ResidentDashboard   from '@/pages/resident/ResidentDashboard';
import ResidentPackages    from '@/pages/resident/ResidentPackages';
import ResidentVehicles    from '@/pages/resident/ResidentVehicles';
import ResidentCommonAreas from '@/pages/resident/ResidentCommonAreas';
import ResidentEvents      from '@/pages/resident/ResidentEvents';
import ResidentVisitors    from '@/pages/resident/ResidentVisitors';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── RUTAS PÚBLICAS ───────────────────────────────── */}
        <Route path="/login"               element={<LoginPage />} />
        <Route path="/admin/login"         element={<AdminLoginPage />} />
        <Route path="/admin"               element={<Navigate to="/admin/login" replace />} />
        <Route path="/securityguard/login" element={<SecurityGuardLoginPage />} />
        <Route path="/register"            element={<RegisterPage />} />

        {/* ── PORTAL RESIDENTE (layout propio) ─────────────── */}
        <Route element={<PrivateRoute roles={['residente', 'propietario']} />}>
          <Route element={<ResidentLayout />}>
            <Route path="/residente/inicio"        element={<ResidentDashboard />} />
            <Route path="/residente/visitantes"    element={<ResidentVisitors />} />
            <Route path="/residente/paquetes"      element={<ResidentPackages />} />
            <Route path="/residente/vehiculos"     element={<ResidentVehicles />} />
            <Route path="/residente/areas-comunes" element={<ResidentCommonAreas />} />
            <Route path="/residente/eventos"       element={<ResidentEvents />} />
          </Route>
        </Route>

        {/* ── RUTAS PRIVADAS ADMIN (Dashboard) ─────────────── */}
        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>

            <Route path="/dashboard" element={<DashboardPage />} />

            <Route element={<PrivateRoute roles={['admin']} />}>
              <Route path="/usuarios"     element={<UsersPage />} />
              <Route path="/usuarios/:id" element={<UserDetailPage />} />
            </Route>

            <Route path="/unidades"     element={<UnitsPage />} />
            <Route path="/unidades/:id" element={<UnitDetailPage />} />

            <Route element={<PrivateRoute roles={['admin', 'portero']} />}>
              <Route path="/control-acceso" element={<AccessLogPage />} />
            </Route>

            <Route path="/paquetes" element={<PackagesPage />} />

            <Route element={<PrivateRoute roles={['admin', 'residente']} />}>
              <Route path="/areas-comunes" element={<CommonAreasPage />} />
            </Route>

            <Route element={<PrivateRoute roles={['admin', 'portero']} />}>
              <Route path="/parqueadero" element={<ParkingPage />} />
            </Route>

            <Route element={<PrivateRoute roles={['admin', 'residente']} />}>
              <Route path="/vehiculos" element={<VehiclesPage />} />
            </Route>

            <Route path="/eventos" element={<EventsPage />} />

          </Route>
        </Route>

        {/* ── SECURITY GUARD (layout propio) ───────────────── */}
           <Route element={<PrivateRoute roles={['portero', 'admin']} />}>
            <Route element={<SecurityGuardLayout />}>
            <Route path="/securityguard/access-logs"        element={<AccessLogsPage />} />
            <Route path="/securityguard/access-logs/active" element={<ActiveVisitorsPage />} />
            <Route path="/securityguard/packages"           element={<SGPackagesPage />} />
            <Route path="/securityguard/units"              element={<SGUnitsPage />} />
            <Route path="/securityguard/common-areas"       element={<SGCommonAreasPage />} />
            <Route path="/securityguard/parking"            element={<SGParkingPage />} />
            <Route path="/securityguard/events"             element={<SGEventsPage />} />
          </Route>
        </Route>

        {/* ── REDIRECTS ────────────────────────────────────── */}
        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;