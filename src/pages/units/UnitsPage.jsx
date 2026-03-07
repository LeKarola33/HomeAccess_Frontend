/**
 * UnitsPage.jsx
 * Gestión de unidades residenciales del conjunto.
 * Ruta: /unidades
 *
 * Admin: crear, editar, eliminar, agregar mascotas
 * Otros roles: solo lectura
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getUnits, createUnit, updateUnit, deleteUnit,
  addMascota, removeMascota,
} from '@/services/unitService';

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPOS = [
  { value: 'apartamento', label: 'Apartamento', icon: '🏢' },
  { value: 'casa',        label: 'Casa',        icon: '🏠' },
  { value: 'local',       label: 'Local',       icon: '🏪' },
  { value: 'bodega',      label: 'Bodega',      icon: '📦' },
  { value: 'parqueadero', label: 'Parqueadero', icon: '🅿️'  },
];

const ESTADOS = [
  { value: 'desocupado',       label: 'Desocupado',       dot: 'bg-slate-400'   },
  { value: 'ocupado',          label: 'Ocupado',          dot: 'bg-emerald-500' },
  { value: 'en_mantenimiento', label: 'En mantenimiento', dot: 'bg-amber-500'   },
  { value: 'en_venta',         label: 'En venta',         dot: 'bg-blue-500'    },
];

const ESPECIES = ['perro', 'gato', 'ave', 'pez', 'reptil', 'otro'];

const TIPO_MAP   = Object.fromEntries(TIPOS.map((t) => [t.value, t]));
const ESTADO_MAP = Object.fromEntries(ESTADOS.map((e) => [e.value, e]));

const ESTADO_BADGE = {
  ocupado:          'bg-emerald-50 text-emerald-700 border-emerald-200',
  desocupado:       'bg-slate-50   text-slate-500   border-slate-200',
  en_mantenimiento: 'bg-amber-50   text-amber-700   border-amber-200',
  en_venta:         'bg-blue-50    text-blue-700    border-blue-200',
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
const useAuth = () => {
  try {
    return JSON.parse(localStorage.getItem('homeaccess-auth'))?.state?.user || {};
  } catch { return {}; }
};

// ─── UI helpers ───────────────────────────────────────────────────────────────
const Spinner = ({ size = 8 }) => (
  <div className={`w-${size} h-${size} border-2 border-slate-100 border-t-[#6366f1] rounded-full animate-spin`} />
);

const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5
    rounded-2xl text-white text-sm font-medium shadow-2xl
    ${type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
    <span>{type === 'error' ? '✕' : '✓'}</span>
    {msg}
    <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100 text-lg">×</button>
  </div>
);

const Modal = ({ title, subtitle, onClose, children, size = 'md' }) => {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#6366f1]/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 bg-white rounded-2xl shadow-2xl w-full
        ${widths[size]} max-h-[90vh] flex flex-col`}>
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

// ─── UnitFormModal ────────────────────────────────────────────────────────────
const UnitFormModal = ({ unit, onClose, onSaved }) => {
  const isEdit = Boolean(unit?._id);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const [form, setForm] = useState({
    numero:            unit?.numero  || '',
    tipo:              unit?.tipo    || 'apartamento',
    estado:            unit?.estado  || 'desocupado',
    torre:             unit?.torre   || '',
    piso:              unit?.piso    != null ? String(unit.piso) : '',
    propietario_actual: unit?.propietario_actual?._id || unit?.propietario_actual || '',
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.numero.trim()) return setError('El número de unidad es requerido');

    setLoading(true);
    try {
      const payload = {
        numero: form.numero.trim(),
        tipo:   form.tipo,
        estado: form.estado,
        torre:  form.torre  || null,
        piso:   form.piso   ? Number(form.piso) : null,
        propietario_actual: form.propietario_actual || null,
      };
      isEdit
        ? await updateUnit(unit._id, payload)
        : await createUnit(payload);
      onSaved(isEdit ? 'Unidad actualizada' : 'Unidad creada exitosamente');
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

  return (
    <Modal
      title={isEdit ? 'Editar unidad' : 'Nueva unidad'}
      subtitle={isEdit ? `Modificando ${unit.numero}` : 'Registrar nueva unidad al conjunto'}
      onClose={onClose} size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200
            rounded-xl text-sm text-red-700">
            <span className="shrink-0">⚠️</span>{error}
          </div>
        )}

        {/* Tipo */}
        <div>
          <label className={lbl}>Tipo de unidad *</label>
          <div className="grid grid-cols-5 gap-2">
            {TIPOS.map(({ value, label, icon }) => (
              <button key={value} type="button" onClick={() => set('tipo', value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border
                  text-xs font-medium transition-all
                  ${form.tipo === value
                    ? 'bg-[#6366f1] border-[#6366f1] text-white shadow-md scale-105'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'}`}>
                <span className="text-xl">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Número + Torre + Piso */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={lbl}>Número / ID *</label>
            <input value={form.numero} onChange={(e) => set('numero', e.target.value)}
              placeholder="Ej: 301, Casa 5" className={inp} />
          </div>
          <div>
            <label className={lbl}>Torre / Bloque</label>
            <input value={form.torre} onChange={(e) => set('torre', e.target.value)}
              placeholder="Ej: A, B, Norte" className={inp} />
          </div>
          <div>
            <label className={lbl}>Piso</label>
            <input type="number" value={form.piso} onChange={(e) => set('piso', e.target.value)}
              placeholder="Ej: 3" min="-2" max="200" className={inp} />
          </div>
        </div>

        {/* Estado */}
        <div>
          <label className={lbl}>Estado</label>
          <div className="grid grid-cols-4 gap-2">
            {ESTADOS.map(({ value, label, dot }) => (
              <button key={value} type="button" onClick={() => set('estado', value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border
                  text-xs font-medium transition-all
                  ${form.estado === value
                    ? 'bg-[#6366f1] border-[#6366f1] text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'}`}>
                <div className={`w-2 h-2 rounded-full ${form.estado === value ? 'bg-white' : dot}`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Propietario */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <label className={lbl}>ID del propietario
            <span className="normal-case font-normal text-slate-400 ml-1">(opcional)</span>
          </label>
          <input value={form.propietario_actual}
            onChange={(e) => set('propietario_actual', e.target.value)}
            placeholder="ObjectId del usuario propietario"
            className={`${inp} font-mono text-xs`} />
          <p className="text-xs text-slate-400 mt-1.5">
            Si asignas propietario, el estado cambia automáticamente a "Ocupado" y se registra en el historial.
          </p>
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
            {loading ? <><Spinner size={4} />Guardando...</> : isEdit ? 'Guardar cambios' : 'Crear unidad'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── DeleteModal ──────────────────────────────────────────────────────────────
const DeleteModal = ({ unit, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handle = async () => {
    setLoading(true);
    try {
      await deleteUnit(unit._id);
      onDeleted('Unidad eliminada');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const tipo = TIPO_MAP[unit.tipo] || TIPO_MAP.apartamento;

  return (
    <Modal title="Eliminar unidad" onClose={onClose} size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <span className="text-3xl">{tipo.icon}</span>
          <div>
            <p className="font-bold text-[#1a2035]">
              {unit.torre ? `Torre ${unit.torre} · ` : ''}{tipo.label} {unit.numero}
            </p>
            {unit.propietario_actual && (
              <p className="text-xs text-slate-400 mt-0.5">
                {unit.propietario_actual.nombres} {unit.propietario_actual.apellidos}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        <p className="text-sm text-slate-500">
          Esta acción no se puede deshacer. La unidad quedará inactiva en el sistema.
        </p>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700
              text-sm font-medium rounded-xl transition-colors">
            Cancelar
          </button>
          <button onClick={handle} disabled={loading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white
              text-sm font-medium rounded-xl transition-colors disabled:opacity-50
              flex items-center justify-center gap-2">
            {loading ? <><Spinner size={4} />Eliminando...</> : '🗑️ Eliminar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── UnitDetailModal ──────────────────────────────────────────────────────────
const UnitDetailModal = ({ unit, onClose, onEdit, isAdmin }) => {
  const [mascotaForm,  setMascotaForm]  = useState({ nombre: '', especie: 'perro', raza: '' });
  const [addingPet,    setAddingPet]    = useState(false);
  const [removingPet,  setRemovingPet]  = useState(null);
  const [petError,     setPetError]     = useState('');
  const [localUnit,    setLocalUnit]    = useState(unit);

  const tipo   = TIPO_MAP[localUnit.tipo]   || TIPO_MAP.apartamento;
  const estado = ESTADO_MAP[localUnit.estado] || ESTADO_MAP.desocupado;

  const handleAddPet = async (e) => {
    e.preventDefault();
    setPetError('');
    if (!mascotaForm.nombre) return setPetError('El nombre es requerido');
    setAddingPet(true);
    try {
      const r = await addMascota(localUnit._id, mascotaForm);
      setLocalUnit((p) => ({ ...p, mascotas: r.data }));
      setMascotaForm({ nombre: '', especie: 'perro', raza: '' });
    } catch (err) { setPetError(err.message); }
    finally { setAddingPet(false); }
  };

  const handleRemovePet = async (mascotaId) => {
    setRemovingPet(mascotaId);
    try {
      const r = await removeMascota(localUnit._id, mascotaId);
      setLocalUnit((p) => ({ ...p, mascotas: r.data }));
    } catch (err) { alert(err.message); }
    finally { setRemovingPet(null); }
  };

  const inp = `w-full px-3 py-2 rounded-xl border border-slate-200 text-sm
    outline-none focus:border-[#6366f1] transition-all bg-white`;
  const lbl = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1';

  return (
    <Modal
      title={`${tipo.icon} ${tipo.label} ${localUnit.numero}`}
      subtitle={localUnit.torre ? `Torre ${localUnit.torre}${localUnit.piso ? ` · Piso ${localUnit.piso}` : ''}` : ''}
      onClose={onClose} size="xl"
    >
      <div className="space-y-6">

        {/* Estado + Acciones */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border
            text-xs font-semibold ${ESTADO_BADGE[localUnit.estado] || ESTADO_BADGE.desocupado}`}>
            <div className={`w-2 h-2 rounded-full ${estado.dot}`} />
            {estado.label}
          </span>
          {isAdmin && (
            <button onClick={() => { onClose(); onEdit(localUnit); }}
              className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white
                text-sm font-medium rounded-xl transition-colors">
              ✏️ Editar unidad
            </button>
          )}
        </div>

        {/* Propietario y Residentes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Propietario</p>
            {localUnit.propietario_actual ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#6366f1] rounded-xl flex items-center
                  justify-center text-white text-sm font-bold">
                  {localUnit.propietario_actual.nombres?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1a2035]">
                    {localUnit.propietario_actual.nombres} {localUnit.propietario_actual.apellidos}
                  </p>
                  <p className="text-xs text-slate-400">{localUnit.propietario_actual.celular || '—'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Sin propietario registrado</p>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Residentes ({localUnit.residentes?.length || 0})
            </p>
            {localUnit.residentes?.length > 0 ? (
              <div className="space-y-1.5">
                {localUnit.residentes.slice(0, 3).map((r) => (
                  <div key={r._id} className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center
                      justify-center text-xs font-bold text-slate-600">
                      {r.nombres?.[0]?.toUpperCase()}
                    </div>
                    <p className="text-sm text-slate-700">{r.nombres} {r.apellidos}</p>
                  </div>
                ))}
                {localUnit.residentes.length > 3 && (
                  <p className="text-xs text-slate-400">+{localUnit.residentes.length - 3} más</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Sin residentes</p>
            )}
          </div>
        </div>

        {/* Vehículos */}
        {localUnit.vehiculos?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Vehículos ({localUnit.vehiculos.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {localUnit.vehiculos.map((v) => (
                <div key={v._id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-50
                    border border-slate-200 rounded-xl">
                  <span className="text-sm">
                    {v.tipo === 'carro' ? '🚗' : v.tipo === 'moto' ? '🏍️'
                      : v.tipo === 'bicicleta' ? '🚲' : v.tipo === 'patineta' ? '🛴' : '🚐'}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#1a2035]">
                    {v.placa || v.tipo}
                  </span>
                  {v.marca && <span className="text-xs text-slate-400">{v.marca}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mascotas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Mascotas ({localUnit.mascotas?.length || 0})
            </p>
          </div>

          {localUnit.mascotas?.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {localUnit.mascotas.map((m) => (
                <div key={m._id}
                  className="group flex items-center gap-2 px-3 py-1.5 bg-amber-50
                    border border-amber-100 rounded-xl">
                  <span className="text-sm">
                    {m.especie === 'perro' ? '🐶' : m.especie === 'gato' ? '🐱'
                      : m.especie === 'ave' ? '🐦' : m.especie === 'pez' ? '🐟'
                      : m.especie === 'reptil' ? '🦎' : '🐾'}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-amber-800">{m.nombre}</p>
                    {m.raza && <p className="text-xs text-amber-600">{m.raza}</p>}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleRemovePet(m._id)}
                      disabled={removingPet === m._id}
                      className="ml-1 w-5 h-5 flex items-center justify-center rounded-lg
                        opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-400
                        transition-all text-xs">
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic mb-3">Sin mascotas registradas</p>
          )}

          {/* Formulario agregar mascota */}
          {isAdmin && (
            <form onSubmit={handleAddPet}
              className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-3">
              <p className="text-xs font-semibold text-amber-800">+ Agregar mascota</p>
              {petError && (
                <p className="text-xs text-red-600">⚠️ {petError}</p>
              )}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={lbl}>Nombre *</label>
                  <input value={mascotaForm.nombre}
                    onChange={(e) => setMascotaForm((p) => ({ ...p, nombre: e.target.value }))}
                    placeholder="Max" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Especie *</label>
                  <select value={mascotaForm.especie}
                    onChange={(e) => setMascotaForm((p) => ({ ...p, especie: e.target.value }))}
                    className={inp}>
                    {ESPECIES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Raza</label>
                  <input value={mascotaForm.raza}
                    onChange={(e) => setMascotaForm((p) => ({ ...p, raza: e.target.value }))}
                    placeholder="Opcional" className={inp} />
                </div>
              </div>
              <button type="submit" disabled={addingPet}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white
                  text-xs font-semibold rounded-xl transition-colors disabled:opacity-50
                  flex items-center gap-2">
                {addingPet ? <><Spinner size={3} />Registrando...</> : '🐾 Registrar mascota'}
              </button>
            </form>
          )}
        </div>

        {/* Historial propietarios */}
        {localUnit.historial_propietarios?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Historial de propietarios
            </p>
            <div className="space-y-2">
              {[...localUnit.historial_propietarios].reverse().map((h, i) => (
                <div key={i}
                  className="flex items-center justify-between px-3 py-2
                    bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="font-medium text-slate-700">
                    {h.user_id?.nombres} {h.user_id?.apellidos}
                  </span>
                  <span className="text-slate-400">
                    {new Date(h.fecha_inicio).toLocaleDateString('es-CO')}
                    {h.fecha_fin
                      ? ` → ${new Date(h.fecha_fin).toLocaleDateString('es-CO')}`
                      : ' → actual'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// ─── UnitCard ─────────────────────────────────────────────────────────────────
const UnitCard = ({ unit, onClick, onEdit, onDelete, isAdmin }) => {
  const tipo   = TIPO_MAP[unit.tipo]     || TIPO_MAP.apartamento;
  const estado = ESTADO_MAP[unit.estado] || ESTADO_MAP.desocupado;

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm
        hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer
        overflow-hidden flex flex-col"
    >
      {/* Top color strip por estado */}
      <div className={`h-1 w-full ${estado.dot.replace('bg-', 'bg-')}`} />

      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#6366f1]/5 border border-[#6366f1]/10
              rounded-xl flex items-center justify-center text-2xl">
              {tipo.icon}
            </div>
            <div>
              <p className="font-bold text-[#1a2035] text-base leading-tight">
                {unit.torre ? `Torre ${unit.torre} · ` : ''}Apto {unit.numero}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {tipo.label}{unit.piso ? ` · Piso ${unit.piso}` : ''}
              </p>
            </div>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border
            text-xs font-semibold ${ESTADO_BADGE[unit.estado] || ESTADO_BADGE.desocupado}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
            {estado.label}
          </span>
        </div>

        {/* Propietario */}
        <div className="flex items-center gap-2">
          {unit.propietario_actual ? (
            <>
              <div className="w-7 h-7 bg-[#6366f1] rounded-lg flex items-center
                justify-center text-white text-xs font-bold shrink-0">
                {unit.propietario_actual.nombres?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 leading-tight">
                  {unit.propietario_actual.nombres} {unit.propietario_actual.apellidos}
                </p>
                {unit.propietario_actual.celular && (
                  <p className="text-xs text-slate-400">{unit.propietario_actual.celular}</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-300 italic">Sin propietario</p>
          )}
        </div>

        {/* Counters */}
        <div className="flex gap-2 mt-auto pt-1">
          {unit.vehiculos?.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-slate-50
              border border-slate-100 rounded-lg text-xs text-slate-500">
              🚗 {unit.vehiculos.length}
            </span>
          )}
          {unit.residentes?.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-slate-50
              border border-slate-100 rounded-lg text-xs text-slate-500">
              👥 {unit.residentes.length}
            </span>
          )}
          {unit.mascotas?.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-amber-50
              border border-amber-100 rounded-lg text-xs text-amber-600">
              🐾 {unit.mascotas.length}
            </span>
          )}
        </div>
      </div>

      {/* Admin actions */}
      {isAdmin && (
        <div className="flex border-t border-slate-100 opacity-0 group-hover:opacity-100
          transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(unit); }}
            className="flex-1 py-2.5 text-xs font-medium text-slate-500
              hover:bg-slate-50 hover:text-[#1a2035] transition-colors">
            ✏️ Editar
          </button>
          <div className="w-px bg-slate-100" />
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(unit); }}
            className="flex-1 py-2.5 text-xs font-medium text-slate-400
              hover:bg-red-50 hover:text-red-600 transition-colors">
            🗑️ Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

// ─── UnitsPage ────────────────────────────────────────────────────────────────
export default function UnitsPage() {
  const user    = useAuth();
  const isAdmin = user?.role === 'admin';

  const [units,        setUnits]        = useState([]);
  const [resumen,      setResumen]      = useState({});
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState(null);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [tipoFilter,   setTipoFilter]   = useState('');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const [pagination,   setPagination]   = useState({});
  const [formModal,    setFormModal]    = useState(null); // null | 'new' | unit obj
  const [deleteModal,  setDeleteModal]  = useState(null);
  const [detailModal,  setDetailModal]  = useState(null);

  const LIMIT = 12;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (estadoFilter) params.estado = estadoFilter;
      if (tipoFilter)   params.tipo   = tipoFilter;
      if (search)       params.numero = search;

      const r = await getUnits(params);
      setUnits(r.data || []);
      setResumen(r.resumen || {});
      setPagination(r.pagination || {});
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [estadoFilter, tipoFilter, search, page]);

  useEffect(() => { setPage(1); }, [estadoFilter, tipoFilter, search]);
  useEffect(() => { load(); }, [load]);

  const handleSaved = (msg) => {
    setFormModal(null);
    showToast(msg);
    load();
  };

  const handleDeleted = (msg) => {
    setDeleteModal(null);
    showToast(msg);
    load();
  };

  const total      = pagination.total || 0;
  const totalPages = pagination.pages || 1;
  const totalUnits = Object.values(resumen).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-[#f4f6f9]">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <span>HomeAccess</span><span>›</span>
              <span className="text-[#1a2035] font-medium">Unidades</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1a2035]">Unidades Residenciales</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            {isAdmin && (
              <button onClick={() => setFormModal('new')}
                className="px-4 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white
                  text-sm font-medium rounded-xl transition-colors">
                + Nueva unidad
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total */}
          <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-4 shadow-sm
            border border-slate-100 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#6366f1] rounded-xl flex items-center
              justify-center text-2xl">🏘️</div>
            <div>
              <p className="text-2xl font-bold text-[#1a2035]">{totalUnits}</p>
              <p className="text-xs font-medium text-slate-500">Total</p>
            </div>
          </div>

          {ESTADOS.map(({ value, label, dot }) => (
            <button key={value}
              onClick={() => setEstadoFilter(estadoFilter === value ? '' : value)}
              className={`bg-white rounded-2xl p-4 shadow-sm border transition-all text-left
                hover:shadow-md hover:-translate-y-0.5
                ${estadoFilter === value
                  ? 'border-[#6366f1] ring-2 ring-[#6366f1]/10'
                  : 'border-slate-100'}`}>
              <div className={`w-3 h-3 rounded-full ${dot} mb-2`} />
              <p className="text-xl font-bold text-[#1a2035]">{resumen[value] || 0}</p>
              <p className="text-xs font-medium text-slate-500 leading-tight">{label}</p>
            </button>
          ))}
        </div>

        {/* ── Filtros ───────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl px-5 py-4
          shadow-sm border border-slate-100">

          {/* Búsqueda */}
          <div className="relative min-w-[180px] flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm
                outline-none focus:border-[#6366f1] focus:ring-2 focus:ring-slate-100 transition-all" />
          </div>

          {/* Filtro tipo */}
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setTipoFilter('')}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all
                ${tipoFilter === ''
                  ? 'bg-[#6366f1] border-[#6366f1] text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              Todos
            </button>
            {TIPOS.map(({ value, label, icon }) => (
              <button key={value} onClick={() => setTipoFilter(tipoFilter === value ? '' : value)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all
                  ${tipoFilter === value
                    ? 'bg-[#6366f1] border-[#6366f1] text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Grid de unidades ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Spinner size={10} />
            <p className="text-sm text-slate-400">Cargando unidades...</p>
          </div>
        ) : units.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white
            rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center
              justify-center text-3xl mb-4">🏢</div>
            <p className="text-base font-semibold text-slate-700">Sin unidades</p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">
              {search || estadoFilter || tipoFilter
                ? 'No hay resultados para los filtros aplicados.'
                : 'Crea la primera unidad del conjunto.'}
            </p>
            {isAdmin && !search && !estadoFilter && !tipoFilter && (
              <button onClick={() => setFormModal('new')}
                className="mt-4 px-4 py-2.5 bg-[#6366f1] text-white text-sm
                  font-medium rounded-xl hover:bg-[#4f46e5] transition-colors">
                + Nueva unidad
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {units.map((u) => (
                <UnitCard
                  key={u._id} unit={u} isAdmin={isAdmin}
                  onClick={() => setDetailModal(u)}
                  onEdit={setFormModal}
                  onDelete={setDeleteModal}
                />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-2xl
                px-5 py-4 shadow-sm border border-slate-100">
                <p className="text-sm text-slate-400">
                  Mostrando {units.length} de {total} unidades
                </p>
                <div className="flex gap-1.5">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm
                      text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                    ‹ Anterior
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                        ${page === p
                          ? 'bg-[#6366f1] text-white'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm
                      text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                    Siguiente ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {formModal && (
        <UnitFormModal
          unit={formModal === 'new' ? null : formModal}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteModal && (
        <DeleteModal
          unit={deleteModal}
          onClose={() => setDeleteModal(null)}
          onDeleted={handleDeleted}
        />
      )}
      {detailModal && (
        <UnitDetailModal
          unit={detailModal}
          isAdmin={isAdmin}
          onClose={() => setDetailModal(null)}
          onEdit={(u) => { setDetailModal(null); setFormModal(u); }}
        />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
