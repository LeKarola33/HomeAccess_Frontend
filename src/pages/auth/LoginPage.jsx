/**
 * HomeAccess - Página de Login
 * =============================
 * Formulario de autenticación con validación usando react-hook-form.
 * Al hacer login exitoso, guarda los tokens en el store y redirige al dashboard.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import { loginUser } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import logo from '@/img/logo.jpeg'; 

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  // Redirigir a la página que intentó acceder, o al dashboard por defecto
  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ email, password }) => {
    setServerError('');
    try {
      const result = await loginUser(email, password);
      // Guardar en el store global (y localStorage via persist)
      setAuth(result.data.user, result.data.accessToken, result.data.refreshToken);
      navigate(from, { replace: true });
    } catch (error) {
      // Mostrar mensaje del servidor o error genérico
      setServerError(
        error.response?.data?.message || 'Error al iniciar sesión. Intente de nuevo.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

       {/* Logo y título */}
<div className="text-center mb-8">
  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 overflow-hidden">
    <img
      src={logo}
      alt="HomeAccess Logo"
      className="w-full h-full object-contain"
    />
  </div>
  <h1 className="text-3xl font-bold text-white">HomeAccess</h1>
  <p className="text-slate-400 mt-1">Sistema de Administración Residencial</p>
       </div>
        {/* Card del formulario */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Iniciar Sesión</h2>

          {/* Error del servidor */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                autoComplete="email"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                  ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                placeholder="usuario@ejemplo.com"
                {...register('email', {
                  required: 'El email es requerido',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                    ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'La contraseña es requerida',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm transition-colors mt-2"
            >
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tiene cuenta?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Registrarse
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
