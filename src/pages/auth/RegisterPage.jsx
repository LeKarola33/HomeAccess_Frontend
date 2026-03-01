/**
 * HomeAccess - Página de Registro
 * =================================
 * Incluye el checkbox de consentimiento obligatorio (Ley 1581 de 2012).
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { registerUser } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (formData) => {
    setServerError('');
    try {
      // Estructurar el payload según el modelo del backend
      const payload = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        cedula: formData.cedula,
        email: formData.email,
        password: formData.password,
        celular: formData.celular,
        consent: {
          dado: true,
          fecha: new Date().toISOString(),
          version: '1.0',
          canal: 'web',
        },
      };

      const result = await registerUser(payload);
      setAuth(result.data.user, result.data.accessToken, result.data.refreshToken);
      navigate('/dashboard');
    } catch (error) {
      setServerError(error.response?.data?.message || 'Error al registrarse. Intente de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-3">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">HomeAccess</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Crear Cuenta</h2>

          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Nombres y Apellidos en fila */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                <input
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${errors.nombres ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Juan Carlos"
                  {...register('nombres', { required: 'Requerido', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
                />
                {errors.nombres && <p className="mt-1 text-xs text-red-600">{errors.nombres.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                <input
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${errors.apellidos ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="García López"
                  {...register('apellidos', { required: 'Requerido', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
                />
                {errors.apellidos && <p className="mt-1 text-xs text-red-600">{errors.apellidos.message}</p>}
              </div>
            </div>

            {/* Cédula */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cédula</label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.cedula ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="1234567890"
                {...register('cedula', { required: 'La cédula es requerida' })}
              />
              {errors.cedula && <p className="mt-1 text-xs text-red-600">{errors.cedula.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="usuario@ejemplo.com"
                {...register('email', {
                  required: 'El email es requerido',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' },
                })}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            {/* Celular */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+573001234567"
                {...register('celular')}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="Mínimo 8 caracteres"
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Debe tener mayúsculas, minúsculas y números',
                  },
                })}
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            {/* === CONSENTIMIENTO - Ley 1581 de 2012 (OBLIGATORIO) === */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent"
                  className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer"
                  {...register('consent', {
                    required: 'Debe aceptar la política de tratamiento de datos para continuar',
                  })}
                />
                <label htmlFor="consent" className="text-xs text-gray-700 cursor-pointer">
                  <strong>Autorización de Tratamiento de Datos Personales (Ley 1581 de 2012):</strong>{' '}
                  Acepto que mis datos personales sean tratados por HomeAccess para la administración
                  del conjunto residencial. Tengo derecho a conocer, actualizar, rectificar y suprimir
                  mis datos (derechos ARCO). Consulte nuestra{' '}
                  <a href="#" className="text-blue-600 underline">Política de Privacidad</a>.
                </label>
              </div>
              {errors.consent && (
                <p className="mt-2 text-xs text-red-600 ml-7">{errors.consent.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            ¿Ya tiene cuenta?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
