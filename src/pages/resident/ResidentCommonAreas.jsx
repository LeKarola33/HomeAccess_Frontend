/**
 * src/pages/resident/ResidentCommonAreas.jsx
 * Áreas comunes — solo lectura para el residente
 */

import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { getCommonAreas } from '@/api/resident.api';

const ICONOS = {
  salon_eventos: '🎉', piscina: '🏊', gimnasio: '💪',
  cancha: '⚽', bbq: '🔥', parque: '🌳', otro: '🏛️',
};

const TIPO_LABEL = {
  salon_eventos: 'Salón de Eventos', piscina: 'Piscina',
  gimnasio: 'Gimnasio', cancha: 'Cancha', bbq: 'BBQ',
  parque: 'Parque', otro: 'Otro',
};

const ESTADO_CFG = {
  activa:        { label: 'Activa',        cls: 'bg-green-100 text-green-700 border border-green-200' },
  sin_servicio:  { label: 'Sin servicio',  cls: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  mantenimiento: { label: 'Mantenimiento', cls: 'bg-red-100 text-red-700 border border-red-200' },
};

export const ResidentCommonAreas = () => {
  const [areas, setAreas]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro]   = useState('todas');

  const cargar = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtro === 'activas')       params.estado = 'activa';
      if (filtro === 'sin_servicio')  params.estado = 'sin_servicio';
      if (filtro === 'mantenimiento') params.estado = 'mantenimiento';
      const res = await getCommonAreas(params);
      setAreas(res.data?.areas || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [filtro]);

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-1">HomeAccess › Áreas Comunes</p>
        <h1 className="text-2xl font-bold text-gray-900">Áreas Comunes</h1>
        <p className="text-gray-400 text-sm mt-0.5">{areas.length} área(s) registrada(s)</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: 'todas',         label: 'Todas',          activeClass: 'bg-violet-600 text-white border-violet-600' },
          { value: 'activas',       label: '✅ Activas',     activeClass: 'bg-green-500 text-white border-green-500' },
          { value: 'sin_servicio',  label: '⚠️ Sin servicio', activeClass: 'bg-yellow-500 text-white border-yellow-500' },
          { value: 'mantenimiento', label: '⚙️ Mantenimiento',activeClass: 'bg-gray-700 text-white border-gray-700' },
        ].map(opt => (
          <button key={opt.value} onClick={() => setFiltro(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border
              ${filtro === opt.value
                ? opt.activeClass
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : areas.length === 0 ? (
        <div className="text-center py-20">
          <Building2 size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">No hay áreas comunes registradas</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-5">
          {areas.map(a => {
            const estadoCfg = ESTADO_CFG[a.estado] || ESTADO_CFG.activa;
            return (
              <div key={a._id} style={{ width: '280px' }}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm
                  hover:shadow-md transition-shadow overflow-hidden flex flex-col
                  border-l-4 border-l-violet-500">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center
                        justify-center text-xl shrink-0">
                        {ICONOS[a.tipo] || '🏛️'}
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold text-sm">{a.nombre}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{TIPO_LABEL[a.tipo] || a.tipo}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${estadoCfg.cls}`}>
                      {a.estado === 'activa' ? '● Activa' : estadoCfg.label}
                    </span>
                  </div>
                  {a.descripcion && (
                    <p className="text-gray-500 text-sm mb-3 leading-relaxed">{a.descripcion}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {a.capacidad_maxima > 0 && (
                      <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                        <p className="text-gray-400 text-xs">Capacidad</p>
                        <p className="text-gray-800 text-sm font-bold mt-0.5">
                          {a.capacidad_maxima} pers.
                        </p>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      <p className="text-gray-400 text-xs">Aprobación</p>
                      <p className="text-gray-800 text-sm font-bold mt-0.5">
                        {a.requiere_aprobacion ? 'Manual' : 'Automática'}
                      </p>
                    </div>
                  </div>
                  {a.franjas_horarias?.length > 0 && (
                    <div>
                      <p className="text-gray-400 text-xs mb-1.5">Horarios disponibles</p>
                      <div className="flex flex-wrap gap-1">
                        {a.franjas_horarias.slice(0, 3).map(f => (
                          <span key={f} className="text-xs px-2 py-0.5 rounded-md bg-blue-50
                            text-blue-600 border border-blue-100 font-medium">
                            {f}
                          </span>
                        ))}
                        {a.franjas_horarias.length > 3 && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100
                            text-gray-500 border border-gray-200 font-medium">
                            +{a.franjas_horarias.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-5 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center">
                    {a.estado === 'activa'
                      ? 'Contacta a administración para reservar'
                      : `⚠️ ${estadoCfg.label} — No disponible`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResidentCommonAreas;
