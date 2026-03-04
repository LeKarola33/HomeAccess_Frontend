/**
 * commonAreaUtils.jsx
 * Constantes, helpers visuales y componentes UI pequeños
 * compartidos dentro del módulo de Áreas Comunes.
 */

// ─── Mapas de etiquetas y colores ─────────────────────────────────────────────

export const AREA_TYPE_LABELS = {
  salon_eventos: 'Salón de Eventos',
  piscina:       'Piscina',
  bbq:           'BBQ / Parrilla',
  cancha:        'Cancha Deportiva',
  gimnasio:      'Gimnasio',
  parque:        'Parque / Jardín',
  otro:          'Otro',
};

export const AREA_TYPE_ICONS = {
  salon_eventos: '🎉',
  piscina:       '🏊',
  bbq:           '🔥',
  cancha:        '⚽',
  gimnasio:      '🏋️',
  parque:        '🌳',
  otro:          '📍',
};

export const AREA_STATUS_CONFIG = {
  activa:         { label: 'Activa',          bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  sin_servicio:   { label: 'Sin servicio',    bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
  mantenimiento:  { label: 'Mantenimiento',   bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'     },
};

export const BOOKING_STATUS_CONFIG = {
  pendiente:  { label: 'Pendiente',  bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'  },
  aprobada:   { label: 'Aprobada',   bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200'},
  rechazada:  { label: 'Rechazada',  bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200'    },
  cancelada:  { label: 'Cancelada',  bg: 'bg-slate-50',   text: 'text-slate-500',   border: 'border-slate-200'  },
};

// ─── Componentes pequeños ─────────────────────────────────────────────────────

/** Badge de estado del área */
export const AreaStatusBadge = ({ status }) => {
  const cfg = AREA_STATUS_CONFIG[status] || AREA_STATUS_CONFIG.activa;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

/** Badge de estado de reserva */
export const BookingStatusBadge = ({ status }) => {
  const cfg = BOOKING_STATUS_CONFIG[status] || BOOKING_STATUS_CONFIG.pendiente;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
};

/** Spinner de carga */
export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin`} />
  );
};

/** Toast de notificación */
export const Toast = ({ message, type = 'success', onClose }) => {
  const styles = {
    success: 'bg-emerald-600',
    error:   'bg-red-600',
    info:    'bg-indigo-600',
  };
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm shadow-2xl ${styles[type]} animate-fade-in`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">✕</button>
    </div>
  );
};

/** Modal contenedor genérico */
export const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative z-50 bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">✕</button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

/** Botón primario */
export const PrimaryButton = ({ children, onClick, disabled, type = 'button', className = '' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 ${className}`}
  >
    {children}
  </button>
);

/** Botón secundario */
export const SecondaryButton = ({ children, onClick, disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 disabled:opacity-50 transition-colors ${className}`}
  >
    {children}
  </button>
);

/** Botón de peligro */
export const DangerButton = ({ children, onClick, disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2.5 bg-red-50 text-red-700 text-sm font-medium rounded-xl hover:bg-red-100 border border-red-200 disabled:opacity-50 transition-colors ${className}`}
  >
    {children}
  </button>
);

/** Campo de formulario */
export const FormField = ({ label, required, error, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

/** Input base */
export const Input = ({ error, ...props }) => (
  <input
    {...props}
    className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors outline-none
      ${error ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'}
    `}
  />
);

/** Select base */
export const Select = ({ error, children, ...props }) => (
  <select
    {...props}
    className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors outline-none bg-white
      ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'}
    `}
  >
    {children}
  </select>
);

/** Textarea base */
export const Textarea = ({ error, ...props }) => (
  <textarea
    {...props}
    rows={3}
    className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-colors outline-none resize-none
      ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'}
    `}
  />
);

/** Estado vacío */
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
    <p className="text-sm text-slate-400 mb-6 max-w-xs">{description}</p>
    {action}
  </div>
);

/** Formatea fecha ISO a fecha legible */
export const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
};

/** Formatea hora */
export const formatTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};
