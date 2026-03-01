/**
 * HomeAccess - Página de Paquetes y Correspondencia
 * ===================================================
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPackages, createPackage, deliverPackage } from '@/api/resources.api';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { Package, PlusCircle, CheckCircle2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';

const ESTADO_COLORS = {
  en_porteria: 'bg-orange-100 text-orange-700',
  entregado: 'bg-emerald-100 text-emerald-700',
  devuelto: 'bg-gray-100 text-gray-600',
  perdido: 'bg-red-100 text-red-600',
};

const PackagesPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState('en_porteria');
  const [page, setPage] = useState(1);

  const isPorteroOrAdmin = ['admin', 'portero', 'vigilante'].includes(user?.role);

  const { data, isLoading } = useQuery({
    queryKey: ['packages', page, estadoFilter],
    queryFn: () => getPackages({ page, limit: 20, estado: estadoFilter }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const createMutation = useMutation({
    mutationFn: createPackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      reset();
      setShowForm(false);
    },
  });

  const deliverMutation = useMutation({
    mutationFn: ({ id, entregado_a }) => deliverPackage(id, { entregado_a }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['packages'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Paquetes y Correspondencia</h2>
          <p className="text-sm text-gray-500">Control de encomiendas en portería</p>
        </div>
        {isPorteroOrAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <PlusCircle size={16} />
            Registrar Paquete
          </button>
        )}
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2">
        {['en_porteria', 'entregado', 'devuelto'].map((estado) => (
          <button
            key={estado}
            onClick={() => { setEstadoFilter(estado); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors capitalize
              ${estadoFilter === estado
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
          >
            {estado.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Modal: Registrar paquete */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-semibold text-gray-800">Registrar Paquete</h3>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remitente</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Nombre del remitente" {...register('remitente')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transportadora</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  {...register('transportadora')}>
                  <option value="">Seleccionar...</option>
                  {['Servientrega', 'Coordinadora', 'Deprisa', 'TCC', 'Interrapidísimo', 'Amazon', 'Otro'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Guía</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Opcional" {...register('guia')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  {...register('tipo')}>
                  {['paquete', 'sobre', 'documento', 'perecedero', 'otro'].map(t => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>
              {createMutation.isError && (
                <p className="text-sm text-red-600">Error al registrar el paquete</p>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm disabled:bg-blue-400">
                  {createMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de paquetes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Paquete</th>
              <th className="px-6 py-3 text-left">Destinatario</th>
              <th className="px-6 py-3 text-left">Estado</th>
              <th className="px-6 py-3 text-left">Recibido</th>
              {isPorteroOrAdmin && estadoFilter === 'en_porteria' && (
                <th className="px-6 py-3 text-left">Acción</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 animate-pulse rounded" /></td>
                    ))}
                  </tr>
                ))
              : data?.data?.map((pkg) => (
                  <tr key={pkg._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Package size={16} className="text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{pkg.tipo}</p>
                          <p className="text-xs text-gray-400">{pkg.transportadora} {pkg.guia && `· ${pkg.guia}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {pkg.destinatario_id
                        ? `${pkg.destinatario_id.nombres} ${pkg.destinatario_id.apellidos}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ESTADO_COLORS[pkg.estado]}`}>
                        {pkg.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {format(new Date(pkg.fecha_recepcion), 'dd/MM/yyyy HH:mm')}
                    </td>
                    {isPorteroOrAdmin && estadoFilter === 'en_porteria' && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deliverMutation.mutate({ id: pkg._id, entregado_a: pkg.destinatario_id?._id })}
                          disabled={deliverMutation.isPending}
                          className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle2 size={14} />
                          Entregar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
            {!isLoading && data?.data?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  No hay paquetes en este estado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PackagesPage;
