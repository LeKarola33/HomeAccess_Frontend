/**
 * src/pages/resident/ResidentCommonAreas.jsx
 * Áreas comunes — residente puede ver y RESERVAR áreas
 */

import { useState, useEffect } from 'react';
import { Building2, CalendarDays, Clock, X, CheckCircle, AlertCircle } from 'lucide-react';
import { getCommonAreas } from '@/api/resident.api';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');

const getToken = () => {
  try { return JSON.parse(localStorage.getItem('homeaccess-auth'))?.state?.accessToken || null; }
  catch { return null; }
};

const useAuth = () => {
  try { return JSON.parse(localStorage.getItem('homeaccess-auth'))?.state?.user || {}; }
  catch { return {}; }
};

const apiFetch = async (path, opts = {}) => {
  const r = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    ...opts,
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Error del servidor');
  return d;
};

const ICONOS     = { salon_eventos:'🎉', piscina:'🏊', gimnasio:'💪', cancha:'⚽', bbq:'🔥', parque:'🌳', otro:'🏛️' };
const TIPO_LABEL = { salon_eventos:'Salón de Eventos', piscina:'Piscina', gimnasio:'Gimnasio', cancha:'Cancha', bbq:'BBQ', parque:'Parque', otro:'Otro' };

const ESTADO_BADGE = {
  pendiente:  'bg-yellow-100 text-yellow-700 border border-yellow-200',
  aprobada:   'bg-green-100  text-green-700  border border-green-200',
  rechazada:  'bg-red-100    text-red-700    border border-red-200',
  cancelada:  'bg-gray-100   text-gray-500   border border-gray-200',
};

