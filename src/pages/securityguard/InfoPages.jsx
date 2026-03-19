/**
 * src/pages/securityguard/InfoPages.jsx
 */

import { useState, useEffect } from 'react';
import {
  Home, Building2, Car, Calendar,
  Search, RefreshCw, CheckCircle, XCircle,
} from 'lucide-react';
import { getUnits, getCommonAreas, getParking, getParkingSpots, getEvents } from '@/api/securityguard.api';

// ── Utilidades ─────────────────────────────────────────────────

const Pagina = ({ children }) => (
  <div className="p-6 min-h-screen bg-gray-50">{children}</div>
);

const Encabezado = ({ icon: Icon, color = 'bg-blue-600', titulo, subtitulo }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <h1 className="text-2xl font-bold text-white">{titulo}</h1>
      {subtitulo && <p className="text-gray-500 text-sm mt-0.5">{subtitulo}</p>}
    </div>
  </div>
);

const Vacio = ({ icon: Icon, texto }) => (
  <div className="text-center py-20">
    <Icon size={48} className="text-gray-700 mx-auto mb-4" />
    <p className="text-gray-400 text-lg font-medium">{texto}</p>
  </div>
);

const TarjetaStat = ({ valor, etiqueta, color = 'text-white', borde = 'border-gray-800' }) => (
  <div className={`bg-gray-900 border ${borde} rounded-xl p-4 text-center`}>
    <p className={`text-3xl font-bold ${color}`}>{valor}</p>
    <p className="text-gray-400 text-sm mt-1">{etiqueta}</p>
  </div>
);

const TarjetaStatClara = ({ valor, etiqueta, colorValor = 'text-gray-900', borde = 'border-gray-200' }) => (
  <div className={`bg-white border ${borde} rounded-xl p-5 shadow-sm`}>
    <p className="text-gray-500 text-sm mb-1">{etiqueta}</p>
    <p className={`text-4xl font-bold ${colorValor}`}>{valor}</p>
  </div>
);

// ── UNIDADES ──────────────────────────────────────────────────

