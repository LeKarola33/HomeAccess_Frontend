/**
 * CommonAreasPage.jsx
 * Admin: aprobar reservas + ver disponibilidad por fecha
 * Portero: solo ver disponibilidad (sin aprobar)
 */

import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import {
  getAreas, createArea, updateArea, changeAreaStatus,
} from '@/services/commonAreaService';
import {
  AREA_TYPE_LABELS, AREA_TYPE_ICONS, AREA_STATUS_CONFIG,
  AreaStatusBadge, Spinner, Toast, Modal, EmptyState,
  PrimaryButton, SecondaryButton, DangerButton,
  FormField, Input, Select, Textarea,
} from '@/utils/commonAreaUtils';

const BASE     = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const getToken = () => { try { return JSON.parse(localStorage.getItem('homeaccess-auth'))?.state?.accessToken || null; } catch { return null; } };
const apiFetch = async (path, opts = {}) => {
  const r = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, ...opts,
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Error');
  return d;
};
const useAuth = () => { try { return JSON.parse(localStorage.getItem('homeaccess-auth'))?.state?.user || {}; } catch { return {}; } };

const ESTADO_BADGE = {
  pendiente: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  aprobada:  'bg-green-100  text-green-700  border border-green-200',
  rechazada: 'bg-red-100    text-red-700    border border-red-200',
  cancelada: 'bg-gray-100   text-gray-500   border border-gray-200',
};

