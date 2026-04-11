/**
 * src/pages/auth/ResetPasswordPage.jsx
 * Ruta: /reset-password?token=xxx
 * Funciona para todos los roles (admin, residente, portero)
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';
import { resetPassword } from '@/api/auth.api';

const ResetPasswordPage = () => {
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm,  setShowConfirm]    = useState(false);
  const [success,      setSuccess]        = useState(false);
  const [serverError,  setServerError]    = useState('');
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const token          = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ password }) => {
    setServerError('');
    if (!token) {
      setServerError('Token inválido. Solicita un nuevo enlace de recuperación.');
      return;
    }
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (error) {
      setServerError(
        error.response?.data?.message ||
          'El enlace expiró o es inválido. Solicita uno nuevo.'
      );
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#0a0f1e', fontFamily: "'Syne', sans-serif" }}
    >
      <div className="w-full max-w-sm">

        {success ? (
          /* ── Estado: contraseña actualizada ── */
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{
                background: 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.3)',
              }}
            >
              <CheckCircle size={28} style={{ color: '#34d399' }} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              ¡Contraseña actualizada!
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Tu contraseña ha sido restablecida correctamente.
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="w-full py-3 rounded-xl text-white font-bold text-sm
                  text-center transition-all flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                }}
              >
                Ir al portal de residentes
              </Link>
              <Link
                to="/admin/login"
                className="w-full py-3 rounded-xl font-bold text-sm text-center
                  transition-all flex items-center justify-center gap-2"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                }}
              >
                Ir al panel admin
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: 'rgba(59,130,246,0.15)',
                  border: '1px solid rgba(59,130,246,0.3)',
                }}
              >
                <KeyRound size={22} style={{ color: '#60a5fa' }} />
              </div>
              <h1 className="text-3xl font-black text-white">Nueva contraseña</h1>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres,
                una mayúscula, una minúscula y un número.
              </p>
            </div>

            {/* Error token inválido */}
            {!token && (
              <div
                className="rounded-xl border px-4 py-3 mb-5 text-sm"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  borderColor: 'rgba(239,68,68,0.3)',
                  color: '#fca5a5',
                }}
              >
                ⚠️ Enlace inválido. Solicita un nuevo correo de recuperación.
              </div>
            )}

            {/* Error servidor */}
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

              {/* Nueva contraseña */}
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: '#64748b' }}
                >
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white
                      placeholder-slate-600 focus:outline-none focus:ring-2 transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: errors.password
                        ? '1px solid rgba(239,68,68,0.5)'
                        : '1px solid rgba(255,255,255,0.1)',
                      '--tw-ring-color': '#3b82f6',
                    }}
                    {...register('password', {
                      required: 'La contraseña es requerida',
                      minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Debe tener mayúsculas, minúsculas y números',
                      },
                    })}
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

              {/* Confirmar contraseña */}
              <div>
                <label
                  className="block text-xs font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: '#64748b' }}
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repite la contraseña"
                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white
                      placeholder-slate-600 focus:outline-none focus:ring-2 transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: errors.confirm
                        ? '1px solid rgba(239,68,68,0.5)'
                        : '1px solid rgba(255,255,255,0.1)',
                      '--tw-ring-color': '#3b82f6',
                    }}
                    {...register('confirm', {
                      required: 'Confirma tu contraseña',
                      validate: val =>
                        val === watch('password') || 'Las contraseñas no coinciden',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#64748b' }}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirm && (
                  <p className="mt-1 text-xs" style={{ color: '#f87171' }}>
                    {errors.confirm.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !token}
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
                    Actualizando...
                  </>
                ) : (
                  <><KeyRound size={16} /> Restablecer contraseña</>
                )}
              </button>
            </form>

            <div className="flex gap-4 mt-6 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500
                  hover:text-slate-300 transition-colors"
              >
                <ArrowLeft size={13} /> Portal residentes
              </Link>
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500
                  hover:text-slate-300 transition-colors"
              >
                <ArrowLeft size={13} /> Panel admin
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
