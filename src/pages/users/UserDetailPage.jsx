/**
 * HomeAccess - Detalle de Usuario
 * =================================
 * Muestra información detallada de un usuario individual.
 * Ruta: /usuarios/:id
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUserById } from '@/api/resources.api';
import { ArrowLeft, Mail, Phone, Building2 } from 'lucide-react';

const UserDetailPage = () => {
  const { id } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', id],
    queryFn: () => getUserById(id),
  });

  if (isLoading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-40 bg-gray-200 rounded" />
    </div>
  );

  if (isError) return (
    <div className="text-center py-12 text-gray-400">
      <p>Error al cargar el usuario.</p>
      <Link to="/usuarios" className="text-blue-600 text-sm mt-2 inline-block">Volver a usuarios</Link>
    </div>
  );

  const user = data?.data;

  return (
    <div className="space-y-6 max-w-2xl">
      <Link to="/usuarios" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} />
        Volver a Usuarios
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Avatar y nombre */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center">
            {user?.nombres?.[0]}{user?.apellidos?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.nombres} {user?.apellidos}</h2>
            <span className="text-sm text-gray-500 capitalize">{user?.role}</span>
          </div>
        </div>

        {/* Datos de contacto */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} className="text-gray-400" />
            <span className="text-gray-700">{user?.email}</span>
          </div>
          {user?.celular && (
            <div className="flex items-center gap-3 text-sm">
              <Phone size={16} className="text-gray-400" />
              <span className="text-gray-700">{user?.celular}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <Building2 size={16} className="text-gray-400" />
            <span className="text-gray-700">
              {user?.unidades?.length > 0
                ? user.unidades.map(u => `Apt. ${u.numero}`).join(', ')
                : 'Sin unidad asignada'}
            </span>
          </div>
        </div>

        {/* Estado del consentimiento (Ley 1581) */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Consentimiento (Ley 1581):{' '}
            <span className={user?.consent?.dado ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
              {user?.consent?.dado ? `Otorgado el ${new Date(user?.consent?.fecha).toLocaleDateString('es-CO')}` : 'Pendiente'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
