/**
 * src/pages/auth/LoginPage.jsx
 *
 * Ruta: /login
 * Portal de Residentes y Propietarios
 * Mismo estilo visual que AdminLoginPage pero con identidad azul
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Home, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { forgotPassword } from '@/api/auth.api';
import { loginUser } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import logo from '@/img/logo.jpeg';

// Roles permitidos en el portal de residentes
const RESIDENT_ROLES = ['residente', 'propietario'];

// ── Vista: Recuperar contraseña ───────────────────────────────
const ForgotPasswordView = ({ onBack }) => {
  const [emailSent, setEmailSent]     = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm();

  const onSubmit = async ({ email }) => {
    setServerError('');
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setEmailSent(true);
    } catch (error) {
      setServerError(
        error.response?.data?.message ||
          'No se pudo enviar el correo. Verifique el email e intente de nuevo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <button
        type="button" onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500
          hover:text-slate-300 transition-colors mb-8"
      >
        <ArrowLeft size={13} />
        Volver al inicio de sesión
      </button>

      {!emailSent ? (
        <>
          <div className="mb-8">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
              }}
            >
              <Mail size={22} style={{ color: '#60a5fa' }} />
            </div>
            <h1 className="text-3xl font-black text-white">¿Olvidaste tu contraseña?</h1>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Ingresa tu correo registrado y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          {serverError && (
            <div
              className="rounded-xl border px-4 py-3 mb-5 text-sm"
              style={{
                background: 'rgba(239,68,68,0.08)',
                borderColor: 'rgba(239,68,68,0.3)',
                color: '#fca5a5',
              }}
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                style={{ color: '#64748b' }}
              >
                Correo electrónico
              </label>
              <input
                type="email" autoComplete="email"
                placeholder="residente@conjunto.co"
                className="w-full px-4 py-3 rounded-xl text-sm text-white
                  placeholder-slate-600 focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: errors.email
                    ? '1px solid rgba(239,68,68,0.5)'
                    : '1px solid rgba(255,255,255,0.1)',
                  '--tw-ring-color': '#3b82f6',
                }}
                {...register('email', {
                  required: 'El email es requerido',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs" style={{ color: '#f87171' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm
                transition-all mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: isLoading
                  ? '#1d4ed8'
                  : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white
                    rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <><Mail size={16} /> Enviar enlace de recuperación</>
              )}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: '#334155' }}>
            Si no recibes el correo, revisa la carpeta de spam o contacta a la administración.
          </p>
        </>
      ) : (
        <div className="text-center py-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{
              background: 'rgba(52,211,153,0.12)',
              border: '1px solid rgba(52,211,153,0.3)',
            }}
          >
            <CheckCircle size={28} style={{ color: '#34d399' }} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">¡Correo enviado!</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-1">
            Hemos enviado un enlace de recuperación a:
          </p>
          <p
            className="text-sm font-bold mb-6 px-3 py-1.5 rounded-lg inline-block"
            style={{ color: '#60a5fa', background: 'rgba(59,130,246,0.1)' }}
          >
            {getValues('email')}
          </p>
          <p className="text-slate-500 text-xs leading-relaxed mb-6">
            El enlace expirará en 30 minutos. Si no recibiste el correo, revisa la carpeta de spam.
          </p>
          <button
            type="button" onClick={onBack}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all
              flex items-center justify-center gap-2"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
            }}
          >
            <ArrowLeft size={16} />
            Volver al inicio de sesión
          </button>
        </div>
      )}
    </div>
  );
};

// ── Página principal de Login ─────────────────────────────────
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError,  setServerError]  = useState('');
  const [roleBlocked,  setRoleBlocked]  = useState(false);
  const [showForgot,   setShowForgot]   = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ email, password }) => {
    setServerError('');
    setRoleBlocked(false);
    try {
      const result = await loginUser(email, password);
      const { user, accessToken, refreshToken } = result.data;

      // Si intenta entrar con un rol de admin, redirigir al portal correcto
      if (!RESIDENT_ROLES.includes(user.role)) {
        setRoleBlocked(true);
        return;
      }

      setAuth(user, accessToken, refreshToken);
      navigate(from, { replace: true });
    } catch (error) {
      setServerError(
        error.response?.data?.message || 'Credenciales incorrectas. Intente de nuevo.'
      );
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'Syne', sans-serif", background: '#0a0f1e' }}
    >

      {/* ── Panel izquierdo decorativo ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-5/12 p-12
          relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0c1a3e 0%, #0d2b5e 50%, #0a0f1e 100%)',
        }}
      >
        {/* Círculos de fondo */}
        <div className="absolute inset-0 overflow-hidden">
          {[200, 320, 440, 560].map((size, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/5"
              style={{
                width: size, height: size,
                top: '50%', left: '45%',
                transform: 'translate(-50%,-50%)',
              }}
            />
          ))}
          <div
            className="absolute top-1/3 left-1/2 w-48 h-48 rounded-full
              -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
          >
            <img src={logo} alt="HomeAccess Logo"
              className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-white font-black text-xl tracking-tight">HomeAccess</span>
            <div
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: '#3b82f6' }}
            >
              Portal Residentes
            </div>
          </div>
        </div>

        {/* Copy central */}
        <div className="relative space-y-5">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
              border text-xs font-bold"
            style={{
              borderColor: 'rgba(59,130,246,0.3)',
              color: '#93c5fd',
              background: 'rgba(59,130,246,0.1)',
            }}
          >
            🏠 Portal exclusivo para residentes y propietarios
          </div>

          <h2 className="text-4xl font-black text-white leading-tight">
            Tu hogar,
            <br />
            <span style={{ color: '#60a5fa' }}>bajo control</span>
          </h2>

          <p className="text-slate-400 leading-relaxed max-w-xs">
            Consulta paquetes, reserva áreas comunes, revisa eventos del conjunto
            y mantente al día con tu comunidad.
          </p>

          {/* Beneficios */}
          <div className="space-y-2 pt-2">
            {[
              { icon: '📦', label: 'Paquetes',      desc: 'Consulta tus entregas en portería',  color: '#60a5fa' },
              { icon: '🏊', label: 'Áreas comunes', desc: 'Reserva salones, piscina y más',      color: '#34d399' },
              { icon: '📅', label: 'Eventos',       desc: 'Mantente informado del conjunto',     color: '#fbbf24' },
            ].map(({ icon, label, desc, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span className="text-sm font-semibold" style={{ color }}>{label}</span>
                <span className="text-xs text-slate-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative flex items-center gap-2 text-xs text-slate-600">
          <Home size={13} />
          <span>Cumple Ley 1581 · Datos protegidos · Colombia 2026</span>
        </div>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">

        {showForgot ? (
          <ForgotPasswordView onBack={() => setShowForgot(false)} />
        ) : (
          <>
            {/* Link al admin */}
            <div className="w-full max-w-sm mb-6">
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500
                  hover:text-slate-300 transition-colors"
              >
                <ArrowLeft size={13} />
                Acceso para administradores
              </Link>
            </div>

            <div className="w-full max-w-sm">

              {/* Logo mobile */}
              <div className="flex items-center gap-3 mb-8 lg:hidden">
                <div
                  className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                >
                  <img src={logo} alt="HomeAccess Logo"
                    className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-white font-black text-lg">HomeAccess</span>
                  <div
                    className="text-xs font-bold tracking-widest uppercase"
                    style={{ color: '#3b82f6' }}
                  >
                    Portal Residentes
                  </div>
                </div>
              </div>

              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-3xl font-black text-white">Bienvenido</h1>
                <p className="text-slate-500 mt-1 text-sm">
                  Ingresa tus credenciales para acceder a tu portal
                </p>
              </div>

              {/* Error rol bloqueado */}
              {roleBlocked && (
                <div
                  className="rounded-xl border px-4 py-3 mb-5 text-sm"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    borderColor: 'rgba(239,68,68,0.3)',
                    color: '#fca5a5',
                  }}
                >
                  <p className="font-bold mb-0.5">⛔ Acceso denegado</p>
                  <p className="text-xs opacity-80">
                    Esta cuenta es de administrador. Usa{' '}
                    <Link to="/admin/login" className="underline hover:text-white">
                      /admin/login
                    </Link>{' '}
                    para acceder.
                  </p>
                </div>
              )}

              {/* Error servidor */}
              {serverError && !roleBlocked && (
                <div
                  className="rounded-xl border px-4 py-3 mb-5 text-sm"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    borderColor: 'rgba(239,68,68,0.3)',
                    color: '#fca5a5',
                  }}
                >
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Email */}
                <div>
                  <label
                    className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                    style={{ color: '#64748b' }}
                  >
                    Correo electrónico
                  </label>
                  <input
                    type="email" autoComplete="username"
                    placeholder="residente@conjunto.co"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white
                      placeholder-slate-600 focus:outline-none focus:ring-2 transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: errors.email
                        ? '1px solid rgba(239,68,68,0.5)'
                        : '1px solid rgba(255,255,255,0.1)',
                      '--tw-ring-color': '#3b82f6',
                    }}
                    {...register('email', {
                      required: 'El email es requerido',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' },
                    })}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs" style={{ color: '#f87171' }}>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Contraseña */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className="block text-xs font-bold uppercase tracking-widest"
                      style={{ color: '#64748b' }}
                    >
                      Contraseña
                    </label>
                    <button
                      type="button" onClick={() => setShowForgot(true)}
                      className="text-xs font-semibold transition-colors hover:text-blue-300"
                      style={{ color: '#3b82f6' }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white
                        placeholder-slate-600 focus:outline-none focus:ring-2 transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: errors.password
                          ? '1px solid rgba(239,68,68,0.5)'
                          : '1px solid rgba(255,255,255,0.1)',
                        '--tw-ring-color': '#3b82f6',
                      }}
                      {...register('password', { required: 'La contraseña es requerida' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: '#64748b' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs" style={{ color: '#f87171' }}>
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Botón */}
                <button
                  type="submit" disabled={isSubmitting}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm
                    transition-all mt-2 disabled:opacity-60 flex items-center
                    justify-center gap-2"
                  style={{
                    background: isSubmitting
                      ? '#1d4ed8'
                      : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white
                        rounded-full animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <><Home size={16} /> Ingresar al Portal</>
                  )}
                </button>
              </form>

              <p className="text-center text-xs mt-8" style={{ color: '#334155' }}>
                Portal exclusivo · Residentes y propietarios del conjunto
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;