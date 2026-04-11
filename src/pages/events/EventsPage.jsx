/**
 * EventsPage.jsx — Compartido por admin, portero y residente
 * Ruta: /eventos  (admin/portero) | /residente/eventos (residente)
 *
 * ADMIN:    crea, edita, cambia estado, cancela
 * PORTERO:  solo lectura
 * RESIDENTE: ve eventos y confirma asistencia
 */

import { useState, useEffect, useCallback } from 'react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const getToken = () => {
  try {
    const raw = localStorage.getItem('homeaccess-auth');
    if (!raw) return null;
    return JSON.parse(raw)?.state?.accessToken || null;
  } catch { return null; }
};

const authH = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });
const api = async (path, opts = {}) => {
  const r = await fetch(`${BASE}${path}`, { headers: authH(), ...opts });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Error del servidor');
  return d;
};

const getEvents    = (params = {}) => api(`/events?${new URLSearchParams(params)}`);
const createEvent  = (data)        => api('/events', { method: 'POST', body: JSON.stringify(data) });
const updateEvent  = (id, data)    => api(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
const cancelEvent  = (id, motivo)  => api(`/events/${id}/cancelar`, { method: 'PATCH', body: JSON.stringify({ motivo }) });
const changeStatus = (id, estado)  => api(`/events/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });
const confirmAttendance = (id, data) => api(`/events/${id}/confirmar`, { method: 'POST', body: JSON.stringify(data) });

const useAuth = () => {
  try {
    const raw = localStorage.getItem('homeaccess-auth');
    if (!raw) return {};
    return JSON.parse(raw)?.state?.user || {};
  } catch { return {}; }
};

const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const formatTime = (iso) => iso ? new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '';

const STATUS_CFG = {
  programado: { label: 'Programado', bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  en_curso:   { label: 'En curso',   bg: 'bg-emerald-100',text: 'text-emerald-700',dot: 'bg-emerald-500' },
  finalizado: { label: 'Finalizado', bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400' },
  cancelado:  { label: 'Cancelado',  bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-400' },
};

const TYPE_CFG = {
  obligatorio: { label: 'Obligatorio', bg: 'bg-rose-50', text: 'text-rose-700', icon: '⚠️' },
  opcional:    { label: 'Opcional',    bg: 'bg-sky-50',  text: 'text-sky-700',  icon: '📌' },
};

const Spinner = () => (
  <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
);

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3
    rounded-xl text-white text-sm shadow-2xl
    ${type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
    {msg}
    <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">✕</button>
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative z-50 bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">
          ✕
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ── EventFormModal ─────────────────────────────────────────────
const EventFormModal = ({ event, onClose, onSaved }) => {
  const isEditing = Boolean(event?._id);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form, setForm] = useState({
    titulo:      event?.titulo      || '',
    tipo:        event?.tipo        || 'obligatorio',
    descripcion: event?.descripcion || '',
    fecha_inicio: event?.fecha_inicio ? event.fecha_inicio.slice(0, 16) : '',
    fecha_fin:    event?.fecha_fin    ? event.fecha_fin.slice(0, 16)    : '',
    lugar:       event?.lugar       || '',
    cupo_maximo: event?.cupo_maximo || 0,
    requiere_confirmacion: event?.requiere_confirmacion ?? false,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo || !form.fecha_inicio || !form.fecha_fin || !form.lugar) {
      setError('Completa los campos obligatorios'); return;
    }
    setLoading(true); setError('');
    try {
      isEditing ? await updateEvent(event._id, form) : await createEvent(form);
      onSaved(isEditing ? 'Evento actualizado' : 'Evento creado');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title={isEditing ? 'Editar evento' : 'Nuevo evento'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Título <span className="text-red-500">*</span></label>
          <input value={form.titulo} onChange={e => set('titulo', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"
            placeholder="Ej: Asamblea Ordinaria 2025" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Tipo <span className="text-red-500">*</span></label>
            <select value={form.tipo} onChange={e => set('tipo', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 bg-white">
              <option value="obligatorio">⚠️ Obligatorio</option>
              <option value="opcional">📌 Opcional</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Cupo máximo</label>
            <input type="number" min="0" value={form.cupo_maximo}
              onChange={e => set('cupo_maximo', Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400" />
            <p className="text-xs text-slate-400">0 = sin límite</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Inicio <span className="text-red-500">*</span></label>
            <input type="datetime-local" value={form.fecha_inicio}
              onChange={e => set('fecha_inicio', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Fin <span className="text-red-500">*</span></label>
            <input type="datetime-local" value={form.fecha_fin}
              onChange={e => set('fecha_fin', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Lugar <span className="text-red-500">*</span></label>
          <input value={form.lugar} onChange={e => set('lugar', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"
            placeholder="Ej: Salón de Eventos" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Descripción</label>
          <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 resize-none"
            placeholder="Detalles del evento..." />
        </div>
        {form.tipo === 'obligatorio' && (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-slate-700">Requiere confirmación de asistencia</p>
              <p className="text-xs text-slate-400">Los residentes deben confirmar/declinar</p>
            </div>
            <button type="button" onClick={() => set('requiere_confirmacion', !form.requiere_confirmacion)}
              className={`w-11 h-6 rounded-full transition-colors ${form.requiere_confirmacion ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <span className={`block w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-0.5
                ${form.requiere_confirmacion ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear evento'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── CancelModal ────────────────────────────────────────────────
const CancelModal = ({ event, onClose, onDone }) => {
  const [motivo,  setMotivo]  = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!motivo.trim()) return;
    setLoading(true);
    try { await cancelEvent(event._id, motivo); onDone('Evento cancelado'); }
    catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Cancelar evento" onClose={onClose}>
      <form onSubmit={handle} className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-600">
          <p className="font-medium">{event.titulo}</p>
          <p className="text-slate-400">{formatDate(event.fecha_inicio)}</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Motivo <span className="text-red-500">*</span></label>
          <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 resize-none"
            placeholder="Explica el motivo de la cancelación..." />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl">
            No cancelar
          </button>
          <button type="submit" disabled={loading || !motivo.trim()}
            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Cancelando...' : 'Cancelar evento'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── ConfirmAttendanceModal ─────────────────────────────────────
const ConfirmAttendanceModal = ({ event, onClose, onDone }) => {
  const user = useAuth();
  const [respuesta,     setRespuesta]     = useState('confirmado');
  const [delegado,      setDelegado]      = useState('');
  const [justificacion, setJustificacion] = useState('');
  const [loading,       setLoading]       = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!user.unidades?.[0]) { alert('No tienes unidades asignadas'); return; }
    setLoading(true);
    try {
      await confirmAttendance(event._id, {
        unit_id: user.unidades[0],
        respuesta,
        delegado_nombre: respuesta === 'delegado' ? delegado : undefined,
        justificacion: justificacion || undefined,
      });
      const msgs = { confirmado: 'Asistencia confirmada ✓', declinado: 'Inasistencia registrada', delegado: `Delegado: ${delegado}` };
      onDone(msgs[respuesta]);
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Confirmar asistencia" onClose={onClose}>
      <form onSubmit={handle} className="space-y-4">
        <div className="p-3 bg-indigo-50 rounded-xl text-sm">
          <p className="font-medium text-indigo-800">{event.titulo}</p>
          <p className="text-indigo-600">{formatDate(event.fecha_inicio)} · {formatTime(event.fecha_inicio)}</p>
          <p className="text-indigo-500">📍 {event.lugar}</p>
        </div>
        <div className="space-y-2">
          {[
            { val: 'confirmado', label: '✅ Asistiré',            desc: 'Confirmo mi asistencia' },
            { val: 'declinado',  label: '❌ No asistiré',         desc: 'No podré asistir' },
            { val: 'delegado',   label: '👤 Envío representante', desc: 'Alguien irá en mi nombre' },
          ].map(({ val, label, desc }) => (
            <button key={val} type="button" onClick={() => setRespuesta(val)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all
                ${respuesta === val ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center
                ${respuesta === val ? 'border-indigo-600' : 'border-slate-300'}`}>
                {respuesta === val && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            </button>
          ))}
        </div>
        {respuesta === 'delegado' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Nombre del representante <span className="text-red-500">*</span></label>
            <input value={delegado} onChange={e => setDelegado(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"
              placeholder="Nombre completo" />
          </div>
        )}
        {respuesta === 'declinado' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Justificación (opcional)</label>
            <textarea value={justificacion} onChange={e => setJustificacion(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 resize-none"
              placeholder="Motivo de inasistencia..." />
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl">
            Cancelar
          </button>
          <button type="submit" disabled={loading || (respuesta === 'delegado' && !delegado.trim())}
            className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Enviando...' : 'Confirmar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── EventCard ──────────────────────────────────────────────────
const EventCard = ({ event, isAdmin, isResident, onEdit, onCancel, onChangeStatus, onConfirm }) => {
  const statusCfg     = STATUS_CFG[event.estado] || STATUS_CFG.programado;
  const typeCfg       = TYPE_CFG[event.tipo]     || TYPE_CFG.opcional;
  const isCancellable = ['programado', 'en_curso'].includes(event.estado);

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden
      transition-all hover:shadow-md ${event.estado === 'cancelado' ? 'opacity-60' : ''}`}>
      <div className={`h-1.5 w-full ${event.tipo === 'obligatorio' ? 'bg-rose-400' : 'bg-sky-400'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 text-base leading-tight truncate">
              {event.titulo}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeCfg.bg} ${typeCfg.text}`}>
                {typeCfg.icon} {typeCfg.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>📅</span>
            <span>{formatDate(event.fecha_inicio)} · {formatTime(event.fecha_inicio)} – {formatTime(event.fecha_fin)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>📍</span>
            <span className="truncate">{event.lugar}</span>
          </div>
          {event.cupo_maximo > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>👥</span>
              <span>Cupo: {event.cupo_maximo} personas</span>
            </div>
          )}
        </div>

        {event.descripcion && (
          <p className="text-sm text-slate-400 mb-4 line-clamp-2">{event.descripcion}</p>
        )}

        {event.estado === 'cancelado' && event.motivo_cancelacion && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
            Cancelado: {event.motivo_cancelacion}
          </div>
        )}

        {/* Botón confirmar — solo residente */}
        {isResident && event.tipo === 'obligatorio' &&
          event.requiere_confirmacion && event.estado === 'programado' && (
          <button onClick={() => onConfirm(event)}
            className="w-full mb-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700
              text-sm font-medium rounded-xl border border-indigo-200 transition-colors">
            ✋ Confirmar asistencia
          </button>
        )}

        {/* Acciones — solo admin */}
        {isAdmin && (
          <div className="flex gap-2">
            {event.estado === 'programado' && (
              <>
                <button onClick={() => onEdit(event)}
                  className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600
                    text-xs font-medium rounded-lg border border-slate-200 transition-colors">
                  ✏️ Editar
                </button>
                <button onClick={() => onChangeStatus(event, 'en_curso')}
                  className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700
                    text-xs font-medium rounded-lg border border-emerald-200 transition-colors">
                  ▶ Iniciar
                </button>
              </>
            )}
            {event.estado === 'en_curso' && (
              <button onClick={() => onChangeStatus(event, 'finalizado')}
                className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600
                  text-xs font-medium rounded-lg border border-slate-200 transition-colors">
                ⏹ Finalizar
              </button>
            )}
            {isCancellable && (
              <button onClick={() => onCancel(event)}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700
                  text-xs font-medium rounded-lg border border-red-200 transition-colors">
                ✕
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── EventsPage (principal) ─────────────────────────────────────
export default function EventsPage() {
  const user       = useAuth();
  const isAdmin    = user?.role === 'admin';
  const isResident = ['residente', 'propietario'].includes(user?.role);

  const [events,       setEvents]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState(null);
  const [typeFilter,   setTypeFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('programado');
  const [formModal,    setFormModal]    = useState(null);
  const [cancelModal,  setCancelModal]  = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter)   params.tipo   = typeFilter;
      if (statusFilter) params.estado = statusFilter;
      const r = await getEvents(params);
      setEvents(r.data || []);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }, [typeFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleChangeStatus = async (event, estado) => {
    try {
      await changeStatus(event._id, estado);
      showToast(estado === 'en_curso' ? 'Evento iniciado' : 'Evento finalizado');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Eventos</h1>
            <p className="text-sm text-slate-400">
              {events.length} evento{events.length !== 1 ? 's' : ''}
            </p>
          </div>
          {isAdmin && (
            <button onClick={() => setFormModal('new')}
              className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium
                rounded-xl hover:bg-indigo-700 transition-colors">
              + Nuevo evento
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {[
            { val: '',            label: 'Todos' },
            { val: 'obligatorio', label: '⚠️ Obligatorios' },
            { val: 'opcional',    label: '📌 Opcionales' },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => setTypeFilter(val)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                ${typeFilter === val
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}>
              {label}
            </button>
          ))}

          <div className="w-px bg-slate-200 mx-1 self-stretch" />

          {[
            { val: 'programado', label: 'Programados' },
            { val: 'en_curso',   label: 'En curso' },
            { val: 'finalizado', label: 'Finalizados' },
            { val: 'cancelado',  label: 'Cancelados' },
            { val: '',           label: 'Todos los estados' },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => setStatusFilter(val)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                ${statusFilter === val
                  ? 'bg-slate-700 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📅</div>
            <p className="font-medium text-slate-600">Sin eventos</p>
            <p className="text-sm text-slate-400 mt-1">
              {isAdmin
                ? 'Crea el primer evento del conjunto'
                : 'No hay eventos programados por ahora'}
            </p>
            {isAdmin && (
              <button onClick={() => setFormModal('new')}
                className="mt-4 px-4 py-2.5 bg-indigo-600 text-white text-sm
                  font-medium rounded-xl hover:bg-indigo-700">
                + Crear evento
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(ev => (
              <EventCard
                key={ev._id}
                event={ev}
                isAdmin={isAdmin}
                isResident={isResident}
                onEdit={setFormModal}
                onCancel={setCancelModal}
                onChangeStatus={handleChangeStatus}
                onConfirm={setConfirmModal}
              />
            ))}
          </div>
        )}
      </div>

      {formModal && (
        <EventFormModal
          event={formModal === 'new' ? null : formModal}
          onClose={() => setFormModal(null)}
          onSaved={(msg) => { setFormModal(null); showToast(msg); load(); }}
        />
      )}
      {cancelModal && (
        <CancelModal
          event={cancelModal}
          onClose={() => setCancelModal(null)}
          onDone={(msg) => { setCancelModal(null); showToast(msg); load(); }}
        />
      )}
      {confirmModal && (
        <ConfirmAttendanceModal
          event={confirmModal}
          onClose={() => setConfirmModal(null)}
          onDone={(msg) => { setConfirmModal(null); showToast(msg); }}
        />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}