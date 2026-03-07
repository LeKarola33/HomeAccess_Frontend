/**
 * ParkingPage.jsx
 * Vista de Vehículos y Puestos de Parqueadero.
 * Diseño alineado con el sistema visual de HomeAccess:
 *   - Fondo: #f4f6f9
 *   - Cards blancas con sombra suave
 *   - Iconos con bg de color redondeado (igual que Dashboard)
 *   - Tabla con filas hover
 * Ruta: /parqueadero
 */

import { useState, useEffect, useCallback } from 'react';

// ─── API ──────────────────────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const getAuthState  = () => { try { return JSON.parse(localStorage.getItem('homeaccess-auth'))?.state || {}; } catch { return {}; } };
const getToken      = () => getAuthState().accessToken  || null;
const getRefreshTok = () => getAuthState().refreshToken || null;

const saveNewToken = (accessToken) => {
  try {
    const raw = localStorage.getItem('homeaccess-auth');
    const s   = JSON.parse(raw);
    s.state.accessToken = accessToken;
    localStorage.setItem('homeaccess-auth', JSON.stringify(s));
  } catch {}
};

const doRefresh = async () => {
  const rt  = getRefreshTok();
  if (!rt) throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
  const res  = await fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) });
  const data = await res.json();
  if (!res.ok) throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
  saveNewToken(data.data.accessToken);
  return data.data.accessToken;
};

const authH = (tok) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok || getToken()}` });

const api = async (path, opts = {}, retry = true) => {
  let tok = getToken();
  let r   = await fetch(`${BASE}${path}`, { headers: authH(tok), ...opts });
  if (r.status === 401 && retry) {
    try { tok = await doRefresh(); r = await fetch(`${BASE}${path}`, { headers: authH(tok), ...opts }); }
    catch (e) { throw new Error(e.message); }
  }
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Error del servidor');
  return d;
};

const getVehicles     = (p = {}) => api(`/parking/vehicles${new URLSearchParams(p).toString() ? '?' + new URLSearchParams(p) : ''}`);
const getSpots        = (p = {}) => api(`/parking/spots${new URLSearchParams(p).toString() ? '?' + new URLSearchParams(p) : ''}`);
const registerVehicle = (data)   => api('/parking/vehicles', { method: 'POST', body: JSON.stringify(data) });
const deleteVehicle   = (id)     => api(`/parking/vehicles/${id}`, { method: 'DELETE' });
const assignSpot      = (vId, pId) => api(`/parking/vehicles/${vId}/assign`,   { method: 'PATCH', body: JSON.stringify({ parqueadero_id: pId }) });
const unassignSpot    = (vId)      => api(`/parking/vehicles/${vId}/unassign`, { method: 'PATCH' });
const bulkCreateSpots = (total, prefijo) => api('/parking/spots/bulk-create', { method: 'POST', body: JSON.stringify({ total, prefijo }) });

// ─── Constantes ───────────────────────────────────────────────────────────────
const useAuth = () => {
  try {
    const raw = localStorage.getItem('homeaccess-auth');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed?.state?.user || {};
  } catch { return {}; }
};

const VEHICLE_TYPE_LABEL = { carro: 'Carro', moto: 'Moto', bicicleta: 'Bicicleta', otro: 'Otro' };
const VEHICLE_TYPE_ICON  = { carro: '🚗',    moto: '🏍️',   bicicleta: '🚲',        otro: '🚐'   };

// Colores de iconos al estilo Dashboard (bg redondeado con color sólido)
const ICON_COLORS = {
  total:    { bg: 'bg-blue-500',   icon: '🚗' },
  asignado: { bg: 'bg-purple-500', icon: '🅿️' },
  libre:    { bg: 'bg-green-500',  icon: '🔓' },
  tipos:    { bg: 'bg-orange-500', icon: '🏍️' },
};

// ─── Componentes base ─────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-8 h-8 border-2 border-gray-200 border-t-[#6366f1] rounded-full animate-spin" />
  </div>
);

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-2xl
    ${type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
    <span>{type === 'error' ? '✕' : '✓'}</span>
    {msg}
    <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
  </div>
);

// Badge de estado estilo minimalista
const StatusBadge = ({ assigned }) => assigned
  ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Asignado
    </span>
  : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" /> Sin puesto
    </span>;

// ─── StatCard (mismo estilo que Dashboard) ────────────────────────────────────
const StatCard = ({ label, value, sub, iconBg, icon }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
    <div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
    <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center text-2xl shadow-sm`}>
      {icon}
    </div>
  </div>
);

