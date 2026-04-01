/**
 * src/pages/visitors/VisitorsAdminPage.jsx
 * El admin ve todos los visitantes pre-autorizados por los residentes
 */

import { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import apiClient from '@/api/apiClient';

const TIPO_LABEL = {
  visita:    '👤 Visita',
  proveedor: '🔧 Proveedor',
  delivery:  '📦 Delivery',
  empleado:  '🧹 Empleado',
};

const VisitorsAdminPage = () => {
  const [visitantes, setVisitantes] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [busqueda, setBusqueda]     = useState('');
  const [filtro, setFiltro]         = useState('pendiente');

  const cargar = async () => {
    setLoading(true);
    try {
      const params = { estado: filtro };
      if (busqueda.trim()) params.nombre = busqueda.trim();
      const res = await apiClient.get('/resident/visitors/search', { params });
      setVisitantes(res.data?.data?.visitors || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [filtro]);

  const hoy = new Date().toDateString();

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Visitantes Pre-autorizados</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Visitantes registrados por los residentes del conjunto
          </p>
        </div>
      </div>

      {/* Filtros + búsqueda */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && cargar()}
            placeholder="Buscar por nombre..."
            className="bg-white border border-gray-300 rounded-lg pl-9 pr-3
              py-2 text-gray-700 text-sm focus:outline-none focus:border-blue-400 w-52"
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: 'pendiente', label: '🔵 Esperados' },
            { value: 'ingresado', label: '✅ Ingresaron' },
            { value: 'cancelado', label: '⚫ Cancelados' },
          ].map(opt => (
            <button key={opt.value} onClick={() => setFiltro(opt.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border
                ${filtro === opt.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        <button onClick={cargar}
          className="p-2 bg-white border border-gray-300 rounded-lg
            text-gray-500 hover:bg-gray-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Visitante</th>
              <th className="px-6 py-3 text-left">Autorizado por</th>
              <th className="px-6 py-3 text-left">Apartamento</th>
              <th className="px-6 py-3 text-left">Tipo</th>
              <th className="px-6 py-3 text-left">Fecha esperada</th>
              <th className="px-6 py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-200 animate-pulse rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : visitantes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                  No hay visitantes {filtro === 'pendiente' ? 'esperados' : filtro === 'ingresado' ? 'que hayan ingresado' : 'cancelados'}
                </td>
              </tr>
            ) : visitantes.map(v => {
              const esHoy = v.fecha_visita &&
                new Date(v.fecha_visita).toDateString() === hoy;
              return (
                <tr key={v._id} className={`hover:bg-gray-50 ${esHoy ? 'bg-green-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{v.nombre_visitante}</p>
                    {v.doc_visitante && (
                      <p className="text-xs text-gray-400">{v.doc_visitante}</p>
                    )}
                    {v.observaciones && (
                      <p className="text-xs text-gray-400 italic">{v.observaciones}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {v.residente_id ? (
                      <div>
                        <p className="text-gray-700 font-medium">
                          {v.residente_id.nombres} {v.residente_id.apellidos}
                        </p>
                        {v.residente_id.celular && (
                          <p className="text-blue-500 text-xs">{v.residente_id.celular}</p>
                        )}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {v.unit_destino ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold
                        px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        🏠 {v.unit_destino.torre ? `Torre ${v.unit_destino.torre} - ` : ''}
                        Apto {v.unit_destino.numero}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {TIPO_LABEL[v.tipo] || v.tipo}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-600 text-sm">
                        {v.fecha_visita
                          ? new Date(v.fecha_visita).toLocaleDateString('es-CO', {
                              weekday: 'short', day: 'numeric', month: 'short',
                            })
                          : '—'}
                      </p>
                      {esHoy && (
                        <span className="text-xs font-bold text-orange-600
                          bg-orange-50 px-1.5 py-0.5 rounded-full">HOY</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                      ${v.estado === 'pendiente'
                        ? 'bg-blue-100 text-blue-700'
                        : v.estado === 'ingresado'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'}`}>
                      {v.estado === 'pendiente' ? 'Esperado'
                        : v.estado === 'ingresado' ? 'Ingresó'
                        : 'Cancelado'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VisitorsAdminPage;
