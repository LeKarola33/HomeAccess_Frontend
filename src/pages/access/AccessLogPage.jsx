/**
 * HomeAccess - Página de Control de Acceso (Portería)
 * =====================================================
 * Permite a los porteros registrar entradas/salidas y ver el historial.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { getAccessLogs, createAccessLog } from '@/api/resources.api';
import { format } from 'date-fns';
import { PlusCircle, X } from 'lucide-react';

const AccessLogPage = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['access-logs', page],
    queryFn: () => getAccessLogs({ page, limit: 20 }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Mutación para crear un nuevo registro de acceso
  const mutation = useMutation({
    mutationFn: createAccessLog,
    onSuccess: () => {
      // Invalidar caché para que se actualice la lista
      queryClient.invalidateQueries({ queryKey: ['access-logs'] });
      queryClient.invalidateQueries({ queryKey: ['access-logs', 'active'] });
      reset();
      setShowForm(false);
    },
  });

  const onSubmit = (data) => mutation.mutate(data);

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Control de Acceso</h2>
          <p className="text-sm text-gray-500">Registro de ingresos y salidas del conjunto</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} />
          Registrar Acceso
        </button>
      </div>

      {/* === FORMULARIO MODAL: Registrar acceso === */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-semibold text-gray-800">Registrar Acceso</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

              {/* Tipo de persona */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Persona</label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${errors.tipo_persona ? 'border-red-400' : 'border-gray-300'}`}
                  {...register('tipo_persona', { required: 'Requerido' })}
                >
                  <option value="">Seleccionar...</option>
                  <option value="residente">Residente</option>
                  <option value="visitante">Visitante</option>
                  <option value="proveedor">Proveedor</option>
                  <option value="empleado">Empleado</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              {/* Nombre del visitante */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre completo del visitante"
                  {...register('nombre_visitante')}
                />
              </div>

              {/* Tipo de acceso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Acceso</label>
                <div className="grid grid-cols-2 gap-3">
                  {['entrada', 'salida'].map((tipo) => (
                    <label key={tipo} className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                      <input type="radio" value={tipo} {...register('tipo_acceso', { required: true })} className="accent-blue-600" />
                      <span className="text-sm capitalize font-medium">{tipo}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Portería */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Portería</label>
                <select
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${errors.porteria ? 'border-red-400' : 'border-gray-300'}`}
                  {...register('porteria', { required: 'Requerido' })}
                >
                  <option value="">Seleccionar portería...</option>
                  <option value="Principal">Principal</option>
                  <option value="Parqueadero">Parqueadero</option>
                  <option value="Peatonal">Peatonal</option>
                </select>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Notas adicionales..."
                  {...register('observaciones')}
                />
              </div>

              {/* Error del servidor */}
              {mutation.isError && (
                <p className="text-sm text-red-600">
                  {mutation.error?.response?.data?.message || 'Error al registrar el acceso'}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={mutation.isPending}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors">
                  {mutation.isPending ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === TABLA DE REGISTROS === */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Persona</th>
              <th className="px-6 py-3 text-left">Tipo</th>
              <th className="px-6 py-3 text-left">Acceso</th>
              <th className="px-6 py-3 text-left">Portería</th>
              <th className="px-6 py-3 text-left">Fecha y Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              // Skeleton loading
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 animate-pulse rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.data?.length > 0 ? (
              data.data.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {log.persona_id
                      ? `${log.persona_id.nombres} ${log.persona_id.apellidos}`
                      : log.nombre_visitante || 'Desconocido'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 capitalize">{log.tipo_persona}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      log.tipo_acceso === 'entrada'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {log.tipo_acceso}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{log.porteria}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  No hay registros de acceso
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginación */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Página {page} de {data.pagination.pages} ({data.pagination.total} registros)
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
    </div>
  );
};

export default AccessLogPage;