// ─── Modal base ───────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, maxW = 'max-w-lg' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
    <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxW} max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-gray-400 text-xl transition-colors">
          ×
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ─── Formulario: Registrar Vehículo ───────────────────────────────────────────
const RegisterVehicleModal = ({ onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form, setForm] = useState({
    placa: '', tipo: 'carro', marca: '', modelo: '',
    color: '', anio: '', unit_id: '', propietario_id: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.placa || !form.unit_id || !form.propietario_id) {
      setError('Placa, Unidad y Propietario son obligatorios');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await registerVehicle({ ...form, anio: form.anio ? Number(form.anio) : undefined });
      onSaved('Vehículo registrado exitosamente');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const field = (label, key, props = {}) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        value={form[key]}
        onChange={e => set(key, props.upper ? e.target.value.toUpperCase() : e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
        {...props}
      />
    </div>
  );

  return (
    <Modal title="Registrar vehículo" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Placa <span className="text-red-500">*</span></label>
            <input
              value={form.placa}
              onChange={e => set('placa', e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono tracking-widest uppercase outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Tipo</label>
            <select value={form.tipo} onChange={e => set('tipo', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white">
              <option value="carro">🚗 Carro</option>
              <option value="moto">🏍️ Moto</option>
              <option value="bicicleta">🚲 Bicicleta</option>
              <option value="otro">🚐 Otro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field('Marca', 'marca', { placeholder: 'Ej: Chevrolet' })}
          {field('Modelo', 'modelo', { placeholder: 'Ej: Spark' })}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field('Color', 'color', { placeholder: 'Ej: Rojo' })}
          {field('Año', 'anio', { type: 'number', placeholder: '2022', min: '1970', max: '2026' })}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">ID Unidad (unit_id) <span className="text-red-500">*</span></label>
          <input value={form.unit_id} onChange={e => set('unit_id', e.target.value)}
            placeholder="MongoDB _id de la unidad"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">ID Propietario (user_id) <span className="text-red-500">*</span></label>
          <input value={form.propietario_id} onChange={e => set('propietario_id', e.target.value)}
            placeholder="MongoDB _id del propietario"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-[#6366f1] text-white text-sm font-medium rounded-xl hover:bg-[#4f46e5] disabled:opacity-50 transition-colors">
            {loading ? 'Registrando...' : 'Registrar vehículo'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Modal: Asignar Puesto (grid visual) ─────────────────────────────────────
const AssignSpotModal = ({ vehicle, onClose, onDone }) => {
  const [allSpots, setAllSpots] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [selected, setSelected] = useState('');
  const [filter,   setFilter]   = useState('libres'); // 'libres' | 'todos'

  useEffect(() => {
    getSpots()
      .then(r => setAllSpots(r.data || []))
      .catch(() => setAllSpots([]))
      .finally(() => setLoading(false));
  }, []);

  const spots = filter === 'libres'
    ? allSpots.filter(s => s.estado === 'desocupado')
    : allSpots;

  const libre    = allSpots.filter(s => s.estado === 'desocupado').length;
  const ocupado  = allSpots.filter(s => s.estado === 'ocupado').length;
  const mant     = allSpots.filter(s => s.estado === 'en_mantenimiento').length;

  const handle = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await assignSpot(vehicle._id, selected);
      onDone('Puesto asignado exitosamente');
    } catch (err) { alert(err.message); setSaving(false); }
  };

  const spotColor = (s) => {
    if (s._id === selected) return 'bg-[#6366f1] border-[#6366f1] text-white shadow-lg scale-105';
    if (s.estado === 'ocupado') return 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed';
    if (s.estado === 'en_mantenimiento') return 'bg-amber-50 border-amber-200 text-amber-500 cursor-not-allowed';
    return 'bg-white border-slate-200 text-slate-700 hover:border-[#6366f1] hover:bg-[#6366f1]/5 cursor-pointer';
  };

  return (
    <Modal title={`Asignar puesto`} onClose={onClose} maxW="max-w-lg">
      <div className="space-y-4">

        {/* Info vehículo */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-2xl">{VEHICLE_TYPE_ICON[vehicle.tipo]}</span>
          <div>
            <p className="font-bold text-[#1a2035] font-mono tracking-widest text-sm">{vehicle.placa || '—'}</p>
            <p className="text-xs text-slate-400">
              {[vehicle.marca, vehicle.modelo].filter(Boolean).join(' ')} · Apto {vehicle.unit_id?.numero || '—'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#6366f1] rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Cargando puestos...</p>
          </div>
        ) : allSpots.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <div className="text-4xl">🅿️</div>
            <p className="text-sm font-semibold text-slate-600">No hay puestos configurados</p>
            <p className="text-xs text-slate-400">
              El administrador debe crear los puestos de parqueadero primero.
            </p>
          </div>
        ) : (
          <>
            {/* Leyenda + contador */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-white border-2 border-slate-200 inline-block" />
                  <span className="text-slate-500">Libre ({libre})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-100 border-2 border-red-200 inline-block" />
                  <span className="text-slate-500">Ocupado ({ocupado})</span>
                </span>
                {mant > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-100 border-2 border-amber-200 inline-block" />
                    <span className="text-slate-500">Mant. ({mant})</span>
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                {['libres','todos'].map(f => (
                  <button key={f} onClick={() => { setFilter(f); setSelected(''); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all
                      ${filter === f ? 'bg-[#6366f1] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {f === 'libres' ? `Solo libres` : 'Ver todos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de puestos */}
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
              {spots.map(s => (
                <button
                  key={s._id}
                  disabled={s.estado !== 'desocupado'}
                  onClick={() => s.estado === 'desocupado' && setSelected(s._id)}
                  title={s.estado === 'ocupado' && s.vehiculo_asignado
                    ? `Ocupado por ${s.vehiculo_asignado.placa}`
                    : s.estado === 'en_mantenimiento' ? 'En mantenimiento' : `Puesto ${s.numero}`}
                  className={`relative py-3 rounded-xl border text-xs font-bold transition-all
                    ${spotColor(s)}`}>
                  <span className="block text-center leading-none">{s.numero}</span>
                  {s.estado === 'ocupado' && (
                    <span className="block text-center text-[10px] mt-1 opacity-60 leading-none">
                      {s.vehiculo_asignado?.placa || '●'}
                    </span>
                  )}
                  {s.estado === 'en_mantenimiento' && (
                    <span className="block text-center text-[10px] mt-0.5">🔧</span>
                  )}
                </button>
              ))}
            </div>

            {selected && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#6366f1]/5 border border-[#6366f1]/20 rounded-xl text-sm">
                <span className="text-[#6366f1]">✓</span>
                <span className="text-slate-700">
                  Seleccionado: <strong className="text-[#6366f1]">
                    {allSpots.find(s => s._id === selected)?.numero}
                  </strong>
                </span>
              </div>
            )}
          </>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button onClick={handle} disabled={!selected || saving}
            className="flex-1 py-2.5 bg-[#6366f1] text-white text-sm font-medium rounded-xl
              hover:bg-[#4f46e5] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Asignando...</>
              : `🅿️ Asignar puesto`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Modal: Detalle de vehículo ───────────────────────────────────────────────
const VehicleDetailModal = ({ vehicle, onClose }) => (
  <Modal title="Detalle del vehículo" onClose={onClose} maxW="max-w-md">
    <div className="space-y-4">
      {/* Ícono grande + placa */}
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">
          {VEHICLE_TYPE_ICON[vehicle.tipo]}
        </div>
        <div>
          <p className="text-2xl font-black text-gray-800 tracking-widest font-mono">{vehicle.placa}</p>
          <p className="text-sm text-slate-500 capitalize">{VEHICLE_TYPE_LABEL[vehicle.tipo]}</p>
        </div>
      </div>

      {/* Datos */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Marca',    val: vehicle.marca   || '—' },
          { label: 'Modelo',   val: vehicle.modelo  || '—' },
          { label: 'Color',    val: vehicle.color   || '—' },
          { label: 'Año',      val: vehicle.anio    || '—' },
          { label: 'Apartamento', val: vehicle.unit_id?.numero
              ? `${vehicle.unit_id.numero}${vehicle.unit_id.torre ? ` · Torre ${vehicle.unit_id.torre}` : ''}`
              : '—' },
          { label: 'Propietario', val: vehicle.propietario_id
              ? `${vehicle.propietario_id.nombres || ''} ${vehicle.propietario_id.apellidos || ''}`.trim() || '—'
              : '—' },
        ].map(({ label, val }) => (
          <div key={label} className="p-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            <p className="text-sm font-medium text-slate-700">{val}</p>
          </div>
        ))}
      </div>

      {/* Puesto */}
      <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Puesto de parqueadero</p>
          <p className="text-sm font-medium text-slate-700">
            {vehicle.parqueadero_id ? `Puesto ${vehicle.parqueadero_id.numero}` : 'Sin puesto asignado'}
          </p>
        </div>
        <StatusBadge assigned={Boolean(vehicle.parqueadero_id)} />
      </div>

      <button onClick={onClose}
        className="w-full py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200">
        Cerrar
      </button>
    </div>
  </Modal>
);

// ─── Tab: Vehículos ───────────────────────────────────────────────────────────
const VehiclesTab = ({ isAdmin }) => {
  const [vehicles,    setVehicles]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState('');
  const [toast,       setToast]       = useState(null);
  const [registerModal, setRegisterModal] = useState(false);
  const [assignModal,   setAssignModal]   = useState(null);
  const [detailModal,   setDetailModal]   = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = {};
      if (search)     p.placa = search;
      if (typeFilter) p.tipo  = typeFilter;
      const r = await getVehicles(p);
      setVehicles(r.data || []);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }, [search, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleUnassign = async (v) => {
    if (!confirm(`¿Liberar el puesto ${v.parqueadero_id?.numero} del vehículo ${v.placa}?`)) return;
    try { await unassignSpot(v._id); showToast('Puesto liberado'); load(); }
    catch (err) { showToast(err.message, 'error'); }
  };

  const handleDelete = async (v) => {
    if (!confirm(`¿Eliminar el vehículo ${v.placa} del registro?`)) return;
    try { await deleteVehicle(v._id); showToast('Vehículo eliminado'); load(); }
    catch (err) { showToast(err.message, 'error'); }
  };

  // Stats
  const total      = vehicles.length;
  const asignados  = vehicles.filter(v => v.parqueadero_id).length;
  const sinPuesto  = total - asignados;
  const motos      = vehicles.filter(v => v.tipo === 'moto').length;

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Vehículos"  value={total}     sub="Registrados en el sistema"   iconBg="bg-blue-500"   icon="🚗" />
        <StatCard label="Con Puesto"       value={asignados} sub="Puestos asignados"            iconBg="bg-purple-500" icon="🅿️" />
        <StatCard label="Sin Puesto"       value={sinPuesto} sub="Pendientes de asignación"     iconBg="bg-orange-500" icon="🔓" />
        <StatCard label="Motos"            value={motos}     sub="Motocicletas registradas"     iconBg="bg-green-500"  icon="🏍️" />
      </div>

      {/* Barra de herramientas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Header tabla */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h3 className="text-base font-semibold text-gray-800">Vehículos registrados</h3>
          {isAdmin && (
            <button onClick={() => setRegisterModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#6366f1] text-white text-sm font-medium rounded-xl hover:bg-[#4f46e5] transition-colors">
              <span className="text-lg leading-none">+</span> Registrar vehículo
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 flex-wrap">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value.toUpperCase())}
              placeholder="Buscar por placa..."
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 w-52 transition-all"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-400 bg-white transition-all">
            <option value="">Todos los tipos</option>
            <option value="carro">🚗 Carro</option>
            <option value="moto">🏍️ Moto</option>
            <option value="bicicleta">🚲 Bicicleta</option>
            <option value="otro">🚐 Otro</option>
          </select>
          {(search || typeFilter) && (
            <button onClick={() => { setSearch(''); setTypeFilter(''); }}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              Limpiar filtros
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">{vehicles.length} resultado{vehicles.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Tabla */}
        {loading ? <Spinner /> : vehicles.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🚗</div>
            <p className="font-semibold text-gray-600">Sin vehículos</p>
            <p className="text-sm text-gray-400 mt-1">
              {search || typeFilter ? 'No hay resultados para los filtros aplicados' : 'No hay vehículos registrados en el conjunto'}
            </p>
          </div>
        ) : (
          <>
            {/* Encabezado */}
            <div className="grid grid-cols-12 gap-4 px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">
              <div className="col-span-2">Placa</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-3">Vehículo</div>
              <div className="col-span-2">Apartamento</div>
              <div className="col-span-2">Puesto</div>
              <div className="col-span-1"></div>
            </div>

            {/* Filas */}
            {vehicles.map((v) => (
              <div key={v._id}
                className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors border-b border-gray-50 last:border-0">

                {/* Placa */}
                <div className="col-span-2">
                  <span className="font-black text-gray-800 tracking-widest text-sm font-mono">{v.placa}</span>
                </div>

                {/* Tipo */}
                <div className="col-span-2 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-base">
                    {VEHICLE_TYPE_ICON[v.tipo]}
                  </div>
                  <span className="text-sm text-gray-600">{VEHICLE_TYPE_LABEL[v.tipo]}</span>
                </div>

                {/* Marca / modelo / color */}
                <div className="col-span-3">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {[v.marca, v.modelo].filter(Boolean).join(' ') || '—'}
                  </p>
                  <p className="text-xs text-gray-400">{[v.color, v.anio].filter(Boolean).join(' · ') || ''}</p>
                </div>

                {/* Apartamento */}
                <div className="col-span-2">
                  <p className="text-sm text-slate-700">
                    {v.unit_id?.numero ? `Apto ${v.unit_id.numero}` : '—'}
                  </p>
                  {v.unit_id?.torre && <p className="text-xs text-gray-400">Torre {v.unit_id.torre}</p>}
                </div>

                {/* Puesto */}
                <div className="col-span-2">
                  {v.parqueadero_id
                    ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        📍 {v.parqueadero_id.numero}
                      </span>
                    : <span className="text-xs text-gray-400">—</span>
                  }
                </div>

                {/* Acciones */}
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button onClick={() => setDetailModal(v)}
                    title="Ver detalle"
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-gray-400 hover:text-gray-600 transition-colors text-sm">
                    👁
                  </button>
                  {isAdmin && (
                    <>
                      {!v.parqueadero_id
                        ? <button onClick={() => setAssignModal(v)}
                            title="Asignar puesto"
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-[#6366f1] transition-colors text-sm">
                            🅿️
                          </button>
                        : <button onClick={() => handleUnassign(v)}
                            title="Liberar puesto"
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors text-sm">
                            🔓
                          </button>
                      }
                      <button onClick={() => handleDelete(v)}
                        title="Eliminar"
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors text-sm">
                        🗑
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Modals */}
      {registerModal && (
        <RegisterVehicleModal
          onClose={() => setRegisterModal(false)}
          onSaved={(msg) => { setRegisterModal(false); showToast(msg); load(); }}
        />
      )}
      {assignModal && (
        <AssignSpotModal
          vehicle={assignModal}
          onClose={() => setAssignModal(null)}
          onDone={(msg) => { setAssignModal(null); showToast(msg); load(); }}
        />
      )}
      {detailModal && (
        <VehicleDetailModal vehicle={detailModal} onClose={() => setDetailModal(null)} />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

// ─── BulkCreateButton ─────────────────────────────────────────────────────────
const BulkCreateButton = ({ onCreated, compact = false }) => {
  const user    = useAuth();
  const isAdmin = user?.role === 'admin';
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  if (!isAdmin) return null;

  const handle = async () => {
    if (!window.confirm('¿Crear 50 puestos de parqueadero (P-01 a P-50)?\nLos puestos que ya existan serán omitidos.')) return;
    setLoading(true);
    try {
      const r = await bulkCreateSpots(50, 'P');
      setDone(true);
      alert(`✅ ${r.message}`);
      onCreated?.();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (compact) return (
    <button onClick={handle} disabled={loading}
      className="px-3 py-1.5 bg-[#6366f1]/10 hover:bg-[#6366f1]/20 text-[#6366f1]
        border border-[#6366f1]/20 text-xs font-medium rounded-xl transition-all
        flex items-center gap-1.5 disabled:opacity-50">
      {loading ? '⏳' : '⚡'} {loading ? 'Creando...' : 'Crear 50 puestos'}
    </button>
  );

  return (
    <button onClick={handle} disabled={loading}
      className="px-5 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white
        text-sm font-medium rounded-xl transition-colors flex items-center gap-2
        disabled:opacity-50 mx-auto">
      {loading
        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creando puestos...</>
        : '⚡ Crear 50 puestos de parqueadero'}
    </button>
  );
};

// ─── Tab: Mapa de Puestos ─────────────────────────────────────────────────────
const SpotsTab = () => {
  const user    = useAuth();
  const isAdmin = user?.role === 'admin';
  const [spots,   setSpots]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('');
  const [summary, setSummary] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getSpots(filter ? { estado: filter } : {});
      setSpots(r.data || []);
      setSummary(r.summary || r.resumen || {});
    } catch { setSpots([]); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Puestos"   value={summary.total        || 0} sub="Capacidad del conjunto" iconBg="bg-blue-500"   icon="🅿️" />
        <StatCard label="Ocupados"        value={summary.ocupados     || 0} sub="Con vehículo asignado"  iconBg="bg-red-500"    icon="🔴" />
        <StatCard label="Disponibles"     value={summary.libres       || 0} sub="Libres para asignar"    iconBg="bg-green-500"  icon="🟢" />
        <StatCard label="Mantenimiento"   value={summary.mantenimiento|| 0} sub="Fuera de servicio"      iconBg="bg-orange-500" icon="🔧" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-gray-800">Mapa de puestos</h3>
            {spots.length === 0 || true ? null : null}
          </div>
          <div className="flex items-center gap-2">
            <BulkCreateButton onCreated={load} compact />
            {[
              { val: '',              label: 'Todos'         },
              { val: 'desocupado',    label: '🟢 Libres'     },
              { val: 'ocupado',       label: '🔴 Ocupados'   },
              { val: 'en_mantenimiento', label: '🔧 Mantenim.' },
            ].map(({ val, label }) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                  ${filter === val ? 'bg-[#6366f1] text-white' : 'bg-slate-100 text-gray-600 hover:bg-slate-200'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="p-5">
          {loading ? <Spinner /> : spots.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-5xl">🅿️</div>
              <div>
                <p className="font-semibold text-gray-600">Sin puestos registrados</p>
                <p className="text-sm text-gray-400 mt-1">
                  El conjunto tiene capacidad para 50 puestos pero aún no están creados.
                </p>
              </div>
              <BulkCreateButton onCreated={load} />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {spots.map(s => {
                const isOcc  = s.estado === 'ocupado';
                const isMaint= s.estado === 'en_mantenimiento';
                return (
                  <div key={s._id}
                    className={`rounded-2xl border-2 p-3 text-center transition-all
                      ${isOcc   ? 'bg-red-50    border-red-200'   :
                        isMaint ? 'bg-amber-50  border-amber-200' :
                                  'bg-green-50  border-green-200'}`}>
                    <div className="text-xl mb-1">{isOcc ? '🔴' : isMaint ? '🔧' : '🟢'}</div>
                    <p className="font-black text-sm text-gray-800">{s.numero}</p>
                    {s.vehiculo_asignado && (
                      <p className="text-xs font-mono text-slate-500 mt-0.5 truncate">
                        {s.vehiculo_asignado.placa}
                      </p>
                    )}
                    {isOcc && s.vehiculo_asignado?.unit_id && (
                      <p className="text-xs text-gray-400">
                        Apto {s.vehiculo_asignado.unit_id.numero}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── ParkingPage ──────────────────────────────────────────────────────────────
export default function ParkingPage() {
  const [tab, setTab] = useState('vehicles');
  const user    = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <span>HomeAccess</span>
        <span>›</span>
        <span className="text-slate-700 font-medium">Parqueadero</span>
      </div>

      {/* Page title */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Parqueadero</h1>
      </div>

      {/* Tabs — estilo igual al resto del proyecto */}
      <div className="flex gap-1 mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-1 w-fit">
        {[
          { val: 'vehicles', label: '🚗 Vehículos' },
          { val: 'spots',    label: '🅿️ Mapa de puestos' },
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setTab(val)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all
              ${tab === val ? 'bg-[#6366f1] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'vehicles' && <VehiclesTab isAdmin={isAdmin} />}
      {tab === 'spots'    && <SpotsTab />}
    </div>
  );
}
