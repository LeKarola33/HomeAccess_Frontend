/**
 * HomeAccess - Página de Unidades Residenciales
 * ================================================
 * Lista de unidades con filtros por estado.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getUnits } from '@/api/resources.api';
import { Building2, ChevronRight } from 'lucide-react';

const ESTADO_COLORS = {
  ocupado: 'bg-emerald-100 text-emerald-700',
  desocupado: 'bg-gray-100 text-gray-600',
  en_mantenimiento: 'bg-orange-100 text-orange-700',
  en_venta: 'bg-blue-100 text-blue-700',
};

const UnitsPage = () => {
  const [estadoFilter, setEstadoFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['units', page, estadoFilter],
    queryFn: () => getUnits({ page, limit: 20, ...(estadoFilter && { estado: estadoFilter }) }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Unidades Residenciales</h2>
        <p className="text-sm text-gray-500">Gestión de apartamentos, casas y locales del conjunto</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {['', 'ocupado', 'desocupado', 'en_mantenimiento', 'en_venta'].map((estado) => (
          <button
            key={estado}
            onClick={() => { setEstadoFilter(estado); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors capitalize
              ${estadoFilter === estado
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
          >
            {estado || 'Todos'}
          </button>
        ))}
      </div>

      {/* Grid de unidades */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? [...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-3 w-1/2" />
                <div className="h-3 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            ))
          : data?.data?.map((unit) => (
              <Link
                key={unit._id}
                to={`/unidades/${unit._id}`}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Building2 size={20} className="text-blue-600" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ESTADO_COLORS[unit.estado] || 'bg-gray-100 text-gray-600'}`}>
                    {unit.estado?.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">
                  {unit.torre ? `Torre ${unit.torre} - ` : ''}Apt. {unit.numero}
                </h3>
                <p className="text-sm text-gray-500 mt-1 capitalize">{unit.tipo}</p>
                {unit.propietario_actual && (
                  <p className="text-xs text-gray-400 mt-2 truncate">
                    {unit.propietario_actual.nombres} {unit.propietario_actual.apellidos}
                  </p>
                )}
                <div className="flex items-center justify-end mt-3 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs">Ver detalle</span>
                  <ChevronRight size={14} />
                </div>
              </Link>
            ))}
      </div>

      {/* Paginación */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {data.pagination.total} unidades en total
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">
              Anterior
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.pages}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitsPage;
