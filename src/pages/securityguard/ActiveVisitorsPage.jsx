/**
 * src/pages/securityguard/ActiveVisitorsPage.jsx
 */

import { useState, useEffect } from 'react';
import { Shield, RefreshCw, Clock, X } from 'lucide-react';
import { getActiveVisitors, registerExit } from '@/api/securityguard.api';

const ActiveVisitorsPage = () => {
  const [activos, setActivos]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saliendo, setSaliendo] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await getActiveVisitors();
      setActivos(res.data?.active || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const handleSalidaRapida = async (log) => {
    if (!confirm(`¿Registrar salida de ${getNombre(log)}?`)) return;
    setSaliendo(log._id);
    try {
      await registerExit({
        tipo_persona:     log.tipo_persona,
        persona_id:       log.persona_id?._id,
        nombre_visitante: log.nombre_visitante,
        doc_visitante:    log.doc_visitante,
        unit_destino:     log.unit_destino?._id,
        porteria:         log.porteria,
      });
      cargar();
    } catch { alert('Error al registrar la salida'); }
    finally { setSaliendo(null); }
  };

  const getNombre = (log) => {
    if (log.persona_id) return `${log.persona_id.nombres} ${log.persona_id.apellidos}`;
    if (log.nombre_visitante) return log.nombre_visitante;
    return 'Sin nombre';
  };

  const tiempoAdentro = (fecha) => {
    const diff = Date.now() - new Date(fecha).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  const TIPO_LABEL = {
    residente: 'Residente', visitante: 'Visitante',
    proveedor: 'Proveedor', empleado: 'Empleado', delivery: 'Delivery',
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Adentro Ahora</h1>
            <p className="text-gray-500 text-sm">
              {activos.length} persona(s) en el conjunto
            </p>
          </div>
        </div>
        <button onClick={cargar}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300
            text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Cargando...</div>
      ) : activos.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
          <Shield size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 text-lg font-medium">No hay personas adentro</p>
          <p className="text-gray-300 text-sm mt-1">El conjunto está despejado</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Encabezados */}
          <div className="grid grid-cols-5 px-6 py-3 border-b border-gray-100 bg-gray-50">
            {['Persona', 'Tipo', 'Unidad', 'Tiempo adentro', 'Acción'].map(h => (
              <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {h}
              </p>
            ))}
          </div>
          {activos.map((v, idx) => (
            <div key={v._id}
              className={`grid grid-cols-5 px-6 py-4 items-center hover:bg-gray-50
                transition-colors ${idx < activos.length - 1 ? 'border-b border-gray-100' : ''}`}>

              <div>
                <p className="text-gray-800 text-sm font-medium">{getNombre(v)}</p>
                {v.doc_visitante && (
                  <p className="text-gray-400 text-xs">{v.doc_visitante}</p>
                )}
              </div>

              <p className="text-gray-500 text-sm">
                {TIPO_LABEL[v.tipo_persona] || v.tipo_persona}
              </p>

              <p className="text-gray-500 text-sm">
                {v.unit_destino
                  ? `Apto ${v.unit_destino.numero}${v.unit_destino.torre ? ` · Torre ${v.unit_destino.torre}` : ''}`
                  : '—'}
              </p>

              <div className="flex items-center gap-1.5 text-yellow-600">
                <Clock size={13} />
                <span className="text-sm font-medium">{tiempoAdentro(v.timestamp)}</span>
              </div>

              <div>
                <button onClick={() => handleSalidaRapida(v)}
                  disabled={saliendo === v._id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50
                    hover:bg-red-100 text-red-600 border border-red-200 rounded-lg
                    text-xs font-medium transition-colors disabled:opacity-50">
                  <X size={12} />
                  {saliendo === v._id ? 'Registrando...' : 'Registrar Salida'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveVisitorsPage;