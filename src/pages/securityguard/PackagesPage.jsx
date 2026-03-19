/**
 * src/pages/securityguard/PackagesPage.jsx
 * Estilo idéntico al admin — tabla con TIPO, GUÍA/REMITENTE,
 * DESTINATARIO, RECIBIDO, ESTADO
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Package, Plus, X, RefreshCw } from 'lucide-react';
import {
  getPackages, registerPackage, deliverPackage, returnPackage, getUnits,
} from '@/api/securityguard.api';

// ── Configuración de estados ──────────────────────────────────
const ESTADO_CFG = {
  en_porteria: { label: 'En portería', dot: 'bg-yellow-400', cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  entregado:   { label: 'Entregado',   dot: 'bg-green-500',  cls: 'bg-green-50 text-green-700 border border-green-200' },
  devuelto:    { label: 'Devuelto',    dot: 'bg-gray-400',   cls: 'bg-gray-100 text-gray-600 border border-gray-200' },
  perdido:     { label: 'Perdido',     dot: 'bg-red-500',    cls: 'bg-red-50 text-red-700 border border-red-200' },
};

const TIPO_ICONS = {
  paquete:    '📦',
  sobre:      '✉️',
  documento:  '📄',
  perecedero: '🥗',
  otro:       '📫',
};

// ── Modal nuevo paquete ───────────────────────────────────────
const ModalNuevoPaquete = ({ onClose, onSuccess }) => {
  const [unidades, setUnidades]   = useState([]);
  const [residentes, setResidentes] = useState([]);
  const [loading, setLoading]     = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const unitSeleccionada = watch('unit_destino');

  useEffect(() => {
    getUnits().then(r => setUnidades(r.data?.units || []));
  }, []);

  useEffect(() => {
    if (unitSeleccionada) {
      const u = unidades.find(u => u._id === unitSeleccionada);
      setResidentes(u?.residentes || (u?.propietario_actual ? [u.propietario_actual] : []));
    }
  }, [unitSeleccionada, unidades]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerPackage(data);
      onSuccess();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al registrar el paquete');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50
      flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 w-full
        max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center
              justify-center text-xl">📦</div>
            <h2 className="text-gray-900 font-semibold text-lg">
              Registrar Paquete
            </h2>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Tipo *
              </label>
              <select {...register('tipo')}
                className="w-full bg-white border border-gray-300 rounded-lg px-3
                  py-2.5 text-gray-700 text-sm focus:outline-none focus:border-violet-400">
                <option value="paquete">📦 Paquete</option>
                <option value="sobre">✉️ Sobre</option>
                <option value="documento">📄 Documento</option>
                <option value="perecedero">🥗 Perecedero</option>
                <option value="otro">📫 Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Unidad destino *
              </label>
              <select {...register('unit_destino', { required: 'Requerido' })}
                className="w-full bg-white border border-gray-300 rounded-lg px-3
                  py-2.5 text-gray-700 text-sm focus:outline-none focus:border-violet-400">
                <option value="">-- Seleccionar --</option>
                {unidades.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.torre ? `Torre ${u.torre} - ` : ''}Apto {u.numero}
                  </option>
                ))}
              </select>
              {errors.unit_destino && (
                <p className="text-red-500 text-xs mt-1">{errors.unit_destino.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Destinatario *
            </label>
            <select {...register('destinatario_id', { required: 'Requerido' })}
              className="w-full bg-white border border-gray-300 rounded-lg px-3
                py-2.5 text-gray-700 text-sm focus:outline-none focus:border-violet-400">
              <option value="">-- Seleccionar residente --</option>
              {residentes.map(r => (
                <option key={r._id || r} value={r._id || r}>
                  {r.nombres} {r.apellidos}
                </option>
              ))}
            </select>
            {errors.destinatario_id && (
              <p className="text-red-500 text-xs mt-1">{errors.destinatario_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Transportadora
              </label>
              <input {...register('transportadora')}
                placeholder="Ej: Servientrega, DHL"
                className="w-full bg-white border border-gray-300 rounded-lg px-3
                  py-2.5 text-gray-700 text-sm focus:outline-none focus:border-violet-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Número de guía
              </label>
              <input {...register('guia')}
                placeholder="Opcional"
                className="w-full bg-white border border-gray-300 rounded-lg px-3
                  py-2.5 text-gray-700 text-sm focus:outline-none focus:border-violet-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Remitente
            </label>
            <input {...register('remitente')}
              placeholder="Quien envía"
              className="w-full bg-white border border-gray-300 rounded-lg px-3
                py-2.5 text-gray-700 text-sm focus:outline-none focus:border-violet-400" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Descripción
            </label>
            <input {...register('descripcion')}
              placeholder="Ej: Caja mediana, sobre blanco..."
              className="w-full bg-white border border-gray-300 rounded-lg px-3
                py-2.5 text-gray-700 text-sm focus:outline-none focus:border-violet-400" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-600
                rounded-lg text-sm hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700
                text-white rounded-lg text-sm font-semibold disabled:opacity-60
                transition-colors">
              {loading ? 'Guardando...' : 'Registrar Paquete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Página principal ──────────────────────────────────────────
const PackagesPage = () => {
  const [paquetes, setPaquetes]         = useState([]);
  const [total, setTotal]               = useState(0);
  const [resumen, setResumen]           = useState({});
  const [loading, setLoading]           = useState(false);
  const [modal, setModal]               = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [accionando, setAccionando]     = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroEstado) params.status = filtroEstado;
      const res = await getPackages(params);
      setPaquetes(res.data?.packages || []);
      setTotal(res.data?.total || 0);
      setResumen(res.data?.resumen || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [filtroEstado]);

  const handleEntregar = async (id) => {
    if (!confirm('¿Marcar este paquete como entregado?')) return;
    setAccionando(id);
    try { await deliverPackage(id); cargar(); }
    catch { alert('Error al actualizar'); }
    finally { setAccionando(null); }
  };

  const handleDevolver = async (id) => {
    if (!confirm('¿Marcar este paquete como devuelto?')) return;
    setAccionando(id);
    try { await returnPackage(id); cargar(); }
    catch { alert('Error al actualizar'); }
    finally { setAccionando(null); }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      {/* Encabezado */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-1">HomeAccess › Paquetes</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Paquetes</h1>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600
              hover:bg-violet-700 text-white rounded-lg text-sm font-semibold
              transition-colors shadow-sm">
            <Plus size={16} /> + Registrar paquete
          </button>
        </div>
      </div>

      {/* Stats — igual que admin */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { k: 'en_porteria', label: 'En portería', dot: 'bg-yellow-400' },
          { k: 'entregado',   label: 'Entregado',   dot: 'bg-green-500' },
          { k: 'devuelto',    label: 'Devuelto',    dot: 'bg-gray-400' },
          { k: 'perdido',     label: 'Perdido',     dot: 'bg-red-500' },
        ].map(({ k, label, dot }) => (
          <div key={k} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className={`w-3 h-3 rounded-full ${dot} mb-2`} />
            <p className="text-3xl font-bold text-gray-900">{resumen[k] || 0}</p>
            <p className="text-gray-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabla — igual que admin */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        {/* Barra superior tabla */}
        <div className="flex items-center justify-between px-5 py-3
          border-b border-gray-100">
          <p className="text-gray-600 text-sm font-medium">
            {total} paquete{total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            {[
              { value: '',            label: 'Todos' },
              { value: 'en_porteria', label: 'En portería' },
              { value: 'entregado',   label: 'Entregado' },
              { value: 'devuelto',    label: 'Devuelto' },
              { value: 'perdido',     label: 'Perdido' },
            ].map(opt => (
              <button key={opt.value} onClick={() => setFiltroEstado(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium
                  transition-colors border
                  ${filtroEstado === opt.value
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                {opt.label}
              </button>
            ))}
            <button onClick={cargar}
              className="p-1.5 text-gray-400 hover:text-gray-600">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Encabezados columnas */}
        <div className="grid grid-cols-5 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
          {['Tipo', 'Guía / Remitente', 'Destinatario', 'Recibido', 'Estado'].map(h => (
            <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {h}
            </p>
          ))}
        </div>

        {/* Filas */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : paquetes.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No se encontraron paquetes</p>
          </div>
        ) : paquetes.map((p, idx) => {
          const estadoCfg = ESTADO_CFG[p.estado] || ESTADO_CFG.en_porteria;
          return (
            <div key={p._id}
              className={`grid grid-cols-5 px-5 py-4 items-center
                hover:bg-gray-50 transition-colors
                ${idx < paquetes.length - 1 ? 'border-b border-gray-100' : ''}`}>

              {/* Tipo */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center
                  justify-center text-lg shrink-0">
                  {TIPO_ICONS[p.tipo] || '📦'}
                </div>
                <div>
                  <p className="text-gray-800 text-sm font-medium capitalize">{p.tipo}</p>
                  {p.transportadora && (
                    <p className="text-gray-400 text-xs">{p.transportadora}</p>
                  )}
                </div>
              </div>

              {/* Guía / Remitente */}
              <div>
                {p.guia && (
                  <p className="text-gray-700 text-sm font-medium">{p.guia}</p>
                )}
                {p.remitente && (
                  <p className="text-gray-400 text-xs">De: {p.remitente}</p>
                )}
                {!p.guia && !p.remitente && (
                  <p className="text-gray-300 text-sm">—</p>
                )}
              </div>

              {/* Destinatario */}
              <div>
                {p.destinatario_id ? (
                  <>
                    <p className="text-gray-700 text-sm font-medium">
                      {p.destinatario_id.nombres} {p.destinatario_id.apellidos}
                    </p>
                    {p.unit_destino && (
                      <p className="text-gray-400 text-xs">
                        Apto {p.unit_destino.numero}
                        {p.unit_destino.torre ? ` · Torre ${p.unit_destino.torre}` : ''}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-300 text-sm">—</p>
                )}
              </div>

              {/* Recibido */}
              <div>
                <p className="text-gray-600 text-sm">
                  {new Date(p.fecha_recepcion).toLocaleDateString('es-CO', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>

              {/* Estado + acciones */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold
                  px-2.5 py-1 rounded-full ${estadoCfg.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dot}`} />
                  {estadoCfg.label}
                </span>
                {p.estado === 'en_porteria' && (
                  <div className="flex gap-1 ml-1">
                    <button onClick={() => handleEntregar(p._id)}
                      disabled={accionando === p._id}
                      title="Entregar"
                      className="w-7 h-7 bg-green-50 hover:bg-green-100 text-green-600
                        rounded-lg flex items-center justify-center text-sm
                        transition-colors disabled:opacity-50">
                      ✓
                    </button>
                    <button onClick={() => handleDevolver(p._id)}
                      disabled={accionando === p._id}
                      title="Devolver"
                      className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-500
                        rounded-lg flex items-center justify-center text-sm
                        transition-colors disabled:opacity-50">
                      ↩
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <ModalNuevoPaquete
          onClose={() => setModal(false)}
          onSuccess={() => { setModal(false); cargar(); }}
        />
      )}
    </div>
  );
};

export default PackagesPage;