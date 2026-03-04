/**
 * AreaDetailPage.jsx
 * Detalle de un área común: info + listado de reservas con
 * opciones de aprobar / rechazar / cancelar.
 *
 * Ruta sugerida en React Router: /common-areas/:id
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAreaById, getBookings, approveBooking, rejectBooking, cancelBooking,
} from '@/services/commonAreaService';
import {
  AREA_TYPE_LABELS, AREA_TYPE_ICONS,
  AreaStatusBadge, BookingStatusBadge,
  Spinner, Toast, Modal, EmptyState,
  PrimaryButton, SecondaryButton, DangerButton,
  FormField, Textarea,
  formatDate,
} from '@/utils/commonAreaUtils';

const useAuth = () => {
  try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
};

// ─── RejectModal ──────────────────────────────────────────────────────────────
const RejectModal = ({ booking, areaId, onClose, onDone }) => {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!motivo.trim()) return;
    setLoading(true);
    try {
      await rejectBooking(areaId, booking._id, motivo);
      onDone('Reserva rechazada');
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Rechazar reserva" onClose={onClose}>
      <form onSubmit={handle} className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-xl text-sm">
          <p className="text-slate-600">
            <span className="font-medium">Unidad:</span> {booking.unit_id?.numero || '—'}
            {booking.unit_id?.torre ? ` Torre ${booking.unit_id.torre}` : ''}
          </p>
          <p className="text-slate-600">
            <span className="font-medium">Fecha:</span> {formatDate(booking.fecha)} · {booking.franja_horaria}
          </p>
        </div>
        <FormField label="Motivo del rechazo" required>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Describe el motivo..."
          />
        </FormField>
        <div className="flex gap-3">
          <SecondaryButton onClick={onClose} className="flex-1">Cancelar</SecondaryButton>
          <DangerButton type="submit" disabled={loading || !motivo.trim()} className="flex-1">
            {loading ? 'Rechazando...' : 'Rechazar reserva'}
          </DangerButton>
        </div>
      </form>
    </Modal>
  );
};

// ─── CancelModal ──────────────────────────────────────────────────────────────
const CancelModal = ({ booking, areaId, onClose, onDone }) => {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await cancelBooking(areaId, booking._id, motivo || 'Cancelado por administración');
      onDone('Reserva cancelada');
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Cancelar reserva" onClose={onClose}>
      <form onSubmit={handle} className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-xl text-sm">
          <p className="text-slate-600">
            <span className="font-medium">Unidad:</span> {booking.unit_id?.numero || '—'}
          </p>
          <p className="text-slate-600">
            <span className="font-medium">Fecha:</span> {formatDate(booking.fecha)} · {booking.franja_horaria}
          </p>
        </div>
        <FormField label="Motivo (opcional)">
          <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de cancelación..." />
        </FormField>
        <div className="flex gap-3">
          <SecondaryButton onClick={onClose} className="flex-1">No cancelar</SecondaryButton>
          <DangerButton type="submit" disabled={loading} className="flex-1">
            {loading ? 'Cancelando...' : 'Cancelar reserva'}
          </DangerButton>
        </div>
      </form>
    </Modal>
  );
};

// ─── BookingRow ───────────────────────────────────────────────────────────────
const BookingRow = ({ booking, areaId, isAdmin, onApprove, onReject, onCancel, loading }) => {
  const canManage = isAdmin && booking.estado === 'pendiente';
  const canCancel = booking.estado === 'pendiente' || booking.estado === 'aprobada';

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
      {/* Fecha y franja */}
      <div className="min-w-[110px]">
        <p className="text-sm font-medium text-slate-700">{formatDate(booking.fecha)}</p>
        <p className="text-xs text-indigo-600 font-medium mt-0.5">{booking.franja_horaria}</p>
      </div>

      {/* Solicitante */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 truncate">
          {booking.solicitante_id?.nombres} {booking.solicitante_id?.apellidos}
        </p>
        <p className="text-xs text-slate-400">
          Apto {booking.unit_id?.numero || '—'}
          {booking.unit_id?.torre ? ` · Torre ${booking.unit_id.torre}` : ''}
          {booking.num_asistentes ? ` · ${booking.num_asistentes} pers.` : ''}
        </p>
        {booking.descripcion && (
          <p className="text-xs text-slate-400 italic truncate mt-0.5">"{booking.descripcion}"</p>
        )}
      </div>

      {/* Estado */}
      <BookingStatusBadge status={booking.estado} />

      {/* Acciones */}
      {(canManage || (isAdmin && canCancel)) && (
        <div className="flex gap-1.5 shrink-0">
          {canManage && (
            <>
              <button
                onClick={() => onApprove(booking)}
                disabled={loading}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200 transition-colors disabled:opacity-50"
              >
                ✓ Aprobar
              </button>
              <button
                onClick={() => onReject(booking)}
                disabled={loading}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-lg border border-red-200 transition-colors disabled:opacity-50"
              >
                ✕ Rechazar
              </button>
            </>
          )}
          {isAdmin && canCancel && booking.estado === 'aprobada' && (
            <button
              onClick={() => onCancel(booking)}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── AreaDetailPage ───────────────────────────────────────────────────────────
export default function AreaDetailPage() {
  const { id }   = useParams();
  const nav      = useNavigate();
  const user     = useAuth();
  const isAdmin  = user?.role === 'admin';

  const [area,       setArea]       = useState(null);
  const [bookings,   setBookings]   = useState([]);
  const [loadingArea, setLoadingArea] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast,      setToast]      = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadArea = useCallback(async () => {
    try {
      const res = await getAreaById(id);
      setArea(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingArea(false);
    }
  }, [id]);

  const loadBookings = useCallback(async () => {
    try {
      setLoadingBookings(true);
      const params = statusFilter ? { estado: statusFilter } : {};
      const res = await getBookings(id, params);
      setBookings(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingBookings(false);
    }
  }, [id, statusFilter]);

  useEffect(() => { loadArea(); }, [loadArea]);
  useEffect(() => { loadBookings(); }, [loadBookings]);

  const handleApprove = async (booking) => {
    setActionLoading(true);
    try {
      await approveBooking(id, booking._id);
      showToast('Reserva aprobada ✓');
      loadBookings();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDone = (msg) => {
    setRejectModal(null);
    setCancelModal(null);
    showToast(msg);
    loadBookings();
  };

  // Contadores por estado
  const counts = bookings.reduce((acc, b) => {
    acc[b.estado] = (acc[b.estado] || 0) + 1;
    return acc;
  }, {});

  if (loadingArea) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  if (!area) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <EmptyState icon="❓" title="Área no encontrada" description="Verifica la URL" action={<PrimaryButton onClick={() => nav('/common-areas')}>Volver</PrimaryButton>} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <button onClick={() => nav('/common-areas')} className="text-sm text-indigo-600 hover:underline mb-2 flex items-center gap-1">
            ← Áreas comunes
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{AREA_TYPE_ICONS[area.tipo]}</span>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{area.nombre}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-slate-400">{AREA_TYPE_LABELS[area.tipo]}</span>
                  <AreaStatusBadge status={area.estado} />
                </div>
              </div>
            </div>

            {/* Botón reservar para residentes */}
            {!isAdmin && area.estado === 'activa' && (
              <PrimaryButton onClick={() => nav(`/common-areas/${id}/book`)}>
                📅 Reservar
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Info del área */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Capacidad', value: area.capacidad_maxima > 0 ? `${area.capacidad_maxima} personas` : 'Sin límite' },
              { label: 'Aprobación', value: area.requiere_aprobacion ? 'Manual' : 'Automática' },
              { label: 'Anticipación mínima', value: `${area.anticipacion_minima_horas}h` },
              { label: 'Máx. reservas activas', value: `${area.max_reservas_activas_por_unidad} por unidad` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="text-sm font-semibold text-slate-700">{value}</p>
              </div>
            ))}
          </div>

          {area.descripcion && (
            <p className="mt-4 text-sm text-slate-500 border-t border-slate-100 pt-4">{area.descripcion}</p>
          )}

          {area.motivo_bloqueo && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
              ⚠️ {area.motivo_bloqueo}
              {area.fecha_reapertura && ` · Reapertura: ${formatDate(area.fecha_reapertura)}`}
            </div>
          )}

          {/* Franjas */}
          <div className="mt-4">
            <p className="text-xs text-slate-400 mb-2">Franjas horarias</p>
            <div className="flex flex-wrap gap-1.5">
              {area.franjas_horarias?.map((f) => (
                <span key={f} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full font-medium">{f}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Panel de reservas */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800">Reservas</h2>
              {!isAdmin && area.estado === 'activa' && (
                <PrimaryButton onClick={() => nav(`/common-areas/${id}/book`)}>
                  + Nueva reserva
                </PrimaryButton>
              )}
            </div>

            {/* Contadores (admin) */}
            {isAdmin && (
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { estado: '',           label: `Todas (${bookings.length})` },
                  { estado: 'pendiente',  label: `Pendientes (${counts.pendiente || 0})` },
                  { estado: 'aprobada',   label: `Aprobadas (${counts.aprobada || 0})` },
                  { estado: 'rechazada',  label: `Rechazadas (${counts.rechazada || 0})` },
                  { estado: 'cancelada',  label: `Canceladas (${counts.cancelada || 0})` },
                ].map(({ estado, label }) => (
                  <button
                    key={estado}
                    onClick={() => setStatusFilter(estado)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                      ${statusFilter === estado ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadingBookings ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : bookings.length === 0 ? (
            <EmptyState
              icon="📅"
              title="Sin reservas"
              description={statusFilter ? `No hay reservas ${statusFilter}s` : 'Aún no hay reservas para este área'}
            />
          ) : (
            <div>
              {bookings.map((b) => (
                <BookingRow
                  key={b._id}
                  booking={b}
                  areaId={id}
                  isAdmin={isAdmin}
                  onApprove={handleApprove}
                  onReject={setRejectModal}
                  onCancel={setCancelModal}
                  loading={actionLoading}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {rejectModal && (
        <RejectModal booking={rejectModal} areaId={id} onClose={() => setRejectModal(null)} onDone={handleDone} />
      )}
      {cancelModal && (
        <CancelModal booking={cancelModal} areaId={id} onClose={() => setCancelModal(null)} onDone={handleDone} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