export const UnitsPage = () => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await getUnits(busqueda ? { search: busqueda } : {});
      setUnidades(res.data?.units || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  return (
    <Pagina>
      <Encabezado icon={Home} titulo="Unidades"
        subtitulo={`${unidades.length} unidades registradas`} />
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && cargar()}
            placeholder="Buscar por número de apartamento..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3
              py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <button onClick={cargar}
          className="p-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      {loading ? (
        <p className="text-center py-12 text-gray-500">Cargando...</p>
      ) : unidades.length === 0 ? (
        <Vacio icon={Home} texto="No se encontraron unidades" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {unidades.map(u => (
            <div key={u._id} className="bg-white border border-gray-200 rounded-xl p-4
              hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-blue-900 rounded-lg flex items-center justify-center">
                  <Home size={16} className="text-blue-300" />
                </div>
                <div>
                  <p className="text-white font-bold">Apto {u.numero}</p>
                  {u.torre && (
                    <p className="text-gray-500 text-xs">
                      Torre {u.torre}{u.piso ? ` · Piso ${u.piso}` : ''}
                    </p>
                  )}
                </div>
              </div>
              {u.propietario_actual ? (
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">
                    Propietario
                  </p>
                  <p className="text-white text-sm font-medium">
                    {u.propietario_actual.nombres} {u.propietario_actual.apellidos}
                  </p>
                  {u.propietario_actual.celular && (
                    <p className="text-blue-400 text-xs mt-1">{u.propietario_actual.celular}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">Sin propietario registrado</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Pagina>
  );
};

// ── ÁREAS COMUNES ─────────────────────────────────────────────

const ICONOS_AREA = {
  salon_social: '🎉', piscina: '🏊', gimnasio: '💪',
  cancha: '⚽', bbq: '🔥', parque: '🌳', otro: '🏛️',
};

export const CommonAreasPage = () => {
  const [areas, setAreas]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro]   = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await getCommonAreas(filtro !== '' ? { active: filtro } : {});
      setAreas(res.data?.areas || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [filtro]);

  const activas   = areas.filter(a => a.activa).length;
  const inactivas = areas.filter(a => !a.activa).length;

  return (
    <Pagina>
      <Encabezado icon={Building2} titulo="Áreas Comunes"
        subtitulo={`${activas} activas · ${inactivas} inactivas`}
        color="bg-purple-600" />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <TarjetaStat valor={areas.length} etiqueta="Total áreas" />
        <TarjetaStat valor={activas}   etiqueta="Activas"   color="text-green-400" borde="border-green-800" />
        <TarjetaStat valor={inactivas} etiqueta="Inactivas" color="text-red-400"   borde="border-red-800" />
      </div>
      <div className="flex gap-2 mb-5">
        {[
          { value: '',      label: 'Todas' },
          { value: 'true',  label: 'Activas' },
          { value: 'false', label: 'Inactivas' },
        ].map(opt => (
          <button key={opt.value} onClick={() => setFiltro(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${filtro === opt.value
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'}`}>
            {opt.label}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="text-center py-12 text-gray-500">Cargando...</p>
      ) : areas.length === 0 ? (
        <Vacio icon={Building2} texto="No hay áreas comunes registradas" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {areas.map(a => (
            <div key={a._id}
              className={`bg-gray-900 rounded-xl p-4 border transition-colors
                ${a.activa ? 'border-gray-800 hover:border-purple-700' : 'border-gray-800 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ICONOS_AREA[a.tipo] || '🏛️'}</span>
                  <div>
                    <p className="text-white font-semibold">{a.nombre}</p>
                    <p className="text-gray-500 text-xs capitalize">{a.tipo?.replace('_', ' ')}</p>
                  </div>
                </div>
                {a.activa
                  ? <CheckCircle size={18} className="text-green-400 shrink-0" />
                  : <XCircle    size={18} className="text-red-400 shrink-0" />}
              </div>
              {a.descripcion && <p className="text-gray-400 text-sm mb-3">{a.descripcion}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                {a.capacidad_maxima > 0 && <span>Máx. {a.capacidad_maxima} personas</span>}
                {a.horario_apertura && <span>{a.horario_apertura} – {a.horario_cierre}</span>}
                {a.requiere_reserva && <span className="text-yellow-500">Requiere reserva</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Pagina>
  );
};

// ── PARQUEADERO ───────────────────────────────────────────────

const TIPO_VEHICULO = {
  carro:     { icon: '🚗', label: 'Carro' },
  moto:      { icon: '🏍️', label: 'Moto' },
  bicicleta: { icon: '🚲', label: 'Bicicleta' },
  patineta:  { icon: '🛴', label: 'Patineta' },
  otro:      { icon: '🚙', label: 'Otro' },
};

export const ParkingPage = () => {
  const [vista, setVista]           = useState('vehiculos');
  const [data, setData]             = useState({ vehicles: [], resumen: {} });
  const [puestos, setPuestos]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroPuesto, setFiltroPuesto] = useState('todos');
  const [busqueda, setBusqueda]     = useState('');

  const cargarVehiculos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroTipo) params.tipo   = filtroTipo;
      if (busqueda)   params.search = busqueda;
      const res = await getParking(params);
      setData(res.data || {});
    } finally { setLoading(false); }
  };

  const cargarPuestos = async () => {
    setLoading(true);
    try {
      const res = await getParkingSpots();
      setPuestos(res.data?.puestos || []);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (vista === 'vehiculos') cargarVehiculos();
    else cargarPuestos();
  }, [vista, filtroTipo]);

  const { vehicles = [], resumen = {} } = data;

  const puestosFiltrados = filtroPuesto === 'todos'
    ? puestos
    : filtroPuesto === 'libres'
      ? puestos.filter(p => p.estado === 'desocupado')
      : filtroPuesto === 'ocupados'
        ? puestos.filter(p => p.estado === 'ocupado')
        : puestos.filter(p => p.estado === 'en_mantenimiento');

  const totalPuestos  = puestos.length;
  const ocupados      = puestos.filter(p => p.estado === 'ocupado').length;
  const disponibles   = puestos.filter(p => p.estado === 'desocupado').length;
  const mantenimiento = puestos.filter(p => p.estado === 'en_mantenimiento').length;

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      {/* Encabezado + tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-600 rounded-xl flex items-center justify-center">
            <Car size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parqueadero</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {vista === 'vehiculos'
                ? `${resumen.total || 0} vehículos registrados`
                : `${totalPuestos} puestos en total`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setVista('vehiculos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm
              font-medium transition-colors border
              ${vista === 'vehiculos'
                ? 'bg-gray-200 text-gray-900 border-gray-300'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
            🚗 Vehículos
          </button>
          <button onClick={() => setVista('mapa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm
              font-medium transition-colors border
              ${vista === 'mapa'
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
            🅿️ Mapa de puestos
          </button>
        </div>
      </div>

      {/* ── VISTA VEHÍCULOS ── */}
      {vista === 'vehiculos' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
            {[
              { k: 'total',      label: 'Total Vehículos', sub: 'Registrados en el sistema', icono: '🚘', bg: 'bg-blue-500' },
              { k: 'conPuesto',  label: 'Con Puesto',      sub: 'Puestos asignados',          icono: '🅿️', bg: 'bg-violet-500' },
              { k: 'sinPuesto',  label: 'Sin Puesto',      sub: 'Pendientes de asignación',   icono: '🔲', bg: 'bg-orange-400' },
              { k: 'motos',      label: 'Motos',           sub: 'Motocicletas registradas',   icono: '🏍️', bg: 'bg-green-500' },
              { k: 'carros',     label: 'Carros',          sub: 'Automóviles registrados',    icono: '🚗', bg: 'bg-sky-500' },
              { k: 'bicicletas', label: 'Bicicletas',      sub: 'Bicicletas registradas',     icono: '🚲', bg: 'bg-teal-500' },
            ].map(({ k, label, sub, icono, bg }) => (
              <div key={k} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 my-1">{resumen[k] || 0}</p>
                  <p className="text-gray-400 text-xs">{sub}</p>
                </div>
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center text-2xl shadow-md`}>
                  {icono}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mb-5 flex-wrap">
            <div className="flex gap-2">
              {[
                { value: '',          label: 'Todos',         activeClass: 'bg-gray-900 text-white border-gray-900' },
                { value: 'carro',     label: '🚗 Carros',     activeClass: 'bg-sky-500 text-white border-sky-500' },
                { value: 'moto',      label: '🏍️ Motos',      activeClass: 'bg-green-500 text-white border-green-500' },
                { value: 'bicicleta', label: '🚲 Bicicletas', activeClass: 'bg-teal-500 text-white border-teal-500' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setFiltroTipo(opt.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border
                    ${filtroTipo === opt.value
                      ? opt.activeClass
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && cargarVehiculos()}
                placeholder="Buscar placa..."
                className="bg-white border border-gray-300 rounded-lg pl-8 pr-3
                  py-2 text-gray-700 text-sm focus:outline-none focus:border-blue-400 w-44
                  placeholder-gray-400" />
            </div>
            <button onClick={cargarVehiculos}
              className="p-2 bg-white border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-gray-700 text-sm font-semibold">Vehículos registrados</h3>
            <span className="text-gray-400 text-xs">{vehicles.length} resultado(s)</span>
          </div>

          {loading ? (
            <p className="text-center py-12 text-gray-500">Cargando...</p>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
              <Car size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No se encontraron vehículos</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-5 px-5 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Placa</p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo</p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vehículo</p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Apartamento</p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Puesto</p>
              </div>
              {vehicles.map((v, idx) => {
                const cfg = TIPO_VEHICULO[v.tipo] || TIPO_VEHICULO.otro;
                return (
                  <div key={v._id}
                    className={`grid grid-cols-5 px-5 py-4 items-center hover:bg-gray-50
                      transition-colors ${idx < vehicles.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <p className="text-gray-900 font-mono font-semibold text-sm">
                      {v.placa || 'Sin placa'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cfg.icon}</span>
                      <span className="text-gray-600 text-sm">{cfg.label}</span>
                    </div>
                    <div>
                      <p className="text-gray-700 text-sm font-medium">
                        {[v.marca, v.modelo].filter(Boolean).join(' ') || '—'}
                      </p>
                      {(v.color || v.anio) && (
                        <p className="text-gray-400 text-xs">
                          {[v.color, v.anio].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <div>
                      {v.unit_id ? (
                        <>
                          <p className="text-gray-700 text-sm">Apto {v.unit_id.numero}</p>
                          {v.unit_id.torre && <p className="text-gray-400 text-xs">Torre {v.unit_id.torre}</p>}
                        </>
                      ) : <p className="text-gray-400 text-sm">—</p>}
                    </div>
                    <div>
                      {v.parqueadero_id ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold
                          px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                          📍 {v.parqueadero_id.numero}
                        </span>
                      ) : <span className="text-gray-400 text-sm">Sin puesto</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── VISTA MAPA DE PUESTOS ── */}
      {vista === 'mapa' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { valor: totalPuestos,  label: 'Total Puestos', sub: 'Capacidad del conjunto', icono: '🅿️', bg: 'bg-blue-500' },
              { valor: ocupados,      label: 'Ocupados',      sub: 'Con vehículo asignado',  icono: '🔴', bg: 'bg-red-500' },
              { valor: disponibles,   label: 'Disponibles',   sub: 'Libres para asignar',    icono: '🟢', bg: 'bg-green-500' },
              { valor: mantenimiento, label: 'Mantenimiento', sub: 'Fuera de servicio',       icono: '🔧', bg: 'bg-orange-400' },
            ].map(({ valor, label, sub, icono, bg }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 my-1">{valor}</p>
                  <p className="text-gray-400 text-xs">{sub}</p>
                </div>
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center text-2xl shadow-md`}>
                  {icono}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'todos',            label: 'Todos',       activeClass: 'bg-gray-900 text-white border-gray-900' },
                { value: 'libres',           label: '🟢 Libres',   activeClass: 'bg-green-500 text-white border-green-500' },
                { value: 'ocupados',         label: '🔴 Ocupados', activeClass: 'bg-red-500 text-white border-red-500' },
                { value: 'en_mantenimiento', label: '⚙️ Mantenim.', activeClass: 'bg-orange-400 text-white border-orange-400' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setFiltroPuesto(opt.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border
                    ${filtroPuesto === opt.value
                      ? opt.activeClass
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={cargarPuestos}
              className="p-2 bg-white border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading ? (
            <p className="text-center py-12 text-gray-500">Cargando...</p>
          ) : puestosFiltrados.length === 0 ? (
            <Vacio icon={Car} texto="No hay puestos de parqueadero registrados" />
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {puestosFiltrados.map(p => {
                const ocupado    = p.estado === 'ocupado';
                const mantenim   = p.estado === 'en_mantenimiento';
                const vehiculoAsig = p.vehiculos?.[0];
                return (
                  <div key={p._id}
                    className={`rounded-xl border p-3 text-center transition-colors
                      ${ocupado
                        ? 'bg-red-50 border-red-300'
                        : mantenim
                          ? 'bg-gray-100 border-gray-300'
                          : 'bg-green-50 border-green-300'}`}>
                    <div className={`w-3 h-3 rounded-full mx-auto mb-2
                      ${ocupado ? 'bg-red-400' : mantenim ? 'bg-gray-400' : 'bg-green-400'}`} />
                    <p className={`text-sm font-bold
                      ${ocupado ? 'text-red-300' : mantenim ? 'text-gray-400' : 'text-green-700'}`}>
                      {p.numero}
                    </p>
                    {ocupado && vehiculoAsig && (
                      <>
                        <p className="text-red-600 text-xs font-mono mt-1 truncate">
                          {vehiculoAsig.placa}
                        </p>
                        {vehiculoAsig.unit_id && (
                          <p className="text-gray-400 text-xs truncate">
                            Apto {vehiculoAsig.unit_id?.numero || ''}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── EVENTOS ───────────────────────────────────────────────────

const BORDE_TIPO = {
  obligatorio: 'border-l-red-500',
  opcional:    'border-l-pink-400',
};

const BADGE_TIPO = {
  obligatorio: { icon: '⚠️', label: 'Obligatorio', cls: 'bg-orange-100 text-orange-700 border border-orange-200' },
  opcional:    { icon: '🌸', label: 'Opcional',    cls: 'bg-pink-100 text-pink-700 border border-pink-200' },
};

const BADGE_ESTADO = {
  programado: { label: 'Programado', cls: 'bg-blue-100 text-blue-700 border border-blue-200' },
  en_curso:   { label: 'En curso',   cls: 'bg-green-100 text-green-700 border border-green-200' },
  finalizado: { label: 'Finalizado', cls: 'bg-gray-100 text-gray-600 border border-gray-200' },
  cancelado:  { label: 'Cancelado',  cls: 'bg-red-100 text-red-700 border border-red-200' },
};

export const EventsPage = () => {
  const [proximos, setProximos] = useState([]);
  const [pasados,  setPasados]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [filtro,   setFiltro]   = useState('todos');

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await getEvents();
      setProximos(res.data?.upcoming || []);
      setPasados(res.data?.past      || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const todos = [...proximos, ...pasados];
  const filtrados = filtro === 'todos'
    ? todos
    : filtro === 'obligatorio' || filtro === 'opcional'
      ? todos.filter(e => e.tipo === filtro)
      : todos.filter(e => e.estado === filtro);

  const TarjetaEvento = ({ e }) => {
    const badgeTipo   = BADGE_TIPO[e.tipo]     || BADGE_TIPO.opcional;
    const badgeEstado = BADGE_ESTADO[e.estado] || BADGE_ESTADO.programado;
    const borde       = BORDE_TIPO[e.tipo]     || 'border-l-gray-400';

    const formatFecha = (d) => new Date(d).toLocaleDateString('es-CO', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
    const formatHora = (d) => new Date(d).toLocaleTimeString('es-CO', {
      hour: '2-digit', minute: '2-digit',
    });

    return (
      <div className={`bg-white rounded-xl border border-gray-200 border-l-4
        ${borde} p-4 shadow-sm hover:shadow-md transition-shadow`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-gray-900 font-semibold text-base leading-tight">
            {e.titulo}
          </h3>
          <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
            <span className={`inline-flex items-center gap-1 text-xs font-medium
              px-2 py-0.5 rounded-full ${badgeTipo.cls}`}>
              <span style={{ fontSize: 11 }}>{badgeTipo.icon}</span>
              {badgeTipo.label}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeEstado.cls}`}>
              {badgeEstado.label}
            </span>
          </div>
        </div>
        {e.descripcion && (
          <p className="text-gray-500 text-sm mb-3 leading-relaxed">{e.descripcion}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          {e.fecha_inicio && (
            <span>
              📅 {formatFecha(e.fecha_inicio)} · {formatHora(e.fecha_inicio)}
              {e.fecha_fin && <> – {formatHora(e.fecha_fin)}</>}
            </span>
          )}
          {e.lugar && <span>📍 {e.lugar}</span>}
          {e.cupo_maximo > 0 && <span>👥 Cupo: {e.cupo_maximo} personas</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
          <Calendar size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{todos.length} evento(s)</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: 'todos',       label: 'Todos' },
          { value: 'obligatorio', label: '⚠️ Obligatorios' },
          { value: 'opcional',    label: '🌸 Opcionales' },
          { value: 'programado',  label: 'Programados' },
          { value: 'en_curso',    label: 'En curso' },
          { value: 'finalizado',  label: 'Finalizados' },
          { value: 'cancelado',   label: 'Cancelados' },
        ].map(opt => (
          <button key={opt.value} onClick={() => setFiltro(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border
              ${filtro === opt.value
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20">
          <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No hay eventos registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(e => <TarjetaEvento key={e._id} e={e} />)}
        </div>
      )}
    </div>
  );
};