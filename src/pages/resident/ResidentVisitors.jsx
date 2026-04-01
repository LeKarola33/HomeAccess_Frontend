/**
 * src/pages/resident/ResidentVisitors.jsx
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Users, Plus, X, RefreshCw, CheckCircle, Pencil } from 'lucide-react';
import { getMyVisitors, registerVisitor, cancelVisitor } from '@/api/resident.api';
import apiClient from '@/api/apiClient';

const ESTADO_CFG = {
  pendiente: { label: 'Esperado',  cls: 'bg-blue-100 text-blue-700 border border-blue-200',    dot: 'bg-blue-500' },
  ingresado: { label: 'Ingresó',   cls: 'bg-green-100 text-green-700 border border-green-200', dot: 'bg-green-500' },
  cancelado: { label: 'Cancelado', cls: 'bg-gray-100 text-gray-500 border border-gray-200',    dot: 'bg-gray-400' },
};

const TIPO_LABEL = {
  visita: '👤 Visita', proveedor: '🔧 Proveedor',
  delivery: '📦 Delivery', empleado: '🧹 Empleado',
};

// ── Modal registrar / editar visitante ────────────────────────
const ModalVisitante = ({ onClose, onSuccess, visitante = null, miUnidad = null }) => {
  const esEdicion = !!visitante;
  const [loading, setLoading]   = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: visitante ? {
      nombre_visitante: visitante.nombre_visitante,
      doc_visitante:    visitante.doc_visitante || '',
      tipo:             visitante.tipo,
      fecha_visita:     visitante.fecha_visita
        ? new Date(visitante.fecha_visita).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      observaciones:    visitante.observaciones || '',
    } : {
      tipo: 'visita',
      fecha_visita: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (esEdicion) {
        await apiClient.patch(`/resident/visitors/${visitante._id}`, data);
      } else {
        await registerVisitor(data);
      }
      onSuccess();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al guardar el visitante');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50
      flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md shadow-xl">

        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-xl">
              {esEdicion ? '✏️' : '👤'}
            </div>
            <h2 className="text-gray-900 font-semibold text-lg">
              {esEdicion ? 'Editar Visitante' : 'Registrar Visitante'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del visitante *
            </label>
            <input
              {...register('nombre_visitante', { required: 'El nombre es requerido' })}
              placeholder="Nombre completo"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5
                text-gray-700 text-sm focus:outline-none focus:border-blue-400"
            />
            {errors.nombre_visitante && (
              <p className="text-red-500 text-xs mt-1">{errors.nombre_visitante.message}</p>
            )}
          </div>

          {/* Documento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de documento
            </label>
            <input
              {...register('doc_visitante')}
              placeholder="Cédula o pasaporte (opcional)"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5
                text-gray-700 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Apartamento destino — automático */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apartamento destino
            </label>
            <div className={`w-full border rounded-lg px-3 py-2.5 text-sm flex items-center gap-2
              ${miUnidad
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
              <span>🏠</span>
              {miUnidad ? (
                <span className="font-semibold">
                  {miUnidad.torre ? `Torre ${miUnidad.torre} - ` : ''}Apto {miUnidad.numero}
                </span>
              ) : (
                <span className="italic text-xs">Sin unidad asignada — contacta a administración</span>
              )}
            </div>
          </div>

          {/* Tipo + Fecha */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de visita
              </label>
              <select
                {...register('tipo')}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5
                  text-gray-700 text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="visita">👤 Visita</option>
                <option value="proveedor">🔧 Proveedor</option>
                <option value="delivery">📦 Delivery</option>
                <option value="empleado">🧹 Empleado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha esperada *
              </label>
              <input
                type="date"
                {...register('fecha_visita', { required: 'Requerida' })}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5
                  text-gray-700 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <input
              {...register('observaciones')}
              placeholder="Motivo de la visita, vehículo, etc."
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5
                text-gray-700 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-600
                rounded-lg text-sm hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white
                rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors">
              {loading
                ? 'Guardando...'
                : esEdicion ? 'Guardar cambios' : 'Registrar Visitante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Página principal ──────────────────────────────────────────
const ResidentVisitors = () => {
  const [visitantes, setVisitantes]       = useState([]);
  const [loading, setLoading]             = useState(false);
  const [modal, setModal]                 = useState(false);
  const [editando, setEditando]           = useState(null);
  const [filtro, setFiltro]               = useState('todos');
  const [miUnidad, setMiUnidad]           = useState(null);

  // Cargar unidad una sola vez al montar la página
  useEffect(() => {
    apiClient.get('/resident/my-unit')
      .then(r => setMiUnidad(r.data?.data?.unit || null))
      .catch(() => {});
  }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await getMyVisitors();
      setVisitantes(res.data?.visitors || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const handleCancelar = async (id) => {
    if (!confirm('¿Cancelar esta pre-autorización?')) return;
    try { await cancelVisitor(id); cargar(); }
    catch { alert('Error al cancelar'); }
  };

  const ahora = new Date();
  const filtrados = filtro === 'todos'
    ? visitantes
    : visitantes.filter(v => {
        if (filtro === 'pendiente') return v.estado === 'pendiente';
        if (filtro === 'ingresado') return v.estado === 'ingresado';
        if (filtro === 'cancelado') return v.estado === 'cancelado';
        return true;
      });

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-gray-400 mb-1">HomeAccess › Visitantes</p>
          <h1 className="text-2xl font-bold text-gray-900">Mis Visitantes</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Pre-autoriza a tus visitantes para agilizar su ingreso
          </p>
        </div>
        <button onClick={() => { setEditando(null); setModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600
            hover:bg-blue-700 text-white rounded-lg text-sm font-semibold
            transition-colors shadow-sm">
          <Plus size={16} /> Registrar Visitante
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6
        flex items-start gap-3">
        <span className="text-blue-500 mt-0.5 shrink-0">ℹ️</span>
        <p className="text-blue-700 text-sm leading-relaxed">
          Al registrar un visitante, el portero podrá ver la pre-autorización
          cuando la persona llegue al conjunto, agilizando el ingreso.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { value: 'todos',     label: 'Todos' },
          { value: 'pendiente', label: '🔵 Esperados' },
          { value: 'ingresado', label: '✅ Ingresaron' },
          { value: 'cancelado', label: '⚫ Cancelados' },
        ].map(opt => (
          <button key={opt.value} onClick={() => setFiltro(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium
              transition-colors border
              ${filtro === opt.value
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
            {opt.label}
          </button>
        ))}
        <button onClick={cargar}
          className="p-2 bg-white border border-gray-300 rounded-lg
            text-gray-500 hover:bg-gray-50 ml-auto">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
          <Users size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">No tienes visitantes registrados</p>
          <p className="text-gray-300 text-sm mt-1">
            Registra a tus visitantes esperados para agilizar su ingreso
          </p>
          <button onClick={() => { setEditando(null); setModal(true); }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg
              text-sm font-medium hover:bg-blue-700 transition-colors">
            + Registrar primer visitante
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Encabezados */}
          <div className="grid grid-cols-6 px-5 py-3 border-b border-gray-100 bg-gray-50">
            {['Visitante', 'Apartamento', 'Tipo', 'Fecha esperada', 'Estado', 'Acción'].map(h => (
              <p key={h} className="text-xs font-semibold text-gray-400
                uppercase tracking-wider">{h}</p>
            ))}
          </div>

          {filtrados.map((v, idx) => {
            const estadoCfg = ESTADO_CFG[v.estado] || ESTADO_CFG.pendiente;
            const fechaVisita = v.fecha_visita
              ? new Date(v.fecha_visita).toLocaleDateString('es-CO', {
                  weekday: 'short', day: 'numeric', month: 'short',
                })
              : '—';
            const esHoy = v.fecha_visita &&
              new Date(v.fecha_visita).toDateString() === ahora.toDateString();

            return (
              <div key={v._id}
                className={`grid grid-cols-6 px-5 py-4 items-center
                  hover:bg-gray-50 transition-colors
                  ${idx < filtrados.length - 1 ? 'border-b border-gray-100' : ''}`}>

                {/* Visitante */}
                <div>
                  <p className="text-gray-800 text-sm font-medium">{v.nombre_visitante}</p>
                  {v.doc_visitante && (
                    <p className="text-gray-400 text-xs">{v.doc_visitante}</p>
                  )}
                  {v.observaciones && (
                    <p className="text-gray-400 text-xs truncate max-w-[140px]">{v.observaciones}</p>
                  )}
                </div>

                {/* Apartamento */}
                <div>
                  {v.unit_destino ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold
                      px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      🏠 {v.unit_destino.torre ? `Torre ${v.unit_destino.torre} - ` : ''}Apto {v.unit_destino.numero}
                    </span>
                  ) : (
                    <p className="text-gray-400 text-xs">—</p>
                  )}
                </div>

                {/* Tipo */}
                <p className="text-gray-600 text-sm">{TIPO_LABEL[v.tipo] || v.tipo}</p>

                {/* Fecha */}
                <div>
                  <p className="text-gray-600 text-sm">{fechaVisita}</p>
                  {esHoy && (
                    <span className="text-xs font-semibold text-orange-600
                      bg-orange-50 px-1.5 py-0.5 rounded-full">Hoy</span>
                  )}
                </div>

                {/* Estado */}
                <span className={`inline-flex items-center gap-1.5 text-xs
                  font-semibold px-2.5 py-1 rounded-full w-fit ${estadoCfg.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dot}`} />
                  {estadoCfg.label}
                </span>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                  {v.estado === 'pendiente' && (
                    <>
                      <button
                        onClick={() => { setEditando(v); setModal(true); }}
                        title="Editar"
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg
                          border border-blue-200 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleCancelar(v._id)}
                        className="text-xs text-red-500 hover:text-red-700
                          hover:bg-red-50 px-2.5 py-1.5 rounded-lg border
                          border-red-200 transition-colors">
                        Cancelar
                      </button>
                    </>
                  )}
                  {v.estado === 'ingresado' && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle size={13} /> Completado
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <ModalVisitante
          visitante={editando}
          miUnidad={miUnidad}
          onClose={() => { setModal(false); setEditando(null); }}
          onSuccess={() => { setModal(false); setEditando(null); cargar(); }}
        />
      )}
    </div>
  );
};

export default ResidentVisitors;