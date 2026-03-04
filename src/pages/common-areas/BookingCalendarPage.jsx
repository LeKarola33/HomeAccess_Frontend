/**
 * BookingCalendarPage.jsx
 * Página para que el residente seleccione fecha y franja horaria
 * y cree una reserva en un área común.
 *
 * Ruta sugerida: /common-areas/:id/book
 *
 * FLUJO:
 *   1. El residente ve el calendario del mes
 *   2. Selecciona un día
 *   3. El sistema consulta disponibilidad (GET /disponibilidad?fecha=)
 *   4. El residente elige franja libre
 *   5. Llena asistentes y descripción
 *   6. Confirma → POST /reservas
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAreaById, getAvailability, createBooking } from '@/services/commonAreaService';
import {
  AREA_TYPE_ICONS, AreaStatusBadge,
  Spinner, Toast, PrimaryButton, SecondaryButton,
  FormField, Input, Textarea,
} from '@/utils/commonAreaUtils';

const useAuth = () => {
  try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
};

// ─── MiniCalendar ─────────────────────────────────────────────────────────────
const MiniCalendar = ({ selectedDate, onSelect, anticipacionHoras }) => {
  const today    = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  const firstWeekday  = new Date(year, month, 1).getDay(); // 0=Dom

  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const dayNames   = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];

  const isDisabled = (day) => {
    const d = new Date(year, month, day);
    const minDate = new Date(today.getTime() + anticipacionHoras * 60 * 60 * 1000);
    minDate.setHours(0, 0, 0, 0);
    return d < minDate;
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    const d = new Date(year, month, day);
    return d.toDateString() === new Date(selectedDate).toDateString();
  };

  const isToday = (day) => {
    return new Date(year, month, day).toDateString() === today.toDateString();
  };

  const prev = () => setViewDate(new Date(year, month - 1, 1));
  const next = () => setViewDate(new Date(year, month + 1, 1));

  const handleSelect = (day) => {
    if (isDisabled(day)) return;
    const d = new Date(year, month, day);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    onSelect(iso);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">‹</button>
        <h3 className="text-sm font-semibold text-slate-700">{monthNames[month]} {year}</h3>
        <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">›</button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-xs text-slate-400 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Empty cells for first week */}
        {Array.from({ length: firstWeekday }).map((_, i) => <div key={`empty-${i}`} />)}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const disabled = isDisabled(day);
          const selected = isSelected(day);
          const todayDay = isToday(day);

          return (
            <button
              key={day}
              onClick={() => handleSelect(day)}
              disabled={disabled}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-xl transition-all
                ${disabled ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-indigo-50 cursor-pointer'}
                ${selected ? 'bg-indigo-600 text-white font-bold hover:bg-indigo-700' : ''}
                ${todayDay && !selected ? 'border-2 border-indigo-300 font-semibold text-indigo-600' : ''}
                ${!disabled && !selected && !todayDay ? 'text-slate-700' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {anticipacionHoras > 0 && (
        <p className="text-xs text-slate-400 mt-3 text-center">
          * Reservar con mínimo {anticipacionHoras}h de anticipación
        </p>
      )}
    </div>
  );
};

// ─── TimeSlots ────────────────────────────────────────────────────────────────
const TimeSlots = ({ slots, selected, onSelect, loading }) => {
  if (loading) return (
    <div className="flex justify-center py-8"><Spinner /></div>
  );

  if (!slots.length) return (
    <p className="text-sm text-slate-400 text-center py-8">No hay franjas disponibles para esta fecha</p>
  );

  return (
    <div className="grid grid-cols-2 gap-2">
      {slots.map(({ franja, disponible }) => (
        <button
          key={franja}
          onClick={() => disponible && onSelect(franja)}
          disabled={!disponible}
          className={`
            p-3 rounded-xl border text-sm font-medium transition-all
            ${!disponible ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed line-through' : ''}
            ${disponible && selected === franja ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : ''}
            ${disponible && selected !== franja ? 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50' : ''}
          `}
        >
          {franja}
          {!disponible && <span className="block text-xs font-normal mt-0.5">Ocupado</span>}
        </button>
      ))}
    </div>
  );
};

// ─── BookingCalendarPage ──────────────────────────────────────────────────────
export default function BookingCalendarPage() {
  const { id } = useParams();
  const nav    = useNavigate();
  const user   = useAuth();

  const [area,          setArea]          = useState(null);
  const [loadingArea,   setLoadingArea]   = useState(true);
  const [selectedDate,  setSelectedDate]  = useState('');
  const [slots,         setSlots]         = useState([]);
  const [loadingSlots,  setLoadingSlots]  = useState(false);
  const [selectedSlot,  setSelectedSlot]  = useState('');
  const [asistentes,    setAsistentes]    = useState(1);
  const [descripcion,   setDescripcion]   = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [toast,         setToast]         = useState(null);
  const [errors,        setErrors]        = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Cargar área
  useEffect(() => {
    getAreaById(id)
      .then((res) => setArea(res.data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoadingArea(false));
  }, [id]);

  // Cargar disponibilidad al seleccionar fecha
  const loadSlots = useCallback(async (date) => {
    if (!date) return;
    setLoadingSlots(true);
    setSelectedSlot('');
    try {
      const res = await getAvailability(id, date);
      setSlots(res.franjas || []);
    } catch (err) {
      showToast(err.message, 'error');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [id]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    loadSlots(date);
  };

  const validate = () => {
    const e = {};
    if (!selectedDate) e.date = 'Selecciona una fecha';
    if (!selectedSlot) e.slot = 'Selecciona una franja horaria';
    if (!user.unidades?.length) e.unit = 'Tu usuario no tiene unidades asignadas';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await createBooking(id, {
        unit_id:       user.unidades[0], // primera unidad del residente
        fecha:         selectedDate,
        franja_horaria: selectedSlot,
        num_asistentes: asistentes,
        descripcion,
      });

      const msg = area?.requiere_aprobacion
        ? 'Solicitud enviada. Pendiente de aprobación 📋'
        : 'Reserva confirmada automáticamente ✅';
      showToast(msg);

      setTimeout(() => nav(`/common-areas/${id}`), 2000);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingArea) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  if (!area) return null;

  // Formatear fecha seleccionada para mostrar
  const dateLabel = selectedDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button onClick={() => nav(`/common-areas/${id}`)} className="text-sm text-indigo-600 hover:underline mb-2 flex items-center gap-1">
            ← {area.nombre}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{AREA_TYPE_ICONS[area.tipo]}</span>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Reservar — {area.nombre}</h1>
              <div className="flex items-center gap-2">
                <AreaStatusBadge status={area.estado} />
                {area.requiere_aprobacion && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Requiere aprobación del admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Columna izquierda: calendario */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
              1. Selecciona una fecha
            </h2>
            <MiniCalendar
              selectedDate={selectedDate}
              onSelect={handleDateSelect}
              anticipacionHoras={area.anticipacion_minima_horas || 0}
            />
            {errors.date && <p className="text-xs text-red-600">{errors.date}</p>}

            {/* Franjas horarias */}
            {selectedDate && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
                  2. Elige una franja — {dateLabel}
                </h2>
                <TimeSlots
                  slots={slots}
                  selected={selectedSlot}
                  onSelect={setSelectedSlot}
                  loading={loadingSlots}
                />
                {errors.slot && <p className="text-xs text-red-600 mt-2">{errors.slot}</p>}
              </div>
            )}
          </div>

          {/* Columna derecha: resumen y detalles */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
              3. Detalles
            </h2>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <FormField label="Número de asistentes">
                <Input
                  type="number"
                  min="1"
                  max={area.capacidad_maxima || 999}
                  value={asistentes}
                  onChange={(e) => setAsistentes(Number(e.target.value))}
                />
              </FormField>

              <FormField label="Descripción del evento (opcional)">
                <Textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Cumpleaños familiar, reunión de trabajo..."
                />
              </FormField>
            </div>

            {/* Resumen */}
            {selectedDate && selectedSlot && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-2">
                <h3 className="text-sm font-semibold text-indigo-800">Resumen de tu reserva</h3>
                <div className="space-y-1 text-sm text-indigo-700">
                  <p>📍 <span className="font-medium">{area.nombre}</span></p>
                  <p>📅 {dateLabel}</p>
                  <p>⏰ {selectedSlot}</p>
                  <p>👥 {asistentes} asistente{asistentes !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}

            {errors.unit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {errors.unit}
              </div>
            )}

            {/* Botones */}
            <div className="space-y-2">
              <PrimaryButton
                onClick={handleSubmit}
                disabled={submitting || !selectedDate || !selectedSlot}
                className="w-full justify-center"
              >
                {submitting ? 'Enviando...' : area.requiere_aprobacion ? '📋 Enviar solicitud' : '✅ Confirmar reserva'}
              </PrimaryButton>
              <SecondaryButton onClick={() => nav(`/common-areas/${id}`)} className="w-full justify-center">
                Cancelar
              </SecondaryButton>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
