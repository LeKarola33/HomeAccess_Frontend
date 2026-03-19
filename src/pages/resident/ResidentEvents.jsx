/**
 * src/pages/resident/ResidentEvents.jsx
 * Eventos del conjunto — solo lectura para el residente
 */

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { getEvents } from '@/api/resident.api';

const BORDE_TIPO = {
  obligatorio: 'border-l-red-500',
  opcional:    'border-l-pink-400',
};

const BADGE_TIPO = {
  obligatorio: { icon: '⚠️', label: 'Obligatorio', cls: 'bg-orange-100 text-orange-700 border border-orange-200' },
  opcional:    { icon: '🌸', label: 'Opcional',    cls: 'bg-pink-100 text-pink-700 border border-pink-200' },
};

const BADGE_ESTADO = {
  programado: { label: 'Programado', cls: 'bg-blue-100 text-blue-700 border border-blue-200' },
  en_curso:   { label: 'En curso',   cls: 'bg-green-100 text-green-700 border border-green-200' },
  finalizado: { label: 'Finalizado', cls: 'bg-gray-100 text-gray-600 border border-gray-200' },
  cancelado:  { label: 'Cancelado',  cls: 'bg-red-100 text-red-700 border border-red-200' },
};

const ResidentEvents = () => {
  const [proximos, setProximos] = useState([]);
  const [pasados,  setPasados]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [filtro,   setFiltro]   = useState('todos');

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await getEvents();
      setProximos(res.data?.upcoming || []);
      setPasados(res.data?.past      || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const todos = [...proximos, ...pasados];
  const filtrados = filtro === 'todos'
    ? todos
    : filtro === 'obligatorio' || filtro === 'opcional'
      ? todos.filter(e => e.tipo === filtro)
      : todos.filter(e => e.estado === filtro);

  const TarjetaEvento = ({ e }) => {
    const badgeTipo   = BADGE_TIPO[e.tipo]     || BADGE_TIPO.opcional;
    const badgeEstado = BADGE_ESTADO[e.estado] || BADGE_ESTADO.programado;
    const borde       = BORDE_TIPO[e.tipo]     || 'border-l-gray-400';

    return (
      <div className={`bg-white rounded-xl border border-gray-200 border-l-4
        ${borde} p-4 shadow-sm hover:shadow-md transition-shadow`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-gray-900 font-semibold text-base leading-tight">
            {e.titulo}
          </h3>
          <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
            <span className={`inline-flex items-center gap-1 text-xs font-medium
              px-2 py-0.5 rounded-full ${badgeTipo.cls}`}>
              <span style={{ fontSize: 11 }}>{badgeTipo.icon}</span>
              {badgeTipo.label}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeEstado.cls}`}>
              {badgeEstado.label}
            </span>
          </div>
        </div>
        {e.descripcion && (
          <p className="text-gray-500 text-sm mb-3 leading-relaxed">{e.descripcion}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {e.fecha_inicio && (
            <span>
              📅 {new Date(e.fecha_inicio).toLocaleDateString('es-CO', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
              })}
              {' · '}
              {new Date(e.fecha_inicio).toLocaleTimeString('es-CO', {
                hour: '2-digit', minute: '2-digit',
              })}
              {e.fecha_fin && (
                <> – {new Date(e.fecha_fin).toLocaleTimeString('es-CO', {
                  hour: '2-digit', minute: '2-digit',
                })}</>
              )}
            </span>
          )}
          {e.lugar && <span>📍 {e.lugar}</span>}
          {e.cupo_maximo > 0 && <span>👥 Cupo: {e.cupo_maximo} personas</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-1">HomeAccess › Eventos</p>
        <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
        <p className="text-gray-400 text-sm mt-0.5">{todos.length} evento(s)</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: 'todos',       label: 'Todos' },
          { value: 'obligatorio', label: '⚠️ Obligatorios' },
          { value: 'opcional',    label: '🌸 Opcionales' },
          { value: 'programado',  label: 'Programados' },
          { value: 'en_curso',    label: 'En curso' },
          { value: 'finalizado',  label: 'Finalizados' },
        ].map(opt => (
          <button key={opt.value} onClick={() => setFiltro(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border
              ${filtro === opt.value
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20">
          <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">No hay eventos registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(e => <TarjetaEvento key={e._id} e={e} />)}
        </div>
      )}
    </div>
  );
};

export default ResidentEvents;
