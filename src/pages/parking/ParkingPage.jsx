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
// ─── Helper: leer token desde homeaccess-auth ────────────────────────────────
const getToken = () => {
  try {
    const raw = localStorage.getItem('homeaccess-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken || null;
  } catch { return null; }
};

const authH = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});
const api = async (path, opts = {}) => {
  const r = await fetch(`${BASE}${path}`, { headers: authH(), ...opts });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Error del servidor');
  return d;
};
const getVehicles  = (p = {}) => api(`/parking/vehicles${new URLSearchParams(p).toString() ? '?' + new URLSearchParams(p) : ''}`);
const getSpots     = (p = {}) => api(`/parking/spots${new URLSearchParams(p).toString() ? '?' + new URLSearchParams(p) : ''}`);
const registerVehicle = (data) => api('/parking/vehicles', { method: 'POST', body: JSON.stringify(data) });
const deleteVehicle   = (id)   => api(`/parking/vehicles/${id}`, { method: 'DELETE' });
const assignSpot      = (vId, pId) => api(`/parking/vehicles/${vId}/assign`,   { method: 'PATCH', body: JSON.stringify({ parqueadero_id: pId }) });
const unassignSpot    = (vId)      => api(`/parking/vehicles/${vId}/unassign`, { method: 'PATCH' });

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
    <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
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
  : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" /> Sin puesto
    </span>;

// ─── StatCard (mismo estilo que Dashboard) ────────────────────────────────────
const StatCard = ({ label, value, sub, iconBg, icon }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
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
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl transition-colors">
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
      <label className="text-sm font-medium text-gray-700">{label}</label>
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
            <label className="text-sm font-medium text-gray-700">Placa <span className="text-red-500">*</span></label>
            <input
              value={form.placa}
              onChange={e => set('placa', e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono tracking-widest uppercase outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
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
          <label className="text-sm font-medium text-gray-700">ID Unidad (unit_id) <span className="text-red-500">*</span></label>
          <input value={form.unit_id} onChange={e => set('unit_id', e.target.value)}
            placeholder="MongoDB _id de la unidad"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">ID Propietario (user_id) <span className="text-red-500">*</span></label>
          <input value={form.propietario_id} onChange={e => set('propietario_id', e.target.value)}
            placeholder="MongoDB _id del propietario"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Registrando...' : 'Registrar vehículo'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Modal: Asignar Puesto ────────────────────────────────────────────────────
const AssignSpotModal = ({ vehicle, onClose, onDone }) => {
  const [spots,    setSpots]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    getSpots({ estado: 'desocupado' })
      .then(r => setSpots(r.data || []))
      .catch(() => setSpots([]))
      .finally(() => setLoading(false));
  }, []);

  const handle = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await assignSpot(vehicle._id, selected);
      onDone('Puesto asignado exitosamente');
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={`Asignar puesto — ${vehicle.placa}`} onClose={onClose} maxW="max-w-md">
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
          <span className="font-medium">{VEHICLE_TYPE_ICON[vehicle.tipo]} {vehicle.placa}</span>
          {' · '}{vehicle.marca} {vehicle.modelo} · Apto {vehicle.unit_id?.numero || '—'}
        </div>

        {loading ? <Spinner /> : spots.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No hay puestos disponibles</p>
        ) : (
          <>
            <p className="text-sm text-gray-500">Selecciona un puesto libre:</p>
            <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto">
              {spots.map(s => (
                <button key={s._id} onClick={() => setSelected(s._id)}
                  className={`py-3 rounded-xl border text-sm font-bold transition-all
                    ${selected === s._id
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'}`}>
                  {s.numero}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200">
            Cancelar
          </button>
          <button onClick={handle} disabled={!selected || saving}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Asignando...' : 'Asignar puesto'}
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
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">
          {VEHICLE_TYPE_ICON[vehicle.tipo]}
        </div>
        <div>
          <p className="text-2xl font-black text-gray-800 tracking-widest font-mono">{vehicle.placa}</p>
          <p className="text-sm text-gray-500 capitalize">{VEHICLE_TYPE_LABEL[vehicle.tipo]}</p>
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
          <div key={label} className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            <p className="text-sm font-medium text-gray-700">{val}</p>
          </div>
        ))}
      </div>

      {/* Puesto */}
      <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Puesto de parqueadero</p>
          <p className="text-sm font-medium text-gray-700">
            {vehicle.parqueadero_id ? `Puesto ${vehicle.parqueadero_id.numero}` : 'Sin puesto asignado'}
          </p>
        </div>
        <StatusBadge assigned={Boolean(vehicle.parqueadero_id)} />
      </div>

      <button onClick={onClose}
        className="w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200">
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
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
              className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
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
                className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">

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
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {[v.marca, v.modelo].filter(Boolean).join(' ') || '—'}
                  </p>
                  <p className="text-xs text-gray-400">{[v.color, v.anio].filter(Boolean).join(' · ') || ''}</p>
                </div>

                {/* Apartamento */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-700">
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
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-sm">
                    👁
                  </button>
                  {isAdmin && (
                    <>
                      {!v.parqueadero_id
                        ? <button onClick={() => setAssignModal(v)}
                            title="Asignar puesto"
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors text-sm">
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

// ─── Tab: Mapa de Puestos ─────────────────────────────────────────────────────
const SpotsTab = () => {
  const [spots,   setSpots]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('');
  const [summary, setSummary] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getSpots(filter ? { estado: filter } : {});
      setSpots(r.data || []);
      setSummary(r.resumen || {});
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
          <h3 className="text-base font-semibold text-gray-800">Mapa de puestos</h3>
          <div className="flex gap-2">
            {[
              { val: '',              label: 'Todos'         },
              { val: 'desocupado',    label: '🟢 Libres'     },
              { val: 'ocupado',       label: '🔴 Ocupados'   },
              { val: 'en_mantenimiento', label: '🔧 Mantenim.' },
            ].map(({ val, label }) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors
                  ${filter === val ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="p-5">
          {loading ? <Spinner /> : spots.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🅿️</div>
              <p className="font-semibold text-gray-600">Sin puestos registrados</p>
              <p className="text-sm text-gray-400 mt-1">Crea unidades con tipo "parqueadero" desde el módulo de Unidades</p>
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
                      <p className="text-xs font-mono text-gray-500 mt-0.5 truncate">
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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <span>HomeAccess</span>
        <span>›</span>
        <span className="text-gray-700 font-medium">Parqueadero</span>
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
              ${tab === val ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'vehicles' && <VehiclesTab isAdmin={isAdmin} />}
      {tab === 'spots'    && <SpotsTab />}
    </div>
  );
}