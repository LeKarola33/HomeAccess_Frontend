/**
 * PackagesPage.jsx
 * Gestión de paquetes y correspondencia en portería.
 * Ruta: /paquetes
 *
 * Admin/portero/vigilante: registrar, entregar, ver todos
 * Residente: solo ver los suyos
 */

import { useState, useEffect, useCallback } from 'react';

// ─── Constantes ───────────────────────────────────────────────────────────────
const TIPOS = [
  { value: 'paquete',    label: 'Paquete',    icon: '📦' },
  { value: 'sobre',      label: 'Sobre',      icon: '✉️'  },
  { value: 'documento',  label: 'Documento',  icon: '📄' },
  { value: 'perecedero', label: 'Perecedero', icon: '🥦' },
  { value: 'otro',       label: 'Otro',       icon: '📫' },
];

const TRANSPORTADORAS = [
  'Servientrega', 'Coordinadora', 'Interrapidísimo', 'Deprisa',
  'TCC', 'Envia', 'FedEx', 'DHL', 'Amazon', 'Mercado Libre', 'Otra',
];

const ESTADOS = [
  { value: 'en_porteria', label: 'En portería', dot: 'bg-amber-500',   badge: 'bg-amber-50  text-amber-700  border-amber-200'  },
  { value: 'entregado',   label: 'Entregado',   dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'devuelto',    label: 'Devuelto',    dot: 'bg-slate-400',   badge: 'bg-slate-50   text-slate-600  border-slate-200'  },
  { value: 'perdido',     label: 'Perdido',     dot: 'bg-red-500',     badge: 'bg-red-50     text-red-700    border-red-200'    },
];

const TIPO_MAP   = Object.fromEntries(TIPOS.map((t) => [t.value, t]));
const ESTADO_MAP = Object.fromEntries(ESTADOS.map((e) => [e.value, e]));

const BASE_URL = import.meta.env.VITE_API_URL || 'https://home-access-b.vercel.app/api/v1';

// ─── Auth + API helpers ───────────────────────────────────────────────────────
const useAuth = () => {
  try {
    return JSON.parse(localStorage.getItem('homeaccess-auth'))?.state?.user || {};
  } catch { return {}; }
};

const getToken = () => {
  try {
    return JSON.parse(localStorage.getItem('homeaccess-auth'))?.state?.accessToken || null;
  } catch { return null; }
};

const authH = () => ({
  'Content-Type': 'application/json',
  ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
});

const api = async (path, opts = {}) => {
  const res  = await fetch(`${BASE_URL}${path}`, { headers: authH(), ...opts });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.errors?.[0]?.msg || 'Error del servidor');
  return data;
};

// ─── UI helpers ───────────────────────────────────────────────────────────────
const Spinner = ({ size = 8 }) => (
  <div className={`w-${size} h-${size} border-2 border-slate-100 border-t-[#6366f1] rounded-full animate-spin`} />
);

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5
    rounded-2xl text-white text-sm font-medium shadow-2xl
    ${type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
    <span>{type === 'error' ? '✕' : '✓'}</span>{msg}
    <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100 text-lg">×</button>
  </div>
);

const Modal = ({ title, subtitle, onClose, children, size = 'md' }) => {
  const w = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#6366f1]/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 bg-white rounded-2xl shadow-2xl w-full
        ${w[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-start justify-between p-6 pb-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[#1a2035]">{title}</h2>
            {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl
              hover:bg-slate-100 text-slate-400 text-xl transition-colors">×</button>
        </div>
        <div className="px-6 pb-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// ─── RegisterModal ────────────────────────────────────────────────────────────
const RegisterModal = ({ onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [units,   setUnits]   = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);

  const [form, setForm] = useState({
    unit_destino:    '',
    destinatario_id: '',
    tipo:            'paquete',
    remitente:       '',
    transportadora:  '',
    guia:            '',
    descripcion:     '',
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Cargar unidades al abrir
  useEffect(() => {
    api('/units?limit=100').then((r) => {
      setUnits(r.data || []);
    }).catch(() => {}).finally(() => setLoadingUnits(false));
  }, []);

  // Cuando se selecciona unidad, cargar sus residentes/propietarios
  useEffect(() => {
    if (!form.unit_destino) { setUsers([]); set('destinatario_id', ''); return; }
    api(`/units/${form.unit_destino}`).then((r) => {
      const unit = r.data;
      const lista = [];
      if (unit.propietario_actual) lista.push(unit.propietario_actual);
      (unit.residentes || []).forEach((res) => {
        if (!lista.find((u) => u._id === res._id)) lista.push(res);
      });
      setUsers(lista);
      if (lista.length === 1) set('destinatario_id', lista[0]._id);
      else set('destinatario_id', '');
    }).catch(() => setUsers([]));
  }, [form.unit_destino]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.unit_destino)    return setError('Debes seleccionar la unidad de destino');
    if (!form.destinatario_id) return setError('Debes seleccionar el destinatario');

    setLoading(true);
    try {
      await api('/packages', {
        method: 'POST',
        body:   JSON.stringify({
          unit_destino:    form.unit_destino,
          destinatario_id: form.destinatario_id,
          tipo:            form.tipo,
          remitente:       form.remitente    || undefined,
          transportadora:  form.transportadora || undefined,
          guia:            form.guia         || undefined,
          descripcion:     form.descripcion  || undefined,
        }),
      });
      onSaved('Paquete registrado exitosamente');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = `w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700
    outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-slate-100 transition-all
    placeholder:text-slate-300 bg-white`;
  const lbl = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';
  const sel = `${inp} cursor-pointer`;

  return (
    <Modal title="Registrar paquete" subtitle="Nuevo ingreso en portería" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200
            rounded-xl text-sm text-red-700">
            <span className="shrink-0 mt-0.5">⚠️</span>{error}
          </div>
        )}

        {/* Tipo de paquete */}
        <div>
          <label className={lbl}>Tipo de paquete</label>
          <div className="grid grid-cols-5 gap-2">
            {TIPOS.map(({ value, label, icon }) => (
              <button key={value} type="button" onClick={() => set('tipo', value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border
                  text-xs font-medium transition-all
                  ${form.tipo === value
                    ? 'bg-[#6366f1] border-[#6366f1] text-white shadow-md scale-105'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'}`}>
                <span className="text-xl">{icon}</span>{label}
              </button>
            ))}
          </div>
        </div>

        {/* Unidad de destino — CAMPO REQUERIDO */}
        <div className="p-4 bg-[#6366f1]/3 border border-[#6366f1]/10 rounded-2xl space-y-4">
          <p className="text-xs font-bold text-[#1a2035] uppercase tracking-wide">
            📍 Destino *
          </p>

          <div>
            <label className={lbl}>Unidad / Apartamento *</label>
            {loadingUnits ? (
              <div className="flex items-center gap-2 px-3.5 py-2.5 border border-slate-200
                rounded-xl text-sm text-slate-400">
                <Spinner size={4} /> Cargando unidades...
              </div>
            ) : (
              <select value={form.unit_destino} onChange={(e) => set('unit_destino', e.target.value)}
                className={sel} required>
                <option value="">— Seleccionar unidad —</option>
                {units.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.torre ? `Torre ${u.torre} · ` : ''}Apto {u.numero}
                    {u.propietario_actual
                      ? ` — ${u.propietario_actual.nombres} ${u.propietario_actual.apellidos}`
                      : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className={lbl}>Destinatario *</label>
            {!form.unit_destino ? (
              <div className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-400 bg-slate-50">
                Selecciona primero la unidad
              </div>
            ) : users.length === 0 ? (
              <div className="px-3.5 py-2.5 border border-amber-200 rounded-xl text-sm text-amber-600 bg-amber-50">
                ⚠️ Esta unidad no tiene residentes registrados
              </div>
            ) : (
              <select value={form.destinatario_id} onChange={(e) => set('destinatario_id', e.target.value)}
                className={sel} required>
                <option value="">— Seleccionar destinatario —</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.nombres} {u.apellidos}
                    {u.celular ? ` · ${u.celular}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Remitente + Transportadora */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Remitente</label>
            <input value={form.remitente} onChange={(e) => set('remitente', e.target.value)}
              placeholder="Nombre del remitente" className={inp} />
          </div>
          <div>
            <label className={lbl}>Transportadora</label>
            <select value={form.transportadora} onChange={(e) => set('transportadora', e.target.value)}
              className={sel}>
              <option value="">— Sin especificar —</option>
              {TRANSPORTADORAS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Guía */}
        <div>
          <label className={lbl}>Número de guía</label>
          <input value={form.guia} onChange={(e) => set('guia', e.target.value)}
            placeholder="Ej: 90001234567" className={`${inp} font-mono`} />
        </div>

        {/* Descripción */}
        <div>
          <label className={lbl}>Descripción <span className="normal-case font-normal text-slate-400">(opcional)</span></label>
          <textarea value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)}
            placeholder="Observaciones sobre el paquete..."
            rows={2}
            className={`${inp} resize-none`} />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700
              text-sm font-medium rounded-xl transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white
              text-sm font-medium rounded-xl transition-colors disabled:opacity-50
              flex items-center justify-center gap-2">
            {loading ? <><Spinner size={4} />Guardando...</> : '📦 Registrar paquete'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── EntregarModal ────────────────────────────────────────────────────────────
const EntregarModal = ({ pkg, onClose, onDone }) => {
  const [loading, setLoading]   = useState(false);
  const [entregadoA, setEntregadoA] = useState(pkg.destinatario_id?._id || '');

  const handle = async () => {
    setLoading(true);
    try {
      await api(`/packages/${pkg._id}/entregar`, {
        method: 'PATCH',
        body:   JSON.stringify({ entregado_a: entregadoA || undefined }),
      });
      onDone('Paquete entregado exitosamente');
    } catch (err) {
      alert(err.message);
      setLoading(false);
    }
  };

  const tipo = TIPO_MAP[pkg.tipo] || TIPO_MAP.paquete;

  return (
    <Modal title="Entregar paquete" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <span className="text-3xl">{tipo.icon}</span>
          <div>
            <p className="font-bold text-[#1a2035]">{tipo.label}</p>
            <p className="text-sm text-slate-500">
              {[pkg.transportadora, pkg.guia].filter(Boolean).join(' · ') || 'Sin guía'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Para: {pkg.destinatario_id?.nombres} {pkg.destinatario_id?.apellidos}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600">
          ¿Confirmas la entrega a{' '}
          <strong>{pkg.destinatario_id?.nombres} {pkg.destinatario_id?.apellidos}</strong>?
        </p>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700
              text-sm font-medium rounded-xl transition-colors">
            Cancelar
          </button>
          <button onClick={handle} disabled={loading}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white
              text-sm font-medium rounded-xl transition-colors disabled:opacity-50
              flex items-center justify-center gap-2">
            {loading ? <><Spinner size={4} />Confirmando...</> : '✅ Confirmar entrega'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── PackageRow ───────────────────────────────────────────────────────────────
const PackageRow = ({ pkg, isStaff, onEntregar, idx }) => {
  const tipo   = TIPO_MAP[pkg.tipo]     || TIPO_MAP.paquete;
  const estado = ESTADO_MAP[pkg.estado] || ESTADO_MAP.en_porteria;

  const diasEnPorteria = pkg.estado === 'en_porteria'
    ? Math.floor((Date.now() - new Date(pkg.fecha_recepcion)) / 86400000)
    : null;

  return (
    <tr className={`group transition-colors
      ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}
      hover:bg-blue-50/20`}>

      {/* Tipo + Transportadora */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#6366f1]/5 border border-[#6366f1]/10
            rounded-xl flex items-center justify-center text-xl shrink-0">
            {tipo.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1a2035]">{tipo.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {pkg.transportadora || 'Sin transportadora'}
            </p>
          </div>
        </div>
      </td>

      {/* Guía + Remitente */}
      <td className="px-5 py-4">
        {pkg.guia
          ? <p className="font-mono text-sm font-bold text-[#1a2035]">{pkg.guia}</p>
          : <p className="text-slate-300 text-sm italic">Sin guía</p>}
        {pkg.remitente && (
          <p className="text-xs text-slate-400 mt-0.5">De: {pkg.remitente}</p>
        )}
      </td>

      {/* Destinatario + Unidad */}
      <td className="px-5 py-4">
        {pkg.destinatario_id ? (
          <div>
            <p className="text-sm font-medium text-slate-700">
              {pkg.destinatario_id.nombres} {pkg.destinatario_id.apellidos}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Apto {pkg.unit_destino?.numero}
              {pkg.unit_destino?.torre ? ` · Torre ${pkg.unit_destino.torre}` : ''}
            </p>
          </div>
        ) : <span className="text-slate-300">—</span>}
      </td>

      {/* Fecha */}
      <td className="px-5 py-4">
        <p className="text-sm text-slate-600">
          {new Date(pkg.fecha_recepcion).toLocaleDateString('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </p>
        {diasEnPorteria !== null && (
          <p className={`text-xs mt-0.5 font-medium
            ${diasEnPorteria > 5 ? 'text-red-500' : diasEnPorteria > 2 ? 'text-amber-500' : 'text-slate-400'}`}>
            {diasEnPorteria === 0 ? 'Hoy' : `Hace ${diasEnPorteria} día${diasEnPorteria > 1 ? 's' : ''}`}
          </p>
        )}
      </td>

      {/* Estado */}
      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
          border text-xs font-semibold ${estado.badge}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
          {estado.label}
        </span>
      </td>

      {/* Acción */}
      {isStaff && (
        <td className="px-5 py-4">
          {pkg.estado === 'en_porteria' && (
            <button
              onClick={() => onEntregar(pkg)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700
                border border-emerald-200 text-xs font-medium rounded-xl
                opacity-0 group-hover:opacity-100 transition-all">
              ✅ Entregar
            </button>
          )}
        </td>
      )}
    </tr>
  );
};

// ─── PackagesPage ─────────────────────────────────────────────────────────────
export default function PackagesPage() {
  const user    = useAuth();
  const isStaff = ['admin', 'portero', 'vigilante'].includes(user?.role);

  const [packages,     setPackages]     = useState([]);
  const [resumen,      setResumen]      = useState({});
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState(null);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [page,         setPage]         = useState(1);
  const [pagination,   setPagination]   = useState({});
  const [registerModal, setRegisterModal] = useState(false);
  const [entregarModal, setEntregarModal] = useState(null);

  const LIMIT = 15;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (estadoFilter) params.set('estado', estadoFilter);
      const r = await api(`/packages?${params}`);
      setPackages(r.data || []);
      setResumen(r.resumen || {});
      setPagination(r.pagination || {});
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [estadoFilter, page]);

  useEffect(() => { setPage(1); }, [estadoFilter]);
  useEffect(() => { load(); }, [load]);

  const total      = pagination.total || 0;
  const totalPages = pagination.pages || 1;
  const enPorteria = resumen['en_porteria'] || 0;

  return (
    <div className="min-h-screen bg-[#f4f6f9]">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <span>HomeAccess</span><span>›</span>
              <span className="text-[#1a2035] font-medium">Paquetes</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1a2035]">Paquetes</h1>
              {enPorteria > 0 && (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs
                  font-bold rounded-full border border-amber-200">
                  {enPorteria} en portería
                </span>
              )}
            </div>
          </div>
          {isStaff && (
            <button onClick={() => setRegisterModal(true)}
              className="px-4 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white
                text-sm font-medium rounded-xl transition-colors">
              + Registrar paquete
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ESTADOS.map(({ value, label, dot, badge }) => (
            <button key={value}
              onClick={() => setEstadoFilter(estadoFilter === value ? '' : value)}
              className={`bg-white rounded-2xl p-4 shadow-sm border text-left
                transition-all hover:shadow-md hover:-translate-y-0.5
                ${estadoFilter === value
                  ? 'border-[#6366f1] ring-2 ring-[#6366f1]/10'
                  : 'border-slate-100'}`}>
              <div className={`w-3 h-3 rounded-full ${dot} mb-2`} />
              <p className="text-2xl font-bold text-[#1a2035]">{resumen[value] || 0}</p>
              <p className="text-xs font-medium text-slate-500">{label}</p>
            </button>
          ))}
        </div>

        {/* ── Tabla ────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-600">
              {total} paquete{total !== 1 ? 's' : ''}
              {estadoFilter ? ` · ${ESTADO_MAP[estadoFilter]?.label}` : ''}
            </p>
            <div className="ml-auto flex gap-1.5">
              {[{ value: '', label: 'Todos' }, ...ESTADOS].map(({ value, label }) => (
                <button key={value}
                  onClick={() => setEstadoFilter(value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                    ${estadoFilter === value
                      ? 'bg-[#6366f1] border-[#6366f1] text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Spinner size={10} />
              <p className="text-sm text-slate-400">Cargando paquetes...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center
                justify-center text-3xl mb-4">📦</div>
              <p className="text-base font-semibold text-slate-700">Sin paquetes</p>
              <p className="text-sm text-slate-400 mt-1">
                {estadoFilter ? 'No hay paquetes con este estado.' : 'Aún no hay paquetes registrados.'}
              </p>
              {isStaff && !estadoFilter && (
                <button onClick={() => setRegisterModal(true)}
                  className="mt-4 px-4 py-2.5 bg-[#6366f1] text-white text-sm
                    font-medium rounded-xl hover:bg-[#4f46e5] transition-colors">
                  + Registrar paquete
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Tipo', 'Guía / Remitente', 'Destinatario', 'Recibido', 'Estado',
                        ...(isStaff ? [''] : [])].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold
                          text-slate-400 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {packages.map((p, i) => (
                      <PackageRow
                        key={p._id} pkg={p} idx={i} isStaff={isStaff}
                        onEntregar={setEntregarModal}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4
                  border-t border-slate-100">
                  <p className="text-sm text-slate-400">
                    Mostrando {packages.length} de {total}
                  </p>
                  <div className="flex gap-1.5">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm
                        text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                      ‹ Anterior
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium
                          ${page === p
                            ? 'bg-[#6366f1] text-white'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm
                        text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                      Siguiente ›
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {registerModal && (
        <RegisterModal
          onClose={() => setRegisterModal(false)}
          onSaved={(msg) => { setRegisterModal(false); showToast(msg); load(); }}
        />
      )}
      {entregarModal && (
        <EntregarModal
          pkg={entregarModal}
          onClose={() => setEntregarModal(null)}
          onDone={(msg) => { setEntregarModal(null); showToast(msg); load(); }}
        />
      )}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