// ── Modal de reserva ──────────────────────────────────────────────────────────
const BookingModal = ({ area, onClose, onSaved }) => {
  const user = useAuth();
  const [fecha,       setFecha]       = useState('');
  const [franja,      setFranja]      = useState('');
  const [obs,         setObs]         = useState('');
  const [ocupadas,    setOcupadas]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [loadingDisp, setLoadingDisp] = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Cargar franjas ocupadas cuando cambia la fecha
  useEffect(() => {
    if (!fecha) return;
    setLoadingDisp(true);
    apiFetch(`/bookings/area/${area._id}/disponibilidad?fecha=${fecha}`)
      .then(r => setOcupadas(r.data || []))
      .catch(() => setOcupadas([]))
      .finally(() => setLoadingDisp(false));
  }, [fecha, area._id]);

  const franjaOcupada = (f) => ocupadas.some(o => o.franja === f);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!fecha) return setError('Selecciona una fecha');
    if (!franja && area.franjas_horarias?.length > 0) return setError('Selecciona un horario');

    // Construir fecha_inicio y fecha_fin
    const [h1, h2] = franja ? franja.split('-') : ['00:00', '23:59'];
    const fecha_inicio = `${fecha}T${h1}:00`;
    const fecha_fin    = `${fecha}T${h2}:00`;

    // Obtener unit_id del usuario
    const unitId = user.unidades?.[0];
    if (!unitId) return setError('No tienes una unidad asignada');

    setLoading(true);
    try {
      const r = await apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({ area_id: area._id, unit_id: unitId, fecha_inicio, fecha_fin, franja, observaciones: obs }),
      });
      setSuccess(r.message);
      setTimeout(() => { onSaved(); onClose(); }, 1800);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inp = `w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all bg-white`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{ICONOS[area.tipo] || '🏛️'}</span>
            <div>
              <h2 className="text-base font-semibold text-gray-800">Reservar — {area.nombre}</h2>
              <p className="text-xs text-gray-400">{TIPO_LABEL[area.tipo]}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-xl">×</button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle size={48} className="text-green-500 mx-auto" />
              <p className="font-semibold text-gray-800">{success}</p>
              <p className="text-sm text-gray-400">Cerrando...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle size={16} className="shrink-0" />{error}
                </div>
              )}

              {area.requiere_aprobacion && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                  <AlertCircle size={16} className="shrink-0" />
                  Esta área requiere aprobación del administrador
                </div>
              )}

              {/* Fecha */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  📅 Fecha *
                </label>
                <input type="date" value={fecha} min={today}
                  onChange={e => { setFecha(e.target.value); setFranja(''); }}
                  className={inp} required />
              </div>

              {/* Franjas horarias */}
              {area.franjas_horarias?.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    🕐 Horario disponible *
                  </label>
                  {loadingDisp ? (
                    <div className="text-center py-3 text-sm text-gray-400">Verificando disponibilidad...</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {area.franjas_horarias.map(f => {
                        const ocupada  = franjaOcupada(f);
                        const selected = franja === f;
                        return (
                          <button key={f} type="button"
                            disabled={ocupada || !fecha}
                            onClick={() => setFranja(f)}
                            className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all text-center
                              ${ocupada
                                ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed line-through'
                                : selected
                                ? 'bg-violet-600 border-violet-600 text-white shadow-md'
                                : !fecha
                                ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-violet-400 hover:bg-violet-50'}`}>
                            <span className="block">{f}</span>
                            {ocupada && <span className="text-xs font-normal">Ocupado</span>}
                            {!ocupada && !selected && fecha && <span className="text-xs text-green-500 font-normal">Disponible</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {!fecha && (
                    <p className="text-xs text-gray-400 mt-1.5">Selecciona primero una fecha para ver disponibilidad</p>
                  )}
                </div>
              )}

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  📝 Observaciones (opcional)
                </label>
                <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
                  placeholder="Ej: Celebración de cumpleaños, se necesitan sillas adicionales..."
                  className={`${inp} resize-none`} />
              </div>

              {/* Info capacidad */}
              {area.capacidad_maxima > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                  <span>👥</span> Capacidad máxima: <strong>{area.capacidad_maxima} personas</strong>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Reservando...</>
                    : <><CalendarDays size={16} />Confirmar reserva</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Modal mis reservas ────────────────────────────────────────────────────────
const MisReservasModal = ({ onClose }) => {
  const [reservas,  setReservas]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    apiFetch('/bookings')
      .then(r => setReservas(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cancelar = async (id) => {
    if (!confirm('¿Cancelar esta reserva?')) return;
    try {
      await apiFetch(`/bookings/${id}`, { method: 'DELETE' });
      setReservas(p => p.map(r => r._id === id ? { ...r, estado: 'cancelada' } : r));
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-800">📋 Mis Reservas</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-xl">×</button>
        </div>
        <div className="overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Cargando reservas...</div>
          ) : reservas.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CalendarDays size={40} className="mx-auto mb-3 text-gray-300" />
              <p>No tienes reservas registradas</p>
            </div>
          ) : (
            reservas.map(r => (
              <div key={r._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{r.area_id?.nombre || '—'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.fecha_inicio ? new Date(r.fecha_inicio).toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' }) : '—'}
                      {r.franja && ` · ${r.franja}`}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${ESTADO_BADGE[r.estado] || ''}`}>
                    {r.estado}
                  </span>
                </div>
                {r.observaciones && <p className="text-xs text-gray-400 mb-2">{r.observaciones}</p>}
                {['pendiente','aprobada'].includes(r.estado) && (
                  <button onClick={() => cancelar(r._id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                    Cancelar reserva
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
export const ResidentCommonAreas = () => {
  const [areas,       setAreas]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [filtro,      setFiltro]      = useState('todas');
  const [bookingArea, setBookingArea] = useState(null);
  const [showMisRes,  setShowMisRes]  = useState(false);
  const [toast,       setToast]       = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtro !== 'todas') params.estado = filtro;
      const res = await getCommonAreas(params);
      setAreas(res.data?.areas || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [filtro]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1">HomeAccess › Áreas Comunes</p>
          <h1 className="text-2xl font-bold text-gray-900">Áreas Comunes</h1>
          <p className="text-gray-400 text-sm mt-0.5">{areas.length} área(s) registrada(s)</p>
        </div>
        <button onClick={() => setShowMisRes(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors">
          <CalendarDays size={15} /> Mis reservas
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value:'todas',         label:'Todas',            activeClass:'bg-violet-600 text-white border-violet-600' },
          { value:'activa',        label:'✅ Activas',       activeClass:'bg-green-500 text-white border-green-500' },
          { value:'sin_servicio',  label:'⚠️ Sin servicio',  activeClass:'bg-yellow-500 text-white border-yellow-500' },
          { value:'mantenimiento', label:'⚙️ Mantenimiento', activeClass:'bg-gray-700 text-white border-gray-700' },
        ].map(opt => (
          <button key={opt.value} onClick={() => setFiltro(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border
              ${filtro === opt.value ? opt.activeClass : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
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
          {areas.map(a => (
            <div key={a._id} style={{ width:'280px' }}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col border-l-4 border-l-violet-500">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-xl shrink-0">
                      {ICONOS[a.tipo] || '🏛️'}
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold text-sm">{a.nombre}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{TIPO_LABEL[a.tipo] || a.tipo}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0
                    ${a.estado === 'activa' ? 'bg-green-100 text-green-700 border border-green-200'
                    : a.estado === 'mantenimiento' ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
                    {a.estado === 'activa' ? '● Activa' : a.estado === 'mantenimiento' ? 'Mantenimiento' : 'Sin servicio'}
                  </span>
                </div>

                {a.descripcion && (
                  <p className="text-gray-500 text-sm mb-3 leading-relaxed">{a.descripcion}</p>
                )}

                <div className="grid grid-cols-2 gap-2 mb-3">
                  {a.capacidad_maxima > 0 && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      <p className="text-gray-400 text-xs">Capacidad</p>
                      <p className="text-gray-800 text-sm font-bold mt-0.5">{a.capacidad_maxima} pers.</p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <p className="text-gray-400 text-xs">Aprobación</p>
                    <p className="text-gray-800 text-sm font-bold mt-0.5">{a.requiere_aprobacion ? 'Manual' : 'Automática'}</p>
                  </div>
                </div>

                {a.franjas_horarias?.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-xs mb-1.5">Horarios disponibles</p>
                    <div className="flex flex-wrap gap-1">
                      {a.franjas_horarias.slice(0,3).map(f => (
                        <span key={f} className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 font-medium">{f}</span>
                      ))}
                      {a.franjas_horarias.length > 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200 font-medium">+{a.franjas_horarias.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-gray-100">
                {a.estado === 'activa' ? (
                  <button onClick={() => setBookingArea(a)}
                    className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                    <CalendarDays size={15} /> Reservar
                  </button>
                ) : (
                  <p className="text-xs text-gray-400 text-center">
                    ⚠️ {a.estado === 'mantenimiento' ? 'En mantenimiento' : 'Sin servicio'} — No disponible
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {bookingArea && (
        <BookingModal
          area={bookingArea}
          onClose={() => setBookingArea(null)}
          onSaved={() => { showToast('✅ Reserva registrada'); cargar(); }}
        />
      )}
      {showMisRes && <MisReservasModal onClose={() => setShowMisRes(false)} />}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-green-500 text-white text-sm font-medium rounded-2xl shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
};

export default ResidentCommonAreas;
