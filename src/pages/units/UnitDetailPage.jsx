/**
 * HomeAccess - Detalle de Unidad
 * ================================
 * Muestra residentes, propietario, vehículos y estado de la unidad.
 * Ruta: /unidades/:id
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUnitById } from '@/api/resources.api';
import { ArrowLeft, Building2, Users, Car } from 'lucide-react';

const UnitDetailPage = () => {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['units', id],
    queryFn: () => getUnitById(id),
  });

  if (isLoading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-48 bg-gray-200 rounded" />
    </div>
  );

  const unit = data?.data;

  const ESTADO_COLORS = {
    ocupado: 'bg-emerald-100 text-emerald-700',
    desocupado: 'bg-gray-100 text-gray-600',
    en_mantenimiento: 'bg-orange-100 text-orange-700',
    en_venta: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Link to="/unidades" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} />
        Volver a Unidades
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Building2 size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {unit?.torre ? `Torre ${unit.torre} - ` : ''}Apartamento {unit?.numero}
              </h2>
              <p className="text-sm text-gray-500 capitalize">Piso {unit?.piso} · {unit?.tipo}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${ESTADO_COLORS[unit?.estado]}`}>
            {unit?.estado?.replace('_', ' ')}
          </span>
        </div>

        {/* Propietario */}
        {unit?.propietario_actual && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Users size={14} /> Propietario
            </h3>
            <p className="text-sm text-gray-600 ml-5">
              {unit.propietario_actual.nombres} {unit.propietario_actual.apellidos}
            </p>
            <p className="text-xs text-gray-400 ml-5">{unit.propietario_actual.email}</p>
          </div>
        )}

        {/* Residentes */}
        {unit?.residentes?.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Users size={14} /> Residentes ({unit.residentes.length})
            </h3>
            <div className="ml-5 space-y-1">
              {unit.residentes.map((r) => (
                <p key={r._id} className="text-sm text-gray-600">
                  {r.nombres} {r.apellidos}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Mascotas */}
        {unit?.mascotas?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">🐾 Mascotas registradas</h3>
            <div className="flex flex-wrap gap-2 ml-2">
              {unit.mascotas.map((m, i) => (
                <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                  {m.nombre} ({m.especie})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitDetailPage;
