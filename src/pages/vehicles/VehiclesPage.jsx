/**
 * VehiclesPage.jsx
 * Gestión de vehículos del conjunto residencial.
 * Ruta: /vehiculos
 */

import { useState, useEffect, useCallback } from 'react';

const TIPOS = [
  { value: 'carro',     label: 'Carro',     icon: '🚗', needsPlate: true  },
  { value: 'moto',      label: 'Moto',      icon: '🏍️', needsPlate: true  },
  { value: 'bicicleta', label: 'Bicicleta', icon: '🚲', needsPlate: false },
  { value: 'patineta',  label: 'Patineta',  icon: '🛴', needsPlate: false },
  { value: 'otro',      label: 'Otro',      icon: '🚐', needsPlate: false },
];

const TIPO_MAP = Object.fromEntries(TIPOS.map((t) => [t.value, t]));
const TIPO_COLORS = {
  carro:     'bg-blue-50   text-blue-700   border-blue-200',
  moto:      'bg-orange-50 text-orange-700 border-orange-200',
  bicicleta: 'bg-green-50  text-green-700  border-green-200',
  patineta:  'bg-purple-50 text-purple-700 border-purple-200',
  otro:      'bg-slate-50  text-slate-600  border-slate-200',
};

const BASE_URL = import.meta.env.VITE_API_URL || 'https://home-access-b.vercel.app/api/v1';

export default function VehiclesPage() {
  // ✅ Usar el store de Zustand (reactivo)
  const user    = useAuthStore(state => state.user);
  const isAdmin = user?.role === 'admin';
  // ...
}
//const getAuthState = () => { try { return JSON.parse(localStorage.getItem('homeaccess-auth'))?.state || {}; } catch { return {}; } };
//const getToken     = () => getAuthState().accessToken  || null;
//const getRefresh   = () => getAuthState().refreshToken || null;
//const useAuth      = () => getAuthState().user         || {};

const saveNewToken = (accessToken) => {
  try { const raw = localStorage.getItem('homeaccess-auth'); const store = JSON.parse(raw); store.state.accessToken = accessToken; localStorage.setItem('homeaccess-auth', JSON.stringify(store)); } catch {}
};

const refreshAccessToken = async () => {
  const refreshToken = getRefresh();
  if (!refreshToken) throw new Error('Sesión expirada.');
  const res  = await fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
  const data = await res.json();
  if (!res.ok) throw new Error('Sesión expirada.');
  saveNewToken(data.data.accessToken);
  return data.data.accessToken;
};

const authH = (token) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token || getToken()}` });

const api = async (path, opts = {}, retry = true) => {
  let token = getToken();
  let res   = await fetch(`${BASE_URL}${path}`, { headers: authH(token), ...opts });
  if (res.status === 401 && retry) {
    try { token = await refreshAccessToken(); res = await fetch(`${BASE_URL}${path}`, { headers: authH(token), ...opts }); }
    catch (err) { throw new Error(err.message); }
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.errors?.[0]?.msg || 'Error del servidor');
  return data;
};

const Spinner = ({ size = 8 }) => (
  <div className={`w-${size} h-${size} border-2 border-slate-200 border-t-[#6366f1] rounded-full animate-spin`} />
);

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white text-sm font-medium shadow-2xl ${type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
    <span>{type === 'error' ? '✕' : '✓'}</span>{msg}
    <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100 text-lg">×</button>
  </div>
);

