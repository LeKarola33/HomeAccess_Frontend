/**
 * src/pages/resident/ResidentDashboard.jsx
 */

import { useState, useEffect } from 'react';
import { Package, Car, Building2, Calendar } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getMyPackages, getMyVehicles, getEvents } from '@/api/resident.api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm
    flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
    </div>
    <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shadow-md`}>
      <Icon size={22} className={color} />
    </div>
  </div>
);

const ResidentDashboard = () => {
  const { user } = useAuthStore();
  const [paquetes, setPaquetes]   = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [eventos, setEventos]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es });

  useEffect(() => {
    Promise.all([
      getMyPackages({ status: 'en_porteria' }),
      getMyVehicles(),
      getEvents(),
    ]).then(([pkg, veh, evt]) => {
      setPaquetes(pkg.data?.packages || []);
      setVehiculos(veh.data?.vehicles || []);
      setEventos(evt.data?.upcoming   || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Buenos días, {user?.nombres?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-400 text-sm capitalize mt-0.5">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package}   label="Paquetes en portería"
          value={paquetes.length}  bg="bg-orange-500" color="text-white" />
        <StatCard icon={Car}       label="Mis vehículos"
          value={vehiculos.length} bg="bg-blue-500"   color="text-white" />
        <StatCard icon={Building2} label="Próximos eventos"
          value={eventos.length}   bg="bg-violet-500" color="text-white" />
        <StatCard icon={Calendar}  label="Mi unidad"
          value={user?.unidad || '—'} bg="bg-green-500" color="text-white" />
      </div>

      {/* Paquetes pendientes */}
      {paquetes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Package size={18} className="text-orange-500" />
            <h2 className="font-semibold text-gray-800">Paquetes esperándote en portería</h2>
            <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-bold
              px-2 py-0.5 rounded-full">{paquetes.length}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {paquetes.map(p => (
              <div key={p._id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {{ paquete:'📦', sobre:'✉️', documento:'📄', perecedero:'🥗' }[p.tipo] || '📫'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 capitalize">{p.tipo}</p>
                    {p.transportadora && (
                      <p className="text-xs text-gray-400">{p.transportadora}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(p.fecha_recepcion).toLocaleDateString('es-CO', {
                    day: '2-digit', month: 'short',
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximos eventos */}
      {eventos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Calendar size={18} className="text-violet-500" />
            <h2 className="font-semibold text-gray-800">Próximos eventos del conjunto</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {eventos.slice(0, 3).map(e => (
              <div key={e._id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{e.titulo}</p>
                  <p className="text-xs text-gray-400">{e.lugar}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                    ${e.tipo === 'obligatorio'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'}`}>
                    {e.tipo}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(e.fecha_inicio).toLocaleDateString('es-CO', {
                      day: '2-digit', month: 'short',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && paquetes.length === 0 && eventos.length === 0 && (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
          <p className="text-4xl mb-3">🏠</p>
          <p className="text-gray-500 font-medium">Todo tranquilo por ahora</p>
          <p className="text-gray-400 text-sm mt-1">No tienes paquetes ni eventos pendientes</p>
        </div>
      )}
    </div>
  );
};

export default ResidentDashboard;
