/**
 * HomeAccess - Página Principal del Dashboard
 * =============================================
 * Muestra tarjetas resumen con métricas clave del conjunto.
 * Usa React Query para fetching con caché automático.
 */

import { useQuery } from '@tanstack/react-query';
import { Users, Building2, DoorOpen, Package } from 'lucide-react';
import { getUsers } from '@/api/resources.api';
import { getUnits } from '@/api/resources.api';
import { getAccessLogs, getActivePeople } from '@/api/resources.api';
import { getPackages } from '@/api/resources.api';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente de tarjeta de estadística.
 */
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
          {value ?? <span className="text-gray-300 animate-pulse">—</span>}
        </p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuthStore();
  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es });

  // Fetching paralelo de todas las métricas
  const { data: usersData } = useQuery({
    queryKey: ['users', 'count'],
    queryFn: () => getUsers({ limit: 1 }),
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units', 'count'],
    queryFn: () => getUnits({ limit: 1 }),
  });

  const { data: activeData } = useQuery({
    queryKey: ['access-logs', 'active'],
    queryFn: getActivePeople,
    refetchInterval: 30000, // Actualiza cada 30 segundos (tiempo real)
  });

  const { data: packagesData } = useQuery({
    queryKey: ['packages', 'pending'],
    queryFn: () => getPackages({ estado: 'en_porteria', limit: 1 }),
  });

  // Últimos accesos del día
  const { data: recentAccess } = useQuery({
    queryKey: ['access-logs', 'recent'],
    queryFn: () => getAccessLogs({ limit: 5 }),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Buenos días, {user?.nombres?.split(' ')[0]} 👋
        </h2>
        <p className="text-gray-500 capitalize">{today}</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Residentes"
          value={usersData?.pagination?.total}
          icon={Users}
          color="bg-blue-600"
          subtitle="Registrados en el sistema"
        />
        <StatCard
          title="Unidades"
          value={unitsData?.pagination?.total}
          icon={Building2}
          color="bg-violet-600"
          subtitle={`${unitsData?.data?.filter(u => u.estado === 'ocupado')?.length ?? '—'} ocupadas`}
        />
        <StatCard
          title="Personas Adentro"
          value={activeData?.total}
          icon={DoorOpen}
          color="bg-emerald-600"
          subtitle="En tiempo real"
        />
        <StatCard
          title="Paquetes Pendientes"
          value={packagesData?.pagination?.total}
          icon={Package}
          color="bg-orange-500"
          subtitle="En portería sin entregar"
        />
      </div>

      {/* Últimos registros de acceso */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Últimos Accesos</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {recentAccess?.data?.length > 0 ? (
            recentAccess.data.map((log) => (
              <div key={log._id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.tipo_acceso === 'entrada' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {log.persona_id
                        ? `${log.persona_id.nombres} ${log.persona_id.apellidos}`
                        : log.nombre_visitante || 'Visitante'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {log.unit_destino ? `Apt. ${log.unit_destino.numero}` : 'Sin destino'} · {log.porteria}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    log.tipo_acceso === 'entrada'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {log.tipo_acceso}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(log.timestamp), 'HH:mm')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-sm text-gray-400">
              No hay registros recientes
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