const Modal = ({ title, subtitle, onClose, children, wide = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-[#1a2035]/50 backdrop-blur-sm" onClick={onClose} />
    <div className={`relative z-10 bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-start justify-between p-6 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1a2035]">{title}</h2>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors text-xl">×</button>
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  </div>
);

// ─── ParkingSpotSelector ─────────────────────────────────────
const ParkingSpotSelector = ({ value, onChange, currentVehicleId }) => {
  const [spots,   setSpots]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/parking/spots')
      .then(r => setSpots(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-400 bg-slate-50">
      Cargando puestos...
    </div>
  );

  // El controller adapta: numero = number, estado = status mapeado
  const available = spots.filter(s => {
    const estado = s.estado || s.status;
    return estado === 'desocupado' || estado === 'available' || s._id === value;
  });

  return (
    <select value={value || ''} onChange={e => onChange(e.target.value || null)}
      className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700
        outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10 transition-all
        cursor-pointer bg-white`}>
      <option value="">— Sin puesto asignado —</option>
      {available.map(s => {
        const numero = s.numero || s.number;
        const isCurrent = s._id === value;
        return (
          <option key={s._id} value={s._id}>
            {numero} {isCurrent ? '(actual)' : '— Libre'}
          </option>
        );
      })}
    </select>
  );
};

// ─── VehicleFormModal ─────────────────────────────────────────
const VehicleFormModal = ({ vehicle, onClose, onSaved }) => {
  const isEdit = Boolean(vehicle?._id);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [units,        setUnits]        = useState([]);
  const [residents,    setResidents]    = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingRes,   setLoadingRes]   = useState(false);

  const [form, setForm] = useState({
    placa:          vehicle?.placa  || '',
    tipo:           vehicle?.tipo   || 'carro',
    marca:          vehicle?.marca  || '',
    modelo:         vehicle?.modelo || '',
    color:          vehicle?.color  || '',
    anio:           vehicle?.anio   ? String(vehicle.anio) : '',
    unit_id:        vehicle?.unit_id?._id        || vehicle?.unit_id        || '',
    propietario_id: vehicle?.propietario_id?._id || vehicle?.propietario_id || '',
    parqueadero_id: vehicle?.parqueadero_id?._id || vehicle?.parqueadero_id || '',
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const tipoConfig = TIPO_MAP[form.tipo] || TIPO_MAP.carro;
  const needsPlate = tipoConfig.needsPlate;

  // Cargar unidades al abrir
  useEffect(() => {
    api('/units?limit=200&tipo=apartamento')
      .then((r) => setUnits(r.data || []))
      .catch(() => {})
      .finally(() => setLoadingUnits(false));
  }, []);

  // Cargar residentes cuando cambia la unidad seleccionada
  useEffect(() => {
    if (!form.unit_id) { setResidents([]); if (!isEdit) set('propietario_id', ''); return; }
    setLoadingRes(true);
    api(`/units/${form.unit_id}`)
      .then((r) => {
        const u     = r.data;
        const lista = [];
        if (u.propietario_actual) lista.push(u.propietario_actual);
        (u.residentes || []).forEach((res) => { if (!lista.find((x) => x._id === res._id)) lista.push(res); });
        setResidents(lista);
        // Al crear: si solo hay 1 residente, preseleccionarlo
        if (!isEdit && lista.length === 1) set('propietario_id', lista[0]._id);
      })
      .catch(() => setResidents([]))
      .finally(() => setLoadingRes(false));
  }, [form.unit_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.tipo)           return setError('El tipo de vehículo es requerido');
    if (!form.unit_id)        return setError('Debes seleccionar la unidad');
    if (!form.propietario_id) return setError('Debes seleccionar el propietario / residente');
    if (needsPlate && !form.placa) return setError(`La placa es obligatoria para ${tipoConfig.label}`);

    setLoading(true);
    try {
      const payload = {
        tipo:           form.tipo,
        unit_id:        form.unit_id,
        propietario_id: form.propietario_id,
        placa:          form.placa   || undefined,
        marca:          form.marca   || undefined,
        modelo:         form.modelo  || undefined,
        color:          form.color   || undefined,
        anio:           form.anio    ? Number(form.anio) : undefined,
      };

      if (isEdit) {
        await api(`/vehicles/${vehicle._id}`, { method: 'PUT', body: JSON.stringify(payload) });

        // Manejar asignación/liberación de puesto
        const prevSpot = vehicle?.parqueadero_id?._id || vehicle?.parqueadero_id || '';
        const newSpot  = form.parqueadero_id || '';

        if (newSpot !== prevSpot) {
          // Si tenía puesto anterior, liberarlo primero
          if (prevSpot) {
            await api(`/parking/vehicles/${vehicle._id}/unassign`, { method: 'PATCH' });
          }
          // Si seleccionó un nuevo puesto, asignarlo
          if (newSpot) {
            await api(`/parking/vehicles/${vehicle._id}/assign`, {
              method: 'PATCH',
              body: JSON.stringify({ parqueadero_id: newSpot }),
            });
          }
        }
      } else {
        const created = await api('/vehicles', { method: 'POST', body: JSON.stringify(payload) });
        // Si se seleccionó un puesto, asignarlo al vehículo recién creado
        const vehicleId = created?.data?._id;
        if (form.parqueadero_id && vehicleId) {
          await api(`/parking/vehicles/${vehicleId}/assign`, {
            method: 'PATCH',
            body: JSON.stringify({ parqueadero_id: form.parqueadero_id }),
          });
        }
      }

      onSaved(isEdit ? 'Vehículo actualizado' : 'Vehículo registrado exitosamente');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inp = `w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10 transition-all placeholder:text-slate-300 bg-white`;
  const sel = `${inp} cursor-pointer`;
  const lbl = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

  return (
    <Modal title={isEdit ? 'Editar vehículo' : 'Registrar vehículo'} subtitle={isEdit ? `Modificando ${vehicle.placa || vehicle.tipo}` : 'Nuevo vehículo al conjunto'} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <span className="mt-0.5 shrink-0">⚠️</span><span>{error}</span>
          </div>
        )}

        {/* Tipo */}
        <div>
          <label className={lbl}>Tipo de vehículo *</label>
          <div className="grid grid-cols-5 gap-1.5">
            {TIPOS.map(({ value, label, icon }) => (
              <button key={value} type="button" onClick={() => set('tipo', value)}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-xs font-medium transition-all
                  ${form.tipo === value ? 'bg-[#6366f1] border-[#6366f1] text-white shadow-md scale-105' : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'}`}>
                <span className="text-lg">{icon}</span><span>{label}</span>
              </button>
            ))}
          </div>
          {!needsPlate && <p className="text-xs text-slate-400 mt-2">ℹ️ {tipoConfig.label} no requiere placa en Colombia</p>}
        </div>

        {/* Placa */}
        <div>
          <label className={lbl}>Placa {needsPlate ? '*' : <span className="normal-case font-normal text-slate-400">(opcional)</span>}</label>
          <input value={form.placa} onChange={(e) => set('placa', e.target.value.toUpperCase())}
            placeholder={needsPlate ? 'ABC123' : 'Opcional'} maxLength={6} disabled={isEdit}
            className={`${inp} font-mono font-bold text-base tracking-widest ${isEdit ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`} />
          {isEdit && <p className="text-xs text-slate-400 mt-1">La placa no se puede modificar</p>}
        </div>

        {/* Marca y Modelo */}
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lbl}>Marca</label><input value={form.marca} onChange={(e) => set('marca', e.target.value)} placeholder="Ej: Chevrolet" className={inp} /></div>
          <div><label className={lbl}>Modelo</label><input value={form.modelo} onChange={(e) => set('modelo', e.target.value)} placeholder="Ej: Spark GT" className={inp} /></div>
        </div>

        {/* Color y Año */}
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lbl}>Color</label><input value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="Ej: Rojo" className={inp} /></div>
          <div><label className={lbl}>Año</label><input type="number" value={form.anio} onChange={(e) => set('anio', e.target.value)} placeholder={String(new Date().getFullYear())} min="1970" max={new Date().getFullYear() + 1} className={inp} /></div>
        </div>

        {/* ── Asignación — visible SIEMPRE (crear y editar) ── */}
        <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-100">
          <p className="text-xs font-bold text-[#1a2035] uppercase tracking-wide">
            📍 Asignación {isEdit ? <span className="normal-case font-normal text-slate-400 ml-1">(puedes cambiar unidad y puesto)</span> : '*'}
          </p>

          {/* Unidad */}
          <div>
            <label className={lbl}>Unidad / Apartamento *</label>
            {loadingUnits ? (
              <div className="flex items-center gap-2 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-400 bg-white">
                <Spinner size={4} /> Cargando unidades...
              </div>
            ) : (
              <select value={form.unit_id} onChange={(e) => set('unit_id', e.target.value)} className={sel}>
                <option value="">— Seleccionar unidad —</option>
                {units.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.torre ? `Torre ${u.torre} · ` : ''}Apto {u.numero}
                    {u.propietario_actual ? ` — ${u.propietario_actual.nombres} ${u.propietario_actual.apellidos}` : ' — Sin propietario'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Propietario */}
          <div>
            <label className={lbl}>Propietario / Residente *</label>
            {!form.unit_id ? (
              <div className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-400 bg-slate-50">Selecciona primero la unidad</div>
            ) : loadingRes ? (
              <div className="flex items-center gap-2 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-400 bg-white"><Spinner size={4} /> Cargando residentes...</div>
            ) : residents.length === 0 ? (
              <div className="px-3.5 py-2.5 border border-amber-200 rounded-xl text-sm text-amber-600 bg-amber-50">⚠️ Esta unidad no tiene residentes registrados</div>
            ) : (
              <select value={form.propietario_id} onChange={(e) => set('propietario_id', e.target.value)} className={sel}>
                <option value="">— Seleccionar persona —</option>
                {residents.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.nombres} {r.apellidos}{r.celular ? ` · ${r.celular}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          {/* Puesto de parqueadero — visible siempre */}
          <div>
            <label className={lbl}>Puesto de parqueadero</label>
            <ParkingSpotSelector
              value={form.parqueadero_id || ''}
              onChange={(val) => set('parqueadero_id', val)}
              currentVehicleId={vehicle?._id}
            />
            <p className="text-xs text-slate-400 mt-1">
              Opcional — puedes asignar el puesto ahora o después
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors">Cancelar</button>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Spinner size={4} /> Guardando...</> : isEdit ? 'Guardar cambios' : 'Registrar vehículo'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── DeleteModal ──────────────────────────────────────────────
const DeleteModal = ({ vehicle, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    try { await api(`/vehicles/${vehicle._id}`, { method: 'DELETE' }); onDeleted('Vehículo eliminado del registro'); }
    catch (err) { alert(err.message); setLoading(false); }
  };
  const tipo = TIPO_MAP[vehicle.tipo] || TIPO_MAP.otro;
  return (
    <Modal title="Eliminar vehículo" onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="text-3xl">{tipo.icon}</div>
          <div>
            <p className="font-bold text-[#1a2035] font-mono tracking-widest">{vehicle.placa || '—'}</p>
            <p className="text-sm text-slate-500">{[tipo.label, vehicle.marca, vehicle.modelo].filter(Boolean).join(' · ')}</p>
            <p className="text-xs text-slate-400 mt-0.5">Apto {vehicle.unit_id?.numero || '—'}{vehicle.unit_id?.torre ? ` · Torre ${vehicle.unit_id.torre}` : ''}</p>
          </div>
        </div>
        {vehicle.parqueadero_id && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <span>⚠️</span><span>Tiene el puesto <strong>{vehicle.parqueadero_id.numero}</strong> asignado. Al eliminar, el puesto quedará libre.</span>
          </div>
        )}
        <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors">Cancelar</button>
          <button onClick={handle} disabled={loading} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Spinner size={4} /> Eliminando...</> : '🗑️ Eliminar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── VehicleRow ───────────────────────────────────────────────
const VehicleRow = ({ v, isAdmin, onEdit, onDelete, idx }) => {
  const tipo = TIPO_MAP[v.tipo] || TIPO_MAP.otro;
  return (
    <tr className={`group transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/30`}>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#6366f1]/5 border border-[#6366f1]/10 flex items-center justify-center text-xl shrink-0">{tipo.icon}</div>
          <div>
            {v.placa ? <p className="font-bold text-[#1a2035] font-mono tracking-widest text-sm">{v.placa}</p> : <p className="text-slate-300 text-sm italic">Sin placa</p>}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium mt-0.5 ${TIPO_COLORS[v.tipo] || TIPO_COLORS.otro}`}>{tipo.label}</span>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm font-medium text-slate-700">{[v.marca, v.modelo].filter(Boolean).join(' ') || <span className="text-slate-300 italic">Sin datos</span>}</p>
        <p className="text-xs text-slate-400 mt-0.5">{[v.color, v.anio ? String(v.anio) : null].filter(Boolean).join(' · ')}</p>
      </td>
      <td className="px-5 py-4">
        {v.unit_id ? (
          <div>
            <p className="text-sm font-medium text-slate-700">Apto {v.unit_id.numero}{v.unit_id.torre ? ` · Torre ${v.unit_id.torre}` : ''}</p>
            {v.propietario_id && <p className="text-xs text-slate-400 mt-0.5">{v.propietario_id.nombres} {v.propietario_id.apellidos}</p>}
          </div>
        ) : <span className="text-slate-300 text-sm">—</span>}
      </td>
      <td className="px-5 py-4">
        {v.parqueadero_id ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#6366f1]/5 border border-[#6366f1]/15 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-[#6366f1]" />
            <span className="text-xs font-bold text-[#6366f1]">{v.parqueadero_id.numero}</span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg text-xs text-slate-400">Sin puesto</span>
        )}
      </td>
      {isAdmin && (
        <td className="px-5 py-4">
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(v)} className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors">✏️ Editar</button>
            <button onClick={() => onDelete(v)} className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium border border-red-100 transition-colors">🗑️</button>
          </div>
        </td>
      )}
    </tr>
  );
};

// ─── VehiclesPage ─────────────────────────────────────────────
export default function VehiclesPage() {
  const user    = useAuth();
  const isAdmin = user?.role === 'admin';

  const [vehicles,    setVehicles]    = useState([]);
  const [resumen,     setResumen]     = useState({});
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState('');
  const [spotFilter,  setSpotFilter]  = useState('');
  const [page,        setPage]        = useState(1);
  const [pagination,  setPagination]  = useState({});
  const [formModal,   setFormModal]   = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const LIMIT = 10;

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search)               params.placa      = search;
      if (typeFilter)           params.tipo       = typeFilter;
      if (spotFilter === 'con') params.con_puesto = true;
      if (spotFilter === 'sin') params.sin_puesto = true;
      const qs = new URLSearchParams(params).toString();
      const r  = await api(`/vehicles?${qs}`);
      setVehicles(r.data || []);
      setResumen(r.resumen || {});
      setPagination(r.pagination || {});
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }, [search, typeFilter, spotFilter, page]);

  useEffect(() => { setPage(1); }, [search, typeFilter, spotFilter]);
  useEffect(() => { load(); }, [load]);

  const handleSaved   = (msg) => { setFormModal(null);   showToast(msg); load(); };
  const handleDeleted = (msg) => { setDeleteModal(null); showToast(msg); load(); };

  const total      = pagination.total || 0;
  const totalPages = pagination.pages || 1;
  const totalAll   = Object.values(resumen).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1"><span>HomeAccess</span><span>›</span><span className="text-[#1a2035] font-medium">Vehículos</span></div>
            <h1 className="text-2xl font-bold text-[#1a2035]">Vehículos</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            {isAdmin && <button onClick={() => setFormModal('new')} className="px-4 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-xl transition-colors">+ Registrar vehículo</button>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#6366f1] rounded-xl flex items-center justify-center text-2xl shrink-0">🚙</div>
            <div><p className="text-2xl font-bold text-[#1a2035]">{totalAll}</p><p className="text-xs font-medium text-slate-500">Total</p></div>
          </div>
          {TIPOS.map(({ value, label, icon }) => (
            <button key={value} onClick={() => setTypeFilter(typeFilter === value ? '' : value)}
              className={`bg-white rounded-2xl p-4 shadow-sm border transition-all text-left hover:shadow-md hover:-translate-y-0.5 ${typeFilter === value ? 'border-[#6366f1] ring-2 ring-[#6366f1]/10' : 'border-slate-100'}`}>
              <p className="text-xl mb-1">{icon}</p>
              <p className="text-xl font-bold text-[#1a2035]">{resumen[value] || 0}</p>
              <p className="text-xs font-medium text-slate-500">{label}</p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 p-5 border-b border-slate-100">
            <div className="relative min-w-[180px] max-w-xs flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())} placeholder="Buscar placa..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/10 transition-all font-mono" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[{ value: '', label: 'Todos' }, ...TIPOS].map(({ value, label, icon }) => (
                <button key={value} onClick={() => setTypeFilter(value)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${typeFilter === value ? 'bg-[#6366f1] border-[#6366f1] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {icon ? `${icon} ${label}` : label}
                </button>
              ))}
            </div>
            <select value={spotFilter} onChange={(e) => setSpotFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 outline-none focus:border-[#6366f1] bg-white">
              <option value="">Todos los puestos</option>
              <option value="con">Con puesto asignado</option>
              <option value="sin">Sin puesto asignado</option>
            </select>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3"><Spinner size={10} /><p className="text-sm text-slate-400">Cargando vehículos...</p></div>
          ) : vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl mb-4">🚗</div>
              <p className="text-base font-semibold text-slate-700">Sin vehículos</p>
              <p className="text-sm text-slate-400 mt-1">{search || typeFilter || spotFilter ? 'No hay resultados para los filtros aplicados.' : 'Registra el primer vehículo del conjunto.'}</p>
              {isAdmin && !search && !typeFilter && !spotFilter && (
                <button onClick={() => setFormModal('new')} className="mt-4 px-4 py-2.5 bg-[#6366f1] text-white text-sm font-medium rounded-xl hover:bg-[#4f46e5] transition-colors">+ Registrar vehículo</button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Tipo / Placa', 'Vehículo', 'Unidad', 'Puesto', ...(isAdmin ? ['Acciones'] : [])].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {vehicles.map((v, i) => (
                      <VehicleRow key={v._id} v={v} idx={i} isAdmin={isAdmin} onEdit={setFormModal} onDelete={setDeleteModal} />
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                  <p className="text-sm text-slate-400">Mostrando {vehicles.length} de {total} vehículos</p>
                  <div className="flex gap-1.5">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">‹ Anterior</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-[#6366f1] text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{p}</button>
                    ))}
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">Siguiente ›</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {formModal && <VehicleFormModal vehicle={formModal === 'new' ? null : formModal} onClose={() => setFormModal(null)} onSaved={handleSaved} />}
      {deleteModal && <DeleteModal vehicle={deleteModal} onClose={() => setDeleteModal(null)} onDeleted={handleDeleted} />}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}