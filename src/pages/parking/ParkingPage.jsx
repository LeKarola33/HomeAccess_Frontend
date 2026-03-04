/**
 * ParkingPage.jsx
 * Módulo de parqueadero: listado de vehículos y puestos.
 * Ruta: /parqueadero  (admin, portero, vigilante)
 *
 * VISTAS:
 *   Tab "Vehículos"  → lista todos los vehículos con búsqueda por placa
 *   Tab "Puestos"    → mapa de puestos con estado libre/ocupado
 */

import { useState, useEffect, useCallback } from 'react';

// ─── Servicio API ─────────────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const authH = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` });
const api = async (path, opts = {}) => {
  const r = await fetch(`${BASE}${path}`, { headers: authH(), ...opts });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Error del servidor');
  return d;
};

const getVehicles  = (params = {}) => api(`/parking/vehiculos?${new URLSearchParams(params)}`);
const getSpots     = (params = {}) => api(`/parking/puestos?${new URLSearchParams(params)}`);
const assignSpot   = (vehicleId, spotId) => api(`/parking/vehiculos/${vehicleId}/asignar`, { method: 'PATCH', body: JSON.stringify({ parqueadero_id: spotId }) });
const unassignSpot = (vehicleId) => api(`/parking/vehiculos/${vehicleId}/desasignar`, { method: 'PATCH' });

// ─── Helpers UI ───────────────────────────────────────────────────────────────
const VEHICLE_ICONS = { carro: '🚗', moto: '🏍️', bicicleta: '🚲', otro: '🚐' };

const Badge = ({ color, children }) => {
  const colors = {
    green:  'bg-emerald-100 text-emerald-700',
    red:    'bg-red-100 text-red-700',
    amber:  'bg-amber-100 text-amber-700',
    slate:  'bg-slate-100 text-slate-600',
    indigo: 'bg-indigo-100 text-indigo-700',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.slate}`}>{children}</span>;
};

const Spinner = () => (
  <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
);

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm shadow-2xl ${type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
    {msg}
    <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">✕</button>
  </div>
);

// ─── AssignModal ──────────────────────────────────────────────────────────────
const AssignModal = ({ vehicle, onClose, onDone }) => {
  const [spots,   setSpots]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    getSpots({ estado: 'desocupado' })
      .then(r => setSpots(r.data || []))
      .catch(() => setSpots([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAssign = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await assignSpot(vehicle._id, selected);
      onDone('Puesto asignado ✓');
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-50 bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Asignar puesto — {vehicle.placa}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : spots.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No hay puestos disponibles</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {spots.map(s => (
                <button
                  key={s._id}
                  onClick={() => setSelected(s._id)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all
                    ${selected === s._id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300'}`}
                >
                  {s.numero}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
            <button onClick={handleAssign} disabled={!selected || saving} className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── VehiclesTab ──────────────────────────────────────────────────────────────
const VehiclesTab = ({ isAdmin }) => {
  const [vehicles, setVehicles]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [search,   setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [assignModal, setAssignModal] = useState(null);
  const [toast,    setToast]      = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)     params.placa = search;
      if (typeFilter) params.tipo  = typeFilter;
      const r = await getVehicles(params);
      setVehicles(r.data || []);
    } catch (err) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }, [search, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleUnassign = async (vehicle) => {
    if (!confirm(`¿Desasignar el puesto de ${vehicle.placa}?`)) return;
    try {
      await unassignSpot(vehicle._id);
      showToast('Puesto liberado');
      load();
    } catch (err) { showToast(err.message, 'error'); }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value.toUpperCase())}
          placeholder="Buscar placa..."
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 w-48"
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 bg-white"
        >
          <option value="">Todos los tipos</option>
          <option value="carro">🚗 Carro</option>
          <option value="moto">🏍️ Moto</option>
          <option value="bicicleta">🚲 Bicicleta</option>
          <option value="otro">🚐 Otro</option>
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">🚗</div>
          <p className="font-medium text-slate-600">Sin vehículos registrados</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {vehicles.map((v, i) => (
            <div key={v._id} className={`flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors ${i < vehicles.length - 1 ? 'border-b border-slate-50' : ''}`}>
              {/* Ícono + placa */}
              <div className="text-2xl">{VEHICLE_ICONS[v.tipo] || '🚗'}</div>
              <div className="min-w-[90px]">
                <p className="font-bold text-slate-800 text-sm font-mono tracking-wider">{v.placa}</p>
                <p className="text-xs text-slate-400 capitalize">{v.tipo}</p>
              </div>

              {/* Marca/modelo */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">
                  {[v.marca, v.modelo, v.color].filter(Boolean).join(' · ') || '—'}
                </p>
                <p className="text-xs text-slate-400">
                  Apto {v.unit_id?.numero || '—'}
                  {v.unit_id?.torre ? ` · Torre ${v.unit_id.torre}` : ''}
                </p>
              </div>

              {/* Puesto asignado */}
              <div className="min-w-[100px] text-center">
                {v.parqueadero_id ? (
                  <Badge color="indigo">📍 {v.parqueadero_id.numero}</Badge>
                ) : (
                  <Badge color="slate">Sin puesto</Badge>
                )}
              </div>

              {/* Acciones admin */}
              {isAdmin && (
                <div className="flex gap-2 shrink-0">
                  {!v.parqueadero_id ? (
                    <button
                      onClick={() => setAssignModal(v)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg border border-indigo-200 transition-colors"
                    >
                      Asignar puesto
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnassign(v)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg border border-slate-200 transition-colors"
                    >
                      Liberar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {assignModal && (
        <AssignModal
          vehicle={assignModal}
          onClose={() => setAssignModal(null)}
          onDone={(msg) => { setAssignModal(null); showToast(msg); load(); }}
        />
      )}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

// ─── SpotsTab ─────────────────────────────────────────────────────────────────
const SpotsTab = () => {
  const [spots,   setSpots]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('');
  const [summary, setSummary] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter ? { estado: filter } : {};
      const r = await getSpots(params);
      setSpots(r.data || []);
      setSummary(r.resumen || {});
    } catch { setSpots([]); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',        val: summary.total || 0,        color: 'bg-slate-50  text-slate-700' },
          { label: 'Ocupados',     val: summary.ocupados || 0,     color: 'bg-red-50    text-red-700'   },
          { label: 'Libres',       val: summary.libres || 0,       color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Mantenimiento',val: summary.mantenimiento || 0,color: 'bg-amber-50  text-amber-700' },
        ].map(({ label, val, color }) => (
          <div key={label} className={`rounded-2xl p-4 text-center border border-slate-100 ${color}`}>
            <p className="text-2xl font-bold">{val}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { val: '',            label: 'Todos' },
          { val: 'desocupado',  label: '🟢 Libres' },
          { val: 'ocupado',     label: '🔴 Ocupados' },
          { val: 'en_mantenimiento', label: '🔧 Mantenimiento' },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filter === val ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid de puestos */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : spots.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">🅿️</div>
          <p className="font-medium text-slate-600">Sin puestos registrados</p>
          <p className="text-sm mt-1">Crea unidades con tipo "parqueadero" desde el módulo de Unidades</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {spots.map(s => {
            const isOccupied = s.estado === 'ocupado';
            const isMaint    = s.estado === 'en_mantenimiento';
            return (
              <div
                key={s._id}
                className={`rounded-2xl border p-3 text-center transition-all
                  ${isOccupied ? 'bg-red-50 border-red-200' : isMaint ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}
              >
                <div className="text-xl mb-1">
                  {isOccupied ? '🔴' : isMaint ? '🔧' : '🟢'}
                </div>
                <p className="font-bold text-sm text-slate-800">{s.numero}</p>
                {s.vehiculo_asignado && (
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">{s.vehiculo_asignado.placa}</p>
                )}
                {isOccupied && s.vehiculo_asignado && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {VEHICLE_ICONS[s.vehiculo_asignado.tipo]} Apto {s.vehiculo_asignado.unit_id?.numero}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── ParkingPage ──────────────────────────────────────────────────────────────
export default function ParkingPage() {
  const [tab, setTab] = useState('vehicles');
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-slate-800">Parqueadero</h1>
          <p className="text-sm text-slate-400">Gestión de vehículos y puestos</p>
        </div>
        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 border-b border-slate-100">
            {[
              { val: 'vehicles', label: '🚗 Vehículos' },
              { val: 'spots',    label: '🅿️ Mapa de puestos' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setTab(val)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${tab === val ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'vehicles' && <VehiclesTab isAdmin={isAdmin} />}
        {tab === 'spots'    && <SpotsTab />}
      </div>
    </div>
  );
}