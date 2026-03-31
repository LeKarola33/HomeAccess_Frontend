/**
 * src/pages/securityguard/PreAuthorizedVisitors.jsx
 */

import { useState, useEffect } from 'react';
import { Search, RefreshCw, CheckCircle, LogOut } from 'lucide-react';
import apiClient from '@/api/apiClient';

const TIPO_LABEL = {
  visita:    '👤 Visita',
  proveedor: '🔧 Proveedor',
  delivery:  '📦 Delivery',
  empleado:  '🧹 Empleado',
};

const PreAuthorizedVisitors = () => {
  const [visitantes, setVisitantes] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [busqueda, setBusqueda]     = useState('');
  const [filtro, setFiltro]         = useState('pendiente');
  const [accionando, setAccionando] = useState(null);

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

  const marcarIngreso = async (id) => {
    if (!confirm('¿Confirmar ingreso de este visitante?')) return;
    setAccionando(id);
    try {
      await apiClient.patch(`/resident/visitors/${id}/ingreso`);
      cargar();
    } catch (e) { alert(e.response?.data?.message || 'Error al registrar ingreso'); }
    finally { setAccionando(null); }
  };

  const marcarSalida = async (id) => {
    if (!confirm('¿Registrar salida de este visitante?')) return;
    setAccionando(id);
    try {
      await apiClient.patch(`/resident/visitors/${id}/salida`);
      cargar();
    } catch (e) { alert(e.response?.data?.message || 'Error al registrar salida'); }
    finally { setAccionando(null); }
  };

  const hoy = new Date().toDateString();

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Visitantes Pre-autorizados</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Residentes que esperan visitas — consulta antes de registrar un acceso
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6
        flex items-start gap-3">
        <span className="text-blue-500 shrink-0 mt-0.5">ℹ️</span>
        <p className="text-blue-700 text-sm">
          Cuando llegue un visitante, búscalo aquí para verificar si el residente
          lo pre-autorizó. Marca el ingreso cuando entre y la salida cuando se vaya.
        </p>
      </div>

      {/* Filtros + búsqueda */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && cargar()}
            placeholder="Buscar por nombre del visitante..."
            className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3
              py-2.5 text-gray-700 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <button onClick={cargar}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white
            rounded-lg text-sm font-semibold transition-colors">
          Buscar
        </button>
        <div className="flex gap-2">
          {[
            { value: 'pendiente', label: '🔵 Esperados' },
            { value: 'ingresado', label: '✅ Adentro' },
          ].map(opt => (
            <button key={opt.value} onClick={() => setFiltro(opt.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border
                ${filtro === opt.value
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        <button onClick={() => { setBusqueda(''); cargar(); }}
          className="p-2.5 bg-white border border-gray-300 rounded-lg
            text-gray-500 hover:bg-gray-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Cargando...</div>
      ) : visitantes.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
          <Search size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">
            No hay visitantes {filtro === 'pendiente' ? 'esperados' : 'adentro ahora'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-6 px-5 py-3 border-b border-gray-100 bg-gray-50">
            {['Visitante', 'Autorizado por', 'Apartamento', 'Tipo / Fecha', 'Estado', 'Acción'].map(h => (
              <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</p>
            ))}
          </div>

          {visitantes.map((v, idx) => {
            const esHoy = v.fecha_visita &&
              new Date(v.fecha_visita).toDateString() === hoy;
            const fechaStr = v.fecha_visita
              ? new Date(v.fecha_visita).toLocaleDateString('es-CO', {
                  weekday: 'short', day: 'numeric', month: 'short',
                })
              : '—';

            return (
              <div key={v._id}
                className={`grid grid-cols-6 px-5 py-4 items-center hover:bg-gray-50
                  transition-colors
                  ${idx < visitantes.length - 1 ? 'border-b border-gray-100' : ''}
                  ${v.estado === 'ingresado' ? 'bg-green-50/30' : ''}`}>

                {/* Visitante */}
                <div>
                  <p className="text-gray-800 text-sm font-semibold">{v.nombre_visitante}</p>
                  {v.doc_visitante && <p className="text-gray-400 text-xs">{v.doc_visitante}</p>}
                  {v.observaciones && (
                    <p className="text-gray-400 text-xs italic truncate max-w-[140px]">
                      {v.observaciones}
                    </p>
                  )}
                </div>

                {/* Residente */}
                <div>
                  {v.residente_id ? (
                    <>
                      <p className="text-gray-700 text-sm font-medium">
                        {v.residente_id.nombres} {v.residente_id.apellidos}
                      </p>
                      {v.residente_id.celular && (
                        <p className="text-blue-500 text-xs">{v.residente_id.celular}</p>
                      )}
                    </>
                  ) : <p className="text-gray-400 text-xs">—</p>}
                </div>

                {/* Apartamento */}
                <div>
                  {v.unit_destino ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold
                      px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      🏠 {v.unit_destino.torre ? `Torre ${v.unit_destino.torre} - ` : ''}Apto {v.unit_destino.numero}
                    </span>
                  ) : <p className="text-gray-400 text-xs">—</p>}
                </div>

                {/* Tipo / Fecha */}
                <div>
                  <p className="text-gray-600 text-sm">{TIPO_LABEL[v.tipo] || v.tipo}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-gray-400 text-xs">{fechaStr}</p>
                    {esHoy && (
                      <span className="text-xs font-bold text-orange-600
                        bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-200">
                        HOY
                      </span>
                    )}
                  </div>
                </div>

                {/* Estado */}
                <div>
                  {v.estado === 'pendiente' && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold
                      px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Pre-autorizado
                    </span>
                  )}
                  {v.estado === 'ingresado' && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold
                      px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Adentro
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                  {v.estado === 'pendiente' && (
                    <button
                      onClick={() => marcarIngreso(v._id)}
                      disabled={accionando === v._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50
                        hover:bg-green-100 text-green-700 border border-green-200
                        rounded-lg text-xs font-semibold transition-colors
                        disabled:opacity-50">
                      <CheckCircle size={13} />
                      {accionando === v._id ? '...' : 'Ingresó'}
                    </button>
                  )}
                  {v.estado === 'ingresado' && (
                    <button
                      onClick={() => marcarSalida(v._id)}
                      disabled={accionando === v._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50
                        hover:bg-red-100 text-red-600 border border-red-200
                        rounded-lg text-xs font-semibold transition-colors
                        disabled:opacity-50">
                      <LogOut size={13} />
                      {accionando === v._id ? '...' : 'Salió'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PreAuthorizedVisitors;