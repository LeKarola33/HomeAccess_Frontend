/**
 * src/pages/securityguard/AccessLogsPage.jsx
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { RefreshCw, X, Plus } from 'lucide-react';
import { getAccessLogs, registerEntry, registerExit, getUnits } from '@/api/securityguard.api';

const ACCESO_CFG = {
  entrada: { label: 'entrada', cls: 'bg-green-100 text-green-700 border border-green-200' },
  salida:  { label: 'salida',  cls: 'bg-red-100 text-red-700 border border-red-200' },
};

const TIPO_PERSONA_LABEL = {
  residente: 'Residente', visitante: 'Visitante',
  proveedor: 'Proveedor', empleado: 'Empleado', delivery: 'Delivery',
};

// ── Modal único igual al admin ────────────────────────────────
const ModalAcceso = ({ onClose, onSuccess }) => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading]   = useState(false);
  const {
    register, handleSubmit, watch, formState: { errors },
  } = useForm({
    defaultValues: {
      tipo_persona: '',
      tipo_acceso:  'entrada',
      porteria:     '',
    },
  });

  const tipoAcceso = watch('tipo_acceso');

  useEffect(() => {
    getUnits().then(r => setUnidades(r.data?.units || []));
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (data.tipo_acceso === 'entrada') await registerEntry(data);
      else                                await registerExit(data);
      onSuccess();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-gray-900 font-semibold text-lg">Registrar Acceso</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">

          {/* Tipo de Persona */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Persona
            </label>
            <select
              {...register('tipo_persona', { required: 'Seleccione el tipo de persona' })}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5
                text-gray-700 text-sm focus:outline-none focus:border-blue-400">
              <option value="">Seleccionar...</option>
              <option value="visitante">Visitante</option>
              <option value="residente">Residente</option>
              <option value="proveedor">Proveedor</option>
              <option value="empleado">Empleado</option>
              <option value="delivery">Delivery</option>
            </select>
            {errors.tipo_persona && (
              <p className="text-red-500 text-xs mt-1">{errors.tipo_persona.message}</p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              {...register('nombre_visitante', { required: 'El nombre es requerido' })}
              placeholder="Nombre completo del visitante"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5
                text-gray-700 text-sm focus:outline-none focus:border-blue-400" />
            {errors.nombre_visitante && (
              <p className="text-red-500 text-xs mt-1">{errors.nombre_visitante.message}</p>
            )}
          </div>

          {/* Apartamento destino */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apartamento destino
            </label>
            <select
              {...register('unit_destino')}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5
                text-gray-700 text-sm focus:outline-none focus:border-blue-400">
              <option value="">-- Seleccionar apartamento --</option>
              {unidades.map(u => (
                <option key={u._id} value={u._id}>
                  {u.torre ? `Torre ${u.torre} - ` : ''}Apto {u.numero}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Acceso — radio igual que admin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Acceso
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer
                transition-colors
                ${tipoAcceso === 'entrada'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" value="entrada"
                  {...register('tipo_acceso')}
                  className="accent-blue-600" />
                <span className="text-sm font-medium text-gray-700">Entrada</span>
              </label>
              <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer
                transition-colors
                ${tipoAcceso === 'salida'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" value="salida"
                  {...register('tipo_acceso')}
                  className="accent-blue-600" />
                <span className="text-sm font-medium text-gray-700">Salida</span>
              </label>
            </div>
          </div>

          {/* Portería */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Portería
            </label>
            <select
              {...register('porteria', { required: 'Seleccione la portería' })}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5
                text-gray-700 text-sm focus:outline-none focus:border-blue-400">
              <option value="">Seleccionar portería...</option>
              <option value="Principal">Principal</option>
              <option value="Parqueadero">Parqueadero</option>
              <option value="Peatonal">Peatonal</option>
            </select>
            {errors.porteria && (
              <p className="text-red-500 text-xs mt-1">{errors.porteria.message}</p>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              {...register('observaciones')}
              rows={3}
              placeholder="Notas adicionales..."
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5
                text-gray-700 text-sm focus:outline-none focus:border-blue-400 resize-none" />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-600
                rounded-lg text-sm hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white
                rounded-lg text-sm font-semibold disabled:opacity-60 transition-colors">
              {loading ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Página principal ──────────────────────────────────────────
const AccessLogsPage = () => {
  const [logs, setLogs]             = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const [modal, setModal]           = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroTipo)  params.type = filtroTipo;
      if (filtroFecha) params.date = filtroFecha;
      const res = await getAccessLogs(params);
      setLogs(res.data?.logs || []);
      setTotal(res.data?.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [filtroTipo, filtroFecha]);

  const getNombre = (log) => {
    if (log.persona_id) return `${log.persona_id.nombres} ${log.persona_id.apellidos}`;
    if (log.nombre_visitante) return log.nombre_visitante;
    return '—';
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      {/* Encabezado */}
      <div className="mb-5">
        <p className="text-xs text-gray-400 mb-1">HomeAccess › Panel</p>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Control de Acceso</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Registro de ingresos y salidas del conjunto
            </p>
          </div>
          <button onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600
              hover:bg-blue-700 text-white rounded-lg text-sm font-semibold
              transition-colors shadow-sm">
            <Plus size={16} /> Registrar Acceso
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="bg-white border border-gray-300 text-gray-600 text-sm
            rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
          <option value="">Todos los tipos</option>
          <option value="entrada">Solo entradas</option>
          <option value="salida">Solo salidas</option>
        </select>
        <input type="date" value={filtroFecha}
          onChange={e => setFiltroFecha(e.target.value)}
          className="bg-white border border-gray-300 text-gray-600 text-sm
            rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
        <button onClick={cargar}
          className="p-2 bg-white border border-gray-300 rounded-lg
            text-gray-500 hover:bg-gray-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-5 px-6 py-3 border-b border-gray-100 bg-gray-50">
          {['Persona', 'Tipo', 'Acceso', 'Portería', 'Fecha y Hora'].map(h => (
            <p key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {h}
            </p>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-300 text-4xl mb-3">🚪</p>
            <p className="text-gray-400 text-sm">No hay registros de acceso</p>
          </div>
        ) : logs.map((log, idx) => {
          const accesoCfg = ACCESO_CFG[log.tipo_acceso] || ACCESO_CFG.entrada;
          return (
            <div key={log._id}
              className={`grid grid-cols-5 px-6 py-4 items-center hover:bg-gray-50
                transition-colors
                ${idx < logs.length - 1 ? 'border-b border-gray-100' : ''}`}>

              <div>
                <p className="text-gray-800 text-sm font-medium">{getNombre(log)}</p>
                {log.unit_destino && (
                  <p className="text-gray-400 text-xs">
                    Apto {log.unit_destino.numero}
                    {log.unit_destino.torre ? ` · Torre ${log.unit_destino.torre}` : ''}
                  </p>
                )}
              </div>

              <p className="text-gray-500 text-sm">
                {TIPO_PERSONA_LABEL[log.tipo_persona] || log.tipo_persona}
              </p>

              <div>
                <span className={`inline-flex items-center text-xs font-semibold
                  px-2.5 py-1 rounded-full ${accesoCfg.cls}`}>
                  {accesoCfg.label}
                </span>
              </div>

              <p className="text-gray-500 text-sm">{log.porteria}</p>

              <p className="text-gray-500 text-sm">
                {new Date(log.timestamp).toLocaleDateString('es-CO', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })}
                {' '}
                {new Date(log.timestamp).toLocaleTimeString('es-CO', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          );
        })}
      </div>

      {modal && (
        <ModalAcceso
          onClose={() => setModal(false)}
          onSuccess={() => { setModal(false); cargar(); }}
        />
      )}
    </div>
  );
};

export default AccessLogsPage;