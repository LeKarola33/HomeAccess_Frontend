/**
 * CommonAreasPage.jsx
 * Vista principal del módulo: listado de áreas comunes.
 *
 * VISTAS POR ROL:
 *   admin     → ve todas las áreas + botones crear/editar/cambiar estado/bloquear unidades
 *   residente → ve solo áreas activas + botón "Reservar"
 *
 * ESTRUCTURA DE CARPETA SUGERIDA:
 *   src/
 *   ├── pages/
 *   │   └── commonAreas/
 *   │       ├── CommonAreasPage.jsx       ← esta página
 *   │       ├── AreaDetailPage.jsx
 *   │       ├── BookingCalendarPage.jsx
 *   │       └── components/
 *   │           ├── AreaCard.jsx
 *   │           ├── AreaFormModal.jsx
 *   │           ├── StatusModal.jsx
 *   │           └── BlockUnitModal.jsx
 *   ├── services/
 *   │   └── commonAreaService.js
 *   └── utils/
 *       └── commonAreaUtils.jsx
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAreas, createArea, updateArea, changeAreaStatus,
} from '@/services/commonAreaService';
import {
  AREA_TYPE_LABELS, AREA_TYPE_ICONS, AREA_STATUS_CONFIG,
  AreaStatusBadge, Spinner, Toast, Modal, EmptyState,
  PrimaryButton, SecondaryButton, DangerButton,
  FormField, Input, Select, Textarea,
} from '@/utils/commonAreaUtils';

// ─── useAuth hook (ajusta al tuyo real) ──────────────────────────────────────
const useAuth = () => {
  try {
    const raw = localStorage.getItem('homeaccess-auth');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed?.state?.user || {};
  } catch { return {}; }
};

// ─── AreaCard ─────────────────────────────────────────────────────────────────
const AreaCard = ({ area, isAdmin, onEdit, onChangeStatus, onBlockUnit, onSelect }) => {
  const statusCfg = AREA_STATUS_CONFIG[area.estado] || AREA_STATUS_CONFIG.activa;

  return (
    <div
      className={`group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden
        ${area.estado !== 'activa' ? 'opacity-80' : ''}`}
    >
      {/* Header con color según tipo */}
      <div className={`h-2 w-full ${area.tipo === 'piscina' ? 'bg-cyan-400' :
        area.tipo === 'salon_eventos' ? 'bg-violet-400' :
        area.tipo === 'bbq' ? 'bg-orange-400' :
        area.tipo === 'cancha' ? 'bg-emerald-400' :
        area.tipo === 'gimnasio' ? 'bg-rose-400' : 'bg-indigo-400'}`}
      />

      <div className="p-5">
        {/* Título y tipo */}
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

        {/* Descripción */}
        {area.descripcion && (
          <p className="text-sm text-slate-500 mb-4 line-clamp-2">{area.descripcion}</p>
        )}

        {/* Detalles */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-slate-400 mb-0.5">Capacidad</p>
            <p className="text-sm font-semibold text-slate-700">
              {area.capacidad_maxima > 0 ? `${area.capacidad_maxima} pers.` : 'Sin límite'}
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-slate-400 mb-0.5">Aprobación</p>
            <p className="text-sm font-semibold text-slate-700">
              {area.requiere_aprobacion ? 'Manual' : 'Automática'}
            </p>
          </div>
        </div>

        {/* Franjas horarias */}
        {area.franjas_horarias?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-400 mb-1.5">Horarios disponibles</p>
            <div className="flex flex-wrap gap-1">
              {area.franjas_horarias.slice(0, 3).map((f) => (
                <span key={f} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-lg font-medium">
                  {f}
                </span>
              ))}
              {area.franjas_horarias.length > 3 && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-lg">
                  +{area.franjas_horarias.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Motivo de bloqueo */}
        {area.motivo_bloqueo && (
          <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-xs text-amber-700">⚠️ {area.motivo_bloqueo}</p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2 pt-1">
          {area.estado === 'activa' && (
            <button
              onClick={() => onSelect(area)}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {isAdmin ? 'Ver reservas' : 'Reservar'}
            </button>
          )}

          {isAdmin && (
            <>
              <button
                onClick={() => onEdit(area)}
                className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors"
                title="Editar"
              >
                ✏️
              </button>
              <button
                onClick={() => onChangeStatus(area)}
                className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors"
                title="Cambiar estado"
              >
                🔄
              </button>
              <button
                onClick={() => onBlockUnit(area)}
                className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors"
                title="Bloquear unidad"
              >
                🔒
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── AreaFormModal ────────────────────────────────────────────────────────────
const AreaFormModal = ({ area, onClose, onSaved }) => {
  const isEditing = Boolean(area?._id);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    nombre:                    area?.nombre || '',
    tipo:                      area?.tipo || 'salon_eventos',
    descripcion:               area?.descripcion || '',
    capacidad_maxima:          area?.capacidad_maxima || 20,
    requiere_aprobacion:       area?.requiere_aprobacion ?? true,
    anticipacion_minima_horas: area?.anticipacion_minima_horas || 24,
    max_reservas_activas_por_unidad: area?.max_reservas_activas_por_unidad || 1,
    franjas_horarias:          area?.franjas_horarias?.join(', ') || '08:00-10:00, 10:00-12:00, 14:00-16:00, 16:00-18:00',
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!form.tipo) e.tipo = 'El tipo es requerido';
    if (form.capacidad_maxima < 1) e.capacidad_maxima = 'Mínimo 1';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        franjas_horarias: form.franjas_horarias.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (isEditing) {
        await updateArea(area._id, payload);
      } else {
        await createArea(payload);
      }
      onSaved();
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={isEditing ? 'Editar área' : 'Nueva área común'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {errors.general}
          </div>
        )}

        <FormField label="Nombre" required error={errors.nombre}>
          <Input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} error={errors.nombre} placeholder="Ej: Salón Principal" />
        </FormField>

        <FormField label="Tipo" required error={errors.tipo}>
          <Select value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
            {Object.entries(AREA_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{AREA_TYPE_ICONS[val]} {label}</option>
            ))}
          </Select>
        </FormField>

        <FormField label="Descripción">
          <Textarea value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Descripción del área..." />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Capacidad máxima" error={errors.capacidad_maxima}>
            <Input type="number" min="1" value={form.capacidad_maxima} onChange={(e) => set('capacidad_maxima', Number(e.target.value))} />
          </FormField>
          <FormField label="Anticipación mínima (h)">
            <Input type="number" min="0" value={form.anticipacion_minima_horas} onChange={(e) => set('anticipacion_minima_horas', Number(e.target.value))} />
          </FormField>
        </div>

        <FormField label="Franjas horarias (separadas por coma)">
          <Input value={form.franjas_horarias} onChange={(e) => set('franjas_horarias', e.target.value)} placeholder="08:00-10:00, 10:00-12:00" />
          <p className="text-xs text-slate-400 mt-1">Formato: HH:MM-HH:MM separadas por coma</p>
        </FormField>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-slate-700">Requiere aprobación manual</p>
            <p className="text-xs text-slate-400">El admin aprueba cada reserva</p>
          </div>
          <button
            type="button"
            onClick={() => set('requiere_aprobacion', !form.requiere_aprobacion)}
            className={`w-11 h-6 rounded-full transition-colors ${form.requiere_aprobacion ? 'bg-indigo-600' : 'bg-slate-300'}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-0.5 ${form.requiere_aprobacion ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <SecondaryButton onClick={onClose} className="flex-1">Cancelar</SecondaryButton>
          <PrimaryButton type="submit" disabled={loading} className="flex-1">
            {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear área'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
};

// ─── StatusModal ──────────────────────────────────────────────────────────────
const StatusModal = ({ area, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    estado:           area.estado,
    motivo_bloqueo:   area.motivo_bloqueo || '',
    fecha_reapertura: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await changeAreaStatus(area._id, form);
      onSaved();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Estado de "${area.nombre}"`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Estado">
          <Select value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}>
            <option value="activa">✅ Activa — acepta reservas</option>
            <option value="sin_servicio">⚠️ Sin servicio — cierre temporal</option>
            <option value="mantenimiento">🔧 Mantenimiento — con fecha de reapertura</option>
          </Select>
        </FormField>

        {form.estado !== 'activa' && (
          <FormField label="Motivo (visible para residentes)">
            <Textarea
              value={form.motivo_bloqueo}
              onChange={(e) => setForm((p) => ({ ...p, motivo_bloqueo: e.target.value }))}
              placeholder="Describe el motivo del cierre..."
            />
          </FormField>
        )}

        {form.estado === 'mantenimiento' && (
          <FormField label="Fecha estimada de reapertura">
            <Input
              type="date"
              value={form.fecha_reapertura}
              onChange={(e) => setForm((p) => ({ ...p, fecha_reapertura: e.target.value }))}
            />
          </FormField>
        )}

        <div className="flex gap-3 pt-2">
          <SecondaryButton onClick={onClose} className="flex-1">Cancelar</SecondaryButton>
          <PrimaryButton type="submit" disabled={loading} className="flex-1">
            {loading ? 'Guardando...' : 'Cambiar estado'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
};

// ─── BlockUnitModal ───────────────────────────────────────────────────────────
const BlockUnitModal = ({ area, onClose, onSaved }) => {
  const [unitId, setUnitId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBlock = async (e) => {
    e.preventDefault();
    if (!unitId.trim()) return;
    setLoading(true);
    try {
      const { blockUnit } = await import('@/services/commonAreaService');
      await blockUnit(area._id, { unit_id: unitId, motivo });
      onSaved('Unidad bloqueada');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!unitId.trim()) return;
    setLoading(true);
    try {
      const { unblockUnit } = await import('@/services/commonAreaService');
      await unblockUnit(area._id, { unit_id: unitId });
      onSaved('Unidad desbloqueada');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={`Bloqueo por unidad — ${area.nombre}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
          💡 Ingresa el ID de la unidad para bloquear o desbloquear su acceso a este área.
        </div>

        <FormField label="ID de la unidad (unit_id)">
          <Input value={unitId} onChange={(e) => setUnitId(e.target.value)} placeholder="Pega aquí el _id de la unidad" />
        </FormField>

        <FormField label="Motivo del bloqueo">
          <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: Mora en cuota de administración" />
        </FormField>

        {/* Lista de unidades bloqueadas actualmente */}
        {area.unidades_bloqueadas?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Unidades bloqueadas actualmente:</p>
            <div className="space-y-1">
              {area.unidades_bloqueadas.map((b) => (
                <div key={b._id} className="flex items-center justify-between p-2 bg-red-50 rounded-xl text-xs">
                  <span className="text-red-700 font-mono">
                    {b.unit_id?.numero ? `Unidad ${b.unit_id.numero}` : b.unit_id}
                  </span>
                  <span className="text-red-500">{b.motivo}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <SecondaryButton onClick={onClose} className="flex-1">Cerrar</SecondaryButton>
          <DangerButton onClick={handleBlock} disabled={loading || !unitId} className="flex-1">
            🔒 Bloquear
          </DangerButton>
          <PrimaryButton onClick={handleUnblock} disabled={loading || !unitId} className="flex-1">
            🔓 Desbloquear
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
};

// ─── CommonAreasPage ──────────────────────────────────────────────────────────
export default function CommonAreasPage() {
  const user   = useAuth();
  const nav    = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [areas,    setAreas]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);
  const [filter,   setFilter]   = useState('all');

  // Modals
  const [formModal,   setFormModal]   = useState(null); // null | area object | 'new'
  const [statusModal, setStatusModal] = useState(null);
  const [blockModal,  setBlockModal]  = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAreas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAreas();
      setAreas(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAreas(); }, [loadAreas]);

  const filteredAreas = areas.filter((a) => filter === 'all' || a.estado === filter);

  const handleSaved = (msg = 'Cambios guardados') => {
    setFormModal(null);
    setStatusModal(null);
    setBlockModal(null);
    showToast(msg);
    loadAreas();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Áreas Comunes</h1>
            <p className="text-sm text-slate-400">{areas.length} área{areas.length !== 1 ? 's' : ''} registrada{areas.length !== 1 ? 's' : ''}</p>
          </div>
          {isAdmin && (
            <PrimaryButton onClick={() => setFormModal('new')}>
              + Nueva área
            </PrimaryButton>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filtros */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { val: 'all',           label: 'Todas' },
            { val: 'activa',        label: '✅ Activas' },
            { val: 'sin_servicio',  label: '⚠️ Sin servicio' },
            { val: 'mantenimiento', label: '🔧 Mantenimiento' },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${filter === val ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filteredAreas.length === 0 ? (
          <EmptyState
            icon="🏢"
            title="Sin áreas comunes"
            description={isAdmin ? 'Crea la primera área común del conjunto.' : 'No hay áreas disponibles en este momento.'}
            action={isAdmin && <PrimaryButton onClick={() => setFormModal('new')}>+ Crear primera área</PrimaryButton>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAreas.map((area) => (
              <AreaCard
                key={area._id}
                area={area}
                isAdmin={isAdmin}
                onEdit={(a) => setFormModal(a)}
                onChangeStatus={(a) => setStatusModal(a)}
                onBlockUnit={(a) => setBlockModal(a)}
                onSelect={(a) => nav(`/common-areas/${a._id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {formModal && (
        <AreaFormModal
          area={formModal === 'new' ? null : formModal}
          onClose={() => setFormModal(null)}
          onSaved={() => handleSaved(formModal === 'new' ? 'Área creada' : 'Área actualizada')}
        />
      )}
      {statusModal && (
        <StatusModal
          area={statusModal}
          onClose={() => setStatusModal(null)}
          onSaved={() => handleSaved('Estado actualizado')}
        />
      )}
      {blockModal && (
        <BlockUnitModal
          area={blockModal}
          onClose={() => setBlockModal(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}