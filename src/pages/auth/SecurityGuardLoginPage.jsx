/**
 * src/pages/auth/SecurityGuardLoginPage.jsx
 * Ruta: /securityguard/login
 * Rol unificado: portero (antes securityguard/vigilante)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { loginUser, forgotPassword } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import logo from '@/img/logo.jpeg';

const ALLOWED_ROLES = ['portero', 'admin'];

const ForgotPasswordView = ({ onBack }) => {
  const [emailSent, setEmailSent]     = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors }, getValues } = useForm();

  const onSubmit = async ({ email }) => {
    setServerError('');
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setEmailSent(true);
    } catch (error) {
      setServerError(error.response?.data?.message || 'No se pudo enviar el correo. Verifique el email e intente de nuevo.');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="w-full max-w-sm">
      <button type="button" onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-8">
        <ArrowLeft size={13} />Volver al acceso de portería
      </button>
      {!emailSent ? (
        <>
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)' }}>
              <Mail size={22} style={{ color: '#2dd4bf' }} />
            </div>
            <h1 className="text-3xl font-black text-white">¿Olvidaste tu contraseña?</h1>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Ingresa tu correo de portero y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>
          {serverError && (
            <div className="rounded-xl border px-4 py-3 mb-5 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#64748b' }}>
                Correo electrónico
              </label>
              <input type="email" autoComplete="email" placeholder="portero@conjunto.co"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: errors.email ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)', '--tw-ring-color': '#14b8a6' }}
                {...register('email', { required: 'El email es requerido', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' } })} />
              {errors.email && <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors.email.message}</p>}
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: isLoading ? '#0f766e' : 'linear-gradient(135deg, #14b8a6, #0891b2)' }}>
              {isLoading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</>) : (<><Mail size={16} />Enviar enlace de recuperación</>)}
            </button>
          </form>
          <p className="text-center text-xs mt-6" style={{ color: '#334155' }}>
            Si no recibes el correo, revisa la carpeta de spam o contacta al administrador.
          </p>
        </>
      ) : (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)' }}>
            <CheckCircle size={28} style={{ color: '#34d399' }} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">¡Correo enviado!</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-1">Hemos enviado un enlace de recuperación a:</p>
          <p className="text-sm font-bold mb-6 px-3 py-1.5 rounded-lg inline-block"
            style={{ color: '#2dd4bf', background: 'rgba(20,184,166,0.1)' }}>{getValues('email')}</p>
          <p className="text-slate-500 text-xs leading-relaxed mb-6">
            El enlace expirará en 30 minutos. Si no recibiste el correo, revisa la carpeta de spam.
          </p>
          <button type="button" onClick={onBack}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
            <ArrowLeft size={16} />Volver al inicio de sesión
          </button>
        </div>
      )}
    </div>
  );
};

const SecurityGuardLoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError,  setServerError]  = useState('');
  const [roleBlocked,  setRoleBlocked]  = useState(false);
  const [showForgot,   setShowForgot]   = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ email, password }) => {
    setServerError(''); setRoleBlocked(false);
    try {
      const result = await loginUser(email, password);
      const { user, accessToken, refreshToken } = result.data;
      if (!ALLOWED_ROLES.includes(user.role)) { setRoleBlocked(true); return; }
      setAuth(user, accessToken, refreshToken);
      navigate('/securityguard/access-logs', { replace: true });
    } catch (error) {
      setServerError(error.response?.data?.message || 'Credenciales incorrectas. Intente de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Syne', sans-serif", background: '#0a0f1e' }}>

      {/* Panel izquierdo */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #052020 0%, #061a20 50%, #0a0f1e 100%)' }}>
        <div className="absolute inset-0 overflow-hidden">
          {[200, 320, 440, 560].map((size, i) => (
            <div key={i} className="absolute rounded-full border border-white/5"
              style={{ width: size, height: size, top: '50%', left: '45%', transform: 'translate(-50%,-50%)' }} />
          ))}
          <div className="absolute top-1/3 left-1/2 w-48 h-48 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)' }} />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #14b8a6, #0891b2)' }}>
            <img src={logo} alt="HomeAccess Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-white font-black text-xl tracking-tight">HomeAccess</span>
            <div className="text-xs font-bold tracking-widest uppercase" style={{ color: '#14b8a6' }}>Portal Portería</div>
          </div>
        </div>

        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold"
            style={{ borderColor: 'rgba(20,184,166,0.3)', color: '#5eead4', background: 'rgba(20,184,166,0.1)' }}>
            🛡️ Acceso restringido · Solo personal autorizado
          </div>
          <h2 className="text-4xl font-black text-white leading-tight">
            Centro de<br /><span style={{ color: '#2dd4bf' }}>Control Portería</span>
          </h2>
          <p className="text-slate-400 leading-relaxed max-w-xs">
            Registra entradas y salidas de visitantes, gestiona paquetes y monitorea el parqueadero y las áreas comunes desde un solo lugar.
          </p>
          <div className="space-y-2 pt-2">
            {[
              { role: 'Portero', desc: 'Acceso completo al portal de portería', color: '#2dd4bf' },
              { role: 'Admin',   desc: 'Acceso completo al sistema',            color: '#818cf8' },
            ].map(({ role, desc, color }) => (
              <div key={role} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-sm font-semibold" style={{ color }}>{role}</span>
                <span className="text-xs text-slate-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-slate-600">
          <Shield size={13} /><span>Cumple Ley 1581 · Datos protegidos · Colombia 2026</span>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {showForgot ? (
          <ForgotPasswordView onBack={() => setShowForgot(false)} />
        ) : (
          <>
            <div className="w-full max-w-sm mb-6">
              <Link to="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                <ArrowLeft size={13} />Acceso panel administrativo
              </Link>
            </div>
            <div className="w-full max-w-sm">
              <div className="flex items-center gap-3 mb-8 lg:hidden">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #14b8a6, #0891b2)' }}>
                  <Shield size={20} className="text-white" />
                </div>
                <div>
                  <span className="text-white font-black text-lg">HomeAccess</span>
                  <div className="text-xs font-bold tracking-widest uppercase" style={{ color: '#14b8a6' }}>Portería</div>
                </div>
              </div>
              <div className="mb-8">
                <h1 className="text-3xl font-black text-white">Acceso Portería</h1>
                <p className="text-slate-500 mt-1 text-sm">Ingresa tus credenciales de portero</p>
              </div>
              {roleBlocked && (
                <div className="rounded-xl border px-4 py-3 mb-5 text-sm"
                  style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                  <p className="font-bold mb-0.5">⛔ Acceso denegado</p>
                  <p className="text-xs opacity-80">Esta cuenta no tiene permisos de portería. Contacta al administrador.</p>
                </div>
              )}
              {serverError && !roleBlocked && (
                <div className="rounded-xl border px-4 py-3 mb-5 text-sm"
                  style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                  {serverError}
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#64748b' }}>
                    Correo electrónico
                  </label>
                  <input type="email" autoComplete="username" placeholder="portero@conjunto.co"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: errors.email ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)', '--tw-ring-color': '#14b8a6' }}
                    {...register('email', { required: 'El email es requerido', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' } })} />
                  {errors.email && <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors.email.message}</p>}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>Contraseña</label>
                    <button type="button" onClick={() => setShowForgot(true)}
                      className="text-xs font-semibold transition-colors hover:text-teal-300" style={{ color: '#14b8a6' }}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
                      className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: errors.password ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)', '--tw-ring-color': '#14b8a6' }}
                      {...register('password', { required: 'La contraseña es requerida' })} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#64748b' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs" style={{ color: '#f87171' }}>{errors.password.message}</p>}
                </div>
                <button type="submit" disabled={isSubmitting}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: isSubmitting ? '#0f766e' : 'linear-gradient(135deg, #14b8a6, #0891b2)' }}>
                  {isSubmitting ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verificando...</>) : (<><Shield size={16} />Ingresar al Portal</>)}
                </button>
              </form>
              <p className="text-center text-xs mt-8" style={{ color: '#334155' }}>
                Acceso restringido · Solo personal autorizado de portería
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SecurityGuardLoginPage;