/**
 * src/pages/resident/ResidentPackages.jsx
 * Solo muestra los paquetes del residente autenticado
 */

import { useState, useEffect } from 'react';
import { Package, RefreshCw } from 'lucide-react';
import { getMyPackages } from '@/api/resident.api';

const ESTADO_CFG = {
  en_porteria: { label: 'En portería', cls: 'bg-yellow-100 text-yellow-700 border border-yellow-200', dot: 'bg-yellow-400' },
  entregado:   { label: 'Entregado',   cls: 'bg-green-100 text-green-700 border border-green-200',   dot: 'bg-green-500' },
  devuelto:    { label: 'Devuelto',    cls: 'bg-gray-100 text-gray-600 border border-gray-200',       dot: 'bg-gray-400' },
  perdido:     { label: 'Perdido',     cls: 'bg-red-100 text-red-700 border border-red-200',          dot: 'bg-red-500' },
};

const TIPO_ICONS = {
  paquete: '📦', sobre: '✉️', documento: '📄', perecedero: '🥗', otro: '📫',
};

const ResidentPackages = () => {
  const [paquetes, setPaquetes]         = useState([]);
  const [resumen, setResumen]           = useState({});
  const [loading, setLoading]           = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroEstado) params.status = filtroEstado;
      const res = await getMyPackages(params);
      setPaquetes(res.data?.packages || []);
      setResumen(res.data?.resumen   || {});
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [filtroEstado]);

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      {/* Encabezado */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-1">HomeAccess › Mis Paquetes</p>
        <h1 className="text-2xl font-bold text-gray-900">Mis Paquetes</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { k: 'en_porteria', label: 'En portería', dot: 'bg-yellow-400' },
          { k: 'entregado',   label: 'Entregado',   dot: 'bg-green-500' },
          { k: 'devuelto',    label: 'Devuelto',    dot: 'bg-gray-400' },
          { k: 'perdido',     label: 'Perdido',     dot: 'bg-red-500' },
        ].map(({ k, label, dot }) => (
          <div key={k} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className={`w-3 h-3 rounded-full ${dot} mb-2`} />
            <p className="text-3xl font-bold text-gray-900">{resumen[k] || 0}</p>
            <p className="text-gray-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <p className="text-gray-600 text-sm font-medium">
            {paquetes.length} paquete(s)
          </p>
          <div className="flex items-center gap-2">
            {[
              { value: '',            label: 'Todos' },
              { value: 'en_porteria', label: 'En portería' },
              { value: 'entregado',   label: 'Entregado' },
              { value: 'devuelto',    label: 'Devuelto' },
            ].map(opt => (
              <button key={opt.value} onClick={() => setFiltroEstado(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium
                  transition-colors border
                  ${filtroEstado === opt.value
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                {opt.label}
              </button>
            ))}
            <button onClick={cargar}
              className="p-1.5 text-gray-400 hover:text-gray-600">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Encabezados */}
        <div className="grid grid-cols-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
          {['Tipo', 'Guía / Remitente', 'Recibido', 'Estado'].map(h => (
            <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {/* Filas */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : paquetes.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No tienes paquetes registrados</p>
          </div>
        ) : paquetes.map((p, idx) => {
          const estadoCfg = ESTADO_CFG[p.estado] || ESTADO_CFG.en_porteria;
          return (
            <div key={p._id}
              className={`grid grid-cols-4 px-5 py-4 items-center hover:bg-gray-50
                transition-colors ${idx < paquetes.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center
                  justify-center text-lg shrink-0">
                  {TIPO_ICONS[p.tipo] || '📦'}
                </div>
                <div>
                  <p className="text-gray-800 text-sm font-medium capitalize">{p.tipo}</p>
                  {p.transportadora && (
                    <p className="text-gray-400 text-xs">{p.transportadora}</p>
                  )}
                </div>
              </div>
              <div>
                {p.guia && <p className="text-gray-700 text-sm font-medium">{p.guia}</p>}
                {p.remitente && <p className="text-gray-400 text-xs">De: {p.remitente}</p>}
                {!p.guia && !p.remitente && <p className="text-gray-300 text-sm">—</p>}
              </div>
              <p className="text-gray-600 text-sm">
                {new Date(p.fecha_recepcion).toLocaleDateString('es-CO', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </p>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
                px-2.5 py-1 rounded-full w-fit ${estadoCfg.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dot}`} />
                {estadoCfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResidentPackages;