// ── Modal principal: Reservas + Disponibilidad ────────────────────────────────
const AreaBookingsModal = ({ area, isAdmin, onClose }) => {
  const today = new Date().toISOString().split('T')[0];
  const [tab,        setTab]        = useState(isAdmin ? 'reservas' : 'disponibilidad');
  const [fecha,      setFecha]      = useState(today);
  const [reservas,   setReservas]   = useState([]);
  const [pendientes, setPendientes] = useState([]); // todas las pendientes sin filtro fecha
  const [loading,    setLoading]    = useState(false);
  const [toast,      setToast]      = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      // Reservas del día seleccionado (para disponibilidad)
      const r = await apiFetch(`/bookings?area_id=${area._id}&fecha=${fecha}`);
      setReservas(r.data || []);
      // Todas las pendientes sin filtro de fecha (para que admin las vea siempre)
      if (isAdmin) {
        const p = await apiFetch(`/bookings?area_id=${area._id}&estado=pendiente`);
        setPendientes(p.data || []);
      }
    } catch {
      setReservas([]);
      setPendientes([]);
    } finally { setLoading(false); }
  }, [area._id, fecha, isAdmin]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = async (id, estado) => {
    try {
      await apiFetch(`/bookings/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });
      setToast(
        estado === 'aprobada'  ? '✅ Reserva aprobada'  :
        estado === 'rechazada' ? '❌ Reserva rechazada' : '🚫 Reserva cancelada'
      );
      setTimeout(() => setToast(''), 2500);
      cargar();
    } catch (err) { alert(err.message); }
  };

  // Estado de cada franja para el día seleccionado
  const franjas = area.franjas_horarias || [];
  const franjaInfo = (f) => {
    const r = reservas.find(r => r.franja === f && ['pendiente', 'aprobada'].includes(r.estado));
    if (!r) return { estado: 'libre' };
    return { estado: r.estado, reserva: r };
  };

  // Contadores
  const totalPendientes = pendientes.length;
  const aprobadas       = reservas.filter(r => r.estado === 'aprobada').length;
  const libres          = franjas.filter(f => franjaInfo(f).estado === 'libre').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{AREA_TYPE_ICONS[area.tipo] || '🏛️'}</span>
              <div>
                <h2 className="text-base font-semibold text-gray-800">{area.nombre}</h2>
                <p className="text-xs text-gray-400">{AREA_TYPE_LABELS[area.tipo]}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-xl shrink-0">×</button>
          </div>

          {/* Selector de fecha */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <CalendarDays size={15} className="text-gray-400 shrink-0" />
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-violet-400 bg-white" />
            <span className="text-xs text-gray-400">
              {new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>

          {/* Contadores rápidos */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Libres hoy',       val: libres,          color: 'bg-green-50  text-green-700  border-green-200'  },
              { label: 'Pendientes total', val: totalPendientes, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
              { label: 'Aprobadas hoy',    val: aprobadas,       color: 'bg-blue-50   text-blue-700   border-blue-200'   },
            ].map(({ label, val, color }) => (
              <div key={label} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${color}`}>
                <span className="font-bold">{val}</span> {label}
              </div>
            ))}
          </div>

          {/* Tabs — solo admin */}
          {isAdmin && (
            <div className="flex gap-1 mt-3 bg-gray-100 rounded-xl p-1 w-fit">
              {[
                { val: 'reservas',       label: `📋 Gestionar reservas${totalPendientes > 0 ? ` (${totalPendientes})` : ''}` },
                { val: 'disponibilidad', label: '🗓️ Ver disponibilidad' },
              ].map(({ val, label }) => (
                <button key={val} onClick={() => setTab(val)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${tab === val
                      ? `bg-white shadow-sm ${val === 'reservas' && totalPendientes > 0 ? 'text-yellow-600' : 'text-indigo-600'}`
                      : 'text-gray-500 hover:text-gray-700'}`}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">

          {/* ── TAB: DISPONIBILIDAD ── */}
          {(tab === 'disponibilidad' || !isAdmin) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Estado de franjas — {new Date(fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
              </p>
              {franjas.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-400">Esta área no tiene franjas horarias configuradas</p>
                </div>
              ) : loading ? (
                <div className="text-center py-6 text-gray-400 text-sm">Cargando disponibilidad...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {franjas.map(f => {
                    const { estado, reserva } = franjaInfo(f);
                    return (
                      <div key={f} className={`p-3 rounded-xl border text-center
                        ${estado === 'libre'     ? 'bg-green-50  border-green-200'  :
                          estado === 'pendiente' ? 'bg-yellow-50 border-yellow-200' :
                                                   'bg-red-50    border-red-200'}`}>
                        <p className="text-sm font-bold text-gray-800">{f}</p>
                        {estado === 'libre' ? (
                          <p className="text-xs text-green-600 font-medium mt-1">✅ Disponible</p>
                        ) : estado === 'pendiente' ? (
                          <>
                            <p className="text-xs text-yellow-600 font-medium mt-1">⏳ Pendiente</p>
                            {reserva?.unit_id?.numero && <p className="text-xs text-gray-500 mt-0.5">Apto {reserva.unit_id.numero}</p>}
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-red-600 font-medium mt-1">🔴 Reservado</p>
                            {reserva?.unit_id?.numero && <p className="text-xs text-gray-500 mt-0.5">Apto {reserva.unit_id.numero}</p>}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-4 mt-3">
                {[{ color:'bg-green-400', label:'Disponible' }, { color:'bg-yellow-400', label:'Pendiente' }, { color:'bg-red-400', label:'Reservado' }].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />{label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: GESTIONAR RESERVAS (solo admin) ── */}
          {tab === 'reservas' && isAdmin && (
            <div className="space-y-5">

              {/* Sección pendientes — todas las fechas */}
              {loading ? (
                <div className="text-center py-6 text-gray-400 text-sm">Cargando reservas...</div>
              ) : pendientes.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
                  <CalendarDays size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500">Sin reservas pendientes</p>
                  <p className="text-xs text-gray-400 mt-1">No hay reservas que requieran aprobación</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                      ⏳ Pendientes por aprobar ({pendientes.length})
                    </p>
                  </div>
                  <div className="space-y-3">
                    {pendientes.map(r => (
                      <div key={r._id} className="p-4 rounded-xl border bg-yellow-50 border-yellow-200">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <Clock size={13} className="text-gray-400 shrink-0" />
                              <span className="text-sm font-bold text-gray-800">{r.franja || 'Sin franja'}</span>
                              {r.fecha_inicio && (
                                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-lg border border-gray-200">
                                  📅 {new Date(r.fecha_inicio).toLocaleDateString('es-CO', { weekday:'short', day:'numeric', month:'short' })}
                                </span>
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs text-gray-700">🏠 <span className="font-medium">Unidad:</span> {r.unit_id?.numero ? `Apto ${r.unit_id.numero}${r.unit_id.torre ? ` · Torre ${r.unit_id.torre}` : ''}` : '—'}</p>
                              <p className="text-xs text-gray-700">👤 <span className="font-medium">Residente:</span> {r.usuario_id ? `${r.usuario_id.nombres} ${r.usuario_id.apellidos}` : '—'}</p>
                              {r.usuario_id?.celular && <p className="text-xs text-gray-500">📱 {r.usuario_id.celular}</p>}
                              {r.observaciones && <p className="text-xs text-gray-400 italic mt-1">💬 "{r.observaciones}"</p>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button onClick={() => cambiarEstado(r._id, 'aprobada')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors">
                              <CheckCircle size={13} /> Aprobar
                            </button>
                            <button onClick={() => cambiarEstado(r._id, 'rechazada')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition-colors">
                              <XCircle size={13} /> Rechazar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reservas del día seleccionado */}
              {!loading && reservas.filter(r => r.estado !== 'pendiente').length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Otras reservas del día ({reservas.filter(r => r.estado !== 'pendiente').length})
                  </p>
                  <div className="space-y-3">
                    {reservas.filter(r => r.estado !== 'pendiente').map(r => (
                      <div key={r._id} className={`p-4 rounded-xl border
                        ${r.estado === 'aprobada' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <Clock size={13} className="text-gray-400 shrink-0" />
                              <span className="text-sm font-bold text-gray-800">{r.franja || 'Sin franja'}</span>
                              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${ESTADO_BADGE[r.estado]}`}>
                                {r.estado === 'aprobada' ? '✅ Aprobada' : r.estado === 'rechazada' ? '❌ Rechazada' : '🚫 Cancelada'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700">🏠 {r.unit_id?.numero ? `Apto ${r.unit_id.numero}` : '—'}</p>
                            <p className="text-xs text-gray-700">👤 {r.usuario_id ? `${r.usuario_id.nombres} ${r.usuario_id.apellidos}` : '—'}</p>
                          </div>
                          {r.estado === 'aprobada' && (
                            <button onClick={() => cambiarEstado(r._id, 'cancelada')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg border border-gray-200 transition-colors shrink-0">
                              <XCircle size={13} /> Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Toast interno */}
        {toast && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-xl shadow-lg z-10">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
};

// ── AreaCard ──────────────────────────────────────────────────────────────────
const AreaCard = ({ area, isAdmin, isPortero, onEdit, onChangeStatus, onBlockUnit, onVerReservas, pendingCount = 0 }) => (
  <div className={`group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${area.estado !== 'activa' ? 'opacity-80' : ''}`}>
    <div className={`h-2 w-full ${
      area.tipo === 'piscina'       ? 'bg-cyan-400'    :
      area.tipo === 'salon_eventos' ? 'bg-violet-400'  :
      area.tipo === 'bbq'           ? 'bg-orange-400'  :
      area.tipo === 'cancha'        ? 'bg-emerald-400' :
      area.tipo === 'gimnasio'      ? 'bg-rose-400'    : 'bg-indigo-400'}`} />
    <div className="p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{AREA_TYPE_ICONS[area.tipo] || '📍'}</span>
          <div>
            <h3 className="font-semibold text-slate-800 text-base leading-tight">{area.nombre}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{AREA_TYPE_LABELS[area.tipo]}</p>
          </div>
        </div>
        <AreaStatusBadge status={area.estado} />
      </div>

      {area.descripcion && <p className="text-sm text-slate-500 mb-4 line-clamp-2">{area.descripcion}</p>}

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-slate-50 rounded-xl p-2.5 text-center">
          <p className="text-xs text-slate-400 mb-0.5">Capacidad</p>
          <p className="text-sm font-semibold text-slate-700">{area.capacidad_maxima > 0 ? `${area.capacidad_maxima} pers.` : 'Sin límite'}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-2.5 text-center">
          <p className="text-xs text-slate-400 mb-0.5">Aprobación</p>
          <p className="text-sm font-semibold text-slate-700">{area.requiere_aprobacion ? 'Manual' : 'Automática'}</p>
        </div>
      </div>

      {area.franjas_horarias?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-1.5">Horarios</p>
          <div className="flex flex-wrap gap-1">
            {area.franjas_horarias.slice(0,3).map(f => (
              <span key={f} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-lg font-medium">{f}</span>
            ))}
            {area.franjas_horarias.length > 3 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-lg">+{area.franjas_horarias.length - 3}</span>
            )}
          </div>
        </div>
      )}

      {area.motivo_bloqueo && (
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-xs text-amber-700">⚠️ {area.motivo_bloqueo}</p>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={() => onVerReservas(area)}
          className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors relative">
          {isAdmin ? <><CheckCircle size={14} /> Reservas</> : <><Eye size={14} /> Disponibilidad</>}
          {isAdmin && pendingCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 text-gray-900 text-xs font-black rounded-full flex items-center justify-center shadow">
              {pendingCount}
            </span>
          )}
        </button>
        {isAdmin && (
          <>
            <button onClick={() => onEdit(area)} className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors" title="Editar">✏️</button>
            <button onClick={() => onChangeStatus(area)} className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors" title="Estado">🔄</button>
            <button onClick={() => onBlockUnit(area)} className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors" title="Bloquear unidad">🔒</button>
          </>
        )}
      </div>
    </div>
  </div>
);

// ── AreaFormModal ─────────────────────────────────────────────────────────────
const AreaFormModal = ({ area, onClose, onSaved }) => {
  const isEditing = Boolean(area?._id);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [form, setForm] = useState({
    nombre: area?.nombre || '', tipo: area?.tipo || 'salon_eventos',
    descripcion: area?.descripcion || '', capacidad_maxima: area?.capacidad_maxima || 20,
    requiere_aprobacion: area?.requiere_aprobacion ?? true,
    anticipacion_minima_horas: area?.anticipacion_minima_horas || 24,
    franjas_horarias: area?.franjas_horarias?.join(', ') || '08:00-10:00, 10:00-12:00, 14:00-16:00, 16:00-18:00',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setErrors({ nombre: 'Requerido' }); return; }
    setLoading(true);
    try {
      const payload = { ...form, franjas_horarias: form.franjas_horarias.split(',').map(s => s.trim()).filter(Boolean) };
      isEditing ? await updateArea(area._id, payload) : await createArea(payload);
      onSaved();
    } catch (err) { setErrors({ general: err.message }); }
    finally { setLoading(false); }
  };
  return (
    <Modal title={isEditing ? 'Editar área' : 'Nueva área común'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{errors.general}</div>}
        <FormField label="Nombre" required error={errors.nombre}><Input value={form.nombre} onChange={e => set('nombre', e.target.value)} error={errors.nombre} placeholder="Ej: Salón Principal" /></FormField>
        <FormField label="Tipo" required><Select value={form.tipo} onChange={e => set('tipo', e.target.value)}>{Object.entries(AREA_TYPE_LABELS).map(([val, label]) => <option key={val} value={val}>{AREA_TYPE_ICONS[val]} {label}</option>)}</Select></FormField>
        <FormField label="Descripción"><Textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción del área..." /></FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Capacidad máxima"><Input type="number" min="1" value={form.capacidad_maxima} onChange={e => set('capacidad_maxima', Number(e.target.value))} /></FormField>
          <FormField label="Anticipación mínima (h)"><Input type="number" min="0" value={form.anticipacion_minima_horas} onChange={e => set('anticipacion_minima_horas', Number(e.target.value))} /></FormField>
        </div>
        <FormField label="Franjas horarias (separadas por coma)">
          <Input value={form.franjas_horarias} onChange={e => set('franjas_horarias', e.target.value)} placeholder="08:00-10:00, 10:00-12:00" />
          <p className="text-xs text-slate-400 mt-1">Formato: HH:MM-HH:MM separadas por coma</p>
        </FormField>
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
          <div><p className="text-sm font-medium text-slate-700">Requiere aprobación manual</p><p className="text-xs text-slate-400">El admin aprueba cada reserva</p></div>
          <button type="button" onClick={() => set('requiere_aprobacion', !form.requiere_aprobacion)}
            className={`w-11 h-6 rounded-full transition-colors ${form.requiere_aprobacion ? 'bg-indigo-600' : 'bg-slate-300'}`}>
            <span className={`block w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-0.5 ${form.requiere_aprobacion ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
        <div className="flex gap-3 pt-2">
          <SecondaryButton onClick={onClose} className="flex-1">Cancelar</SecondaryButton>
          <PrimaryButton type="submit" disabled={loading} className="flex-1">{loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear área'}</PrimaryButton>
        </div>
      </form>
    </Modal>
  );
};

// ── StatusModal ───────────────────────────────────────────────────────────────
const StatusModal = ({ area, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ estado: area.estado, motivo_bloqueo: area.motivo_bloqueo || '', fecha_reapertura: '' });
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await changeAreaStatus(area._id, form); onSaved(); } catch (err) { alert(err.message); } finally { setLoading(false); }
  };
  return (
    <Modal title={`Estado de "${area.nombre}"`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Estado"><Select value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}><option value="activa">✅ Activa</option><option value="sin_servicio">⚠️ Sin servicio</option><option value="mantenimiento">🔧 Mantenimiento</option></Select></FormField>
        {form.estado !== 'activa' && <FormField label="Motivo"><Textarea value={form.motivo_bloqueo} onChange={e => setForm(p => ({ ...p, motivo_bloqueo: e.target.value }))} placeholder="Motivo del cierre..." /></FormField>}
        {form.estado === 'mantenimiento' && <FormField label="Fecha estimada de reapertura"><Input type="date" value={form.fecha_reapertura} onChange={e => setForm(p => ({ ...p, fecha_reapertura: e.target.value }))} /></FormField>}
        <div className="flex gap-3 pt-2"><SecondaryButton onClick={onClose} className="flex-1">Cancelar</SecondaryButton><PrimaryButton type="submit" disabled={loading} className="flex-1">{loading ? 'Guardando...' : 'Cambiar estado'}</PrimaryButton></div>
      </form>
    </Modal>
  );
};

// ── BlockUnitModal ────────────────────────────────────────────────────────────
const BlockUnitModal = ({ area, onClose, onSaved }) => {
  const [unitId, setUnitId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const handleBlock = async (e) => {
    e.preventDefault(); if (!unitId.trim()) return; setLoading(true);
    try { const { blockUnit } = await import('@/services/commonAreaService'); await blockUnit(area._id, { unit_id: unitId, motivo }); onSaved('Unidad bloqueada'); }
    catch (err) { alert(err.message); } finally { setLoading(false); }
  };
  const handleUnblock = async () => {
    if (!unitId.trim()) return; setLoading(true);
    try { const { unblockUnit } = await import('@/services/commonAreaService'); await unblockUnit(area._id, { unit_id: unitId }); onSaved('Unidad desbloqueada'); }
    catch (err) { alert(err.message); } finally { setLoading(false); }
  };
  return (
    <Modal title={`Bloqueo — ${area.nombre}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">💡 Ingresa el ID de la unidad para bloquear o desbloquear su acceso.</div>
        <FormField label="ID de la unidad"><Input value={unitId} onChange={e => setUnitId(e.target.value)} placeholder="_id de la unidad" /></FormField>
        <FormField label="Motivo"><Input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej: Mora en cuota" /></FormField>
        {area.unidades_bloqueadas?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Bloqueadas actualmente:</p>
            {area.unidades_bloqueadas.map(b => (
              <div key={b._id} className="flex items-center justify-between p-2 bg-red-50 rounded-xl text-xs mb-1">
                <span className="text-red-700 font-mono">{b.unit_id?.numero ? `Unidad ${b.unit_id.numero}` : b.unit_id}</span>
                <span className="text-red-500">{b.motivo}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <SecondaryButton onClick={onClose} className="flex-1">Cerrar</SecondaryButton>
          <DangerButton onClick={handleBlock} disabled={loading || !unitId} className="flex-1">🔒 Bloquear</DangerButton>
          <PrimaryButton onClick={handleUnblock} disabled={loading || !unitId} className="flex-1">🔓 Desbloquear</PrimaryButton>
        </div>
      </div>
    </Modal>
  );
};

// ── CommonAreasPage ───────────────────────────────────────────────────────────
export default function CommonAreasPage() {
  const user      = useAuth();
  const isAdmin   = user?.role === 'admin';
  const isPortero = user?.role === 'portero';

  const [areas,         setAreas]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [toast,         setToast]         = useState(null);
  const [filter,        setFilter]        = useState('all');
  const [formModal,     setFormModal]     = useState(null);
  const [statusModal,   setStatusModal]   = useState(null);
  const [blockModal,    setBlockModal]    = useState(null);
  const [reservasModal, setReservasModal] = useState(null);
  const [pendingCounts, setPendingCounts] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAreas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAreas();
      const areasData = res.data || [];
      setAreas(areasData);
      // Cargar conteo de pendientes por área (solo admin)
      if (isAdmin) {
        const counts = {};
        await Promise.all(areasData.map(async (a) => {
          try {
            const r = await apiFetch(`/bookings?area_id=${a._id}&estado=pendiente`);
            counts[a._id] = (r.data || []).length;
          } catch { counts[a._id] = 0; }
        }));
        setPendingCounts(counts);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { loadAreas(); }, [loadAreas]);

  const filteredAreas = areas.filter(a => filter === 'all' || a.estado === filter);

  const handleSaved = (msg = 'Cambios guardados') => {
    setFormModal(null);
    setStatusModal(null);
    setBlockModal(null);
    showToast(msg);
    loadAreas();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Áreas Comunes</h1>
            <p className="text-sm text-slate-400">{areas.length} área{areas.length !== 1 ? 's' : ''} registrada{areas.length !== 1 ? 's' : ''}</p>
          </div>
          {isAdmin && <PrimaryButton onClick={() => setFormModal('new')}>+ Nueva área</PrimaryButton>}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { val:'all',           label:'Todas'            },
            { val:'activa',        label:'✅ Activas'       },
            { val:'sin_servicio',  label:'⚠️ Sin servicio'  },
            { val:'mantenimiento', label:'🔧 Mantenimiento' },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${filter === val ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filteredAreas.length === 0 ? (
          <EmptyState icon="🏢" title="Sin áreas comunes"
            description={isAdmin ? 'Crea la primera área común del conjunto.' : 'No hay áreas disponibles.'}
            action={isAdmin && <PrimaryButton onClick={() => setFormModal('new')}>+ Crear primera área</PrimaryButton>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAreas.map(area => (
              <AreaCard key={area._id} area={area} isAdmin={isAdmin} isPortero={isPortero}
                pendingCount={pendingCounts[area._id] || 0}
                onEdit={a => setFormModal(a)}
                onChangeStatus={a => setStatusModal(a)}
                onBlockUnit={a => setBlockModal(a)}
                onVerReservas={a => setReservasModal(a)} />
            ))}
          </div>
        )}
      </div>

      {formModal     && <AreaFormModal area={formModal === 'new' ? null : formModal} onClose={() => setFormModal(null)} onSaved={() => handleSaved(formModal === 'new' ? 'Área creada' : 'Área actualizada')} />}
      {statusModal   && <StatusModal  area={statusModal}  onClose={() => setStatusModal(null)}  onSaved={() => handleSaved('Estado actualizado')} />}
      {blockModal    && <BlockUnitModal area={blockModal} onClose={() => setBlockModal(null)} onSaved={handleSaved} />}
      {reservasModal && <AreaBookingsModal area={reservasModal} isAdmin={isAdmin} onClose={() => setReservasModal(null)} />}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}