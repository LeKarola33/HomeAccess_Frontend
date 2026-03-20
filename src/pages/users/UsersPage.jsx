/**
 * HomeAccess - Página de Gestión de Usuarios (Admin)
 * ====================================================
 * CRUD completo: crear, ver detalle, editar y desactivar usuarios.
 * Solo accesible por rol 'admin'.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getUsers, deleteUser } from '@/api/resources.api';
import apiClient from '@/api/apiClient';
import { Eye, EyeOff, X, Check, Plus, Search, ChevronRight, UserPlus } from 'lucide-react';

// ── Configuración visual de roles ───────────────────────────────────────────
const ROLE_COLORS = {
  admin:       'bg-purple-100 text-purple-700 border border-purple-200',
  propietario: 'bg-blue-100   text-blue-700   border border-blue-200',
  residente:   'bg-emerald-100 text-emerald-700 border border-emerald-200',
  portero:     'bg-amber-100  text-amber-700  border border-amber-200',
  //vigilante:   'bg-gray-100   text-gray-600   border border-gray-200',
};

const ROLES = ['admin', 'propietario', 'residente', 'portero'];
const TIPOS_DOC = ['CC', 'CE', 'PAS', 'TI'];

const EMPTY_FORM = {
  nombres: '', apellidos: '', cedula: '', tipo_documento: 'CC',
  email: '', celular: '', role: 'residente', password: '', confirmPassword: '',
};

// ── Sub-componente: campo de formulario ─────────────────────────────────────
const Field = ({ label, error, required, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">⚠ {error}</p>}
  </div>
);

const inputCls = (err) =>
  `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all
  ${err ? 'border-red-300 focus:ring-red-300' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-400'}`;

// ── Componente principal ─────────────────────────────────────────────────────
const UsersPage = () => {
  const queryClient = useQueryClient();

  // Estado de paginación y filtros
  const [page, setPage]             = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch]         = useState('');

  // Estado de modales
  const [modal, setModal]       = useState(null);   // null | 'create' | 'detail' | 'edit'
  const [selected, setSelected] = useState(null);

  // Formulario
  const [form, setForm]       = useState(EMPTY_FORM);
  const [errors, setErrors]   = useState({});
  const [showPass, setShowPass] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['users', page, roleFilter],
    queryFn: () => getUsers({ page, limit: 20, ...(roleFilter && { role: roleFilter }) }),
  });

  // ── Mutaciones ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/users/create', payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
      toast('✅ Usuario creado exitosamente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => apiClient.put(`/users/${id}`, payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
      toast('✅ Usuario actualizado');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast('✅ Estado actualizado');
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
  };

  const validate = (isEdit = false) => {
    const e = {};
    if (!form.nombres.trim())   e.nombres   = 'Requerido';
    if (!form.apellidos.trim()) e.apellidos = 'Requerido';
    if (!form.cedula.trim())    e.cedula    = 'Requerido';
    if (!form.email.trim())     e.email     = 'Requerido';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email inválido';

    if (!isEdit) {
      if (!form.password)           e.password        = 'Requerido';
      else if (form.password.length < 8) e.password   = 'Mínimo 8 caracteres';
      else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
        e.password = 'Debe tener mayúsculas, minúsculas y números';
      if (form.password !== form.confirmPassword)
        e.confirmPassword = 'Las contraseñas no coinciden';
    }
    return e;
  };

  // ── Modales ────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM); setErrors({}); setShowPass(false);
    setModal('create');
  };

  const openDetail = (u) => { setSelected(u); setModal('detail'); };

  const openEdit = (u) => {
    setForm({ ...EMPTY_FORM, ...u, password: '', confirmPassword: '' });
    setErrors({}); setShowPass(false); setSelected(u);
    setModal('edit');
  };

  const closeModal = () => { setModal(null); setSelected(null); setErrors({}); };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleCreate = () => {
    const e = validate(false);
    if (Object.keys(e).length) { setErrors(e); return; }
    const { confirmPassword, ...payload } = form;
    createMutation.mutate({ ...payload, password_hash: payload.password });
  };

  const handleEdit = () => {
    const e = validate(true);
    if (Object.keys(e).length) { setErrors(e); return; }
    const { password, confirmPassword, ...payload } = form;
    updateMutation.mutate({ id: selected._id, payload });
  };

  // ── Render del formulario (crear / editar comparten la misma UI) ───────────
  const renderForm = (isEdit = false) => (
    <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombres" required error={errors.nombres}>
          <input className={inputCls(errors.nombres)} value={form.nombres}
            onChange={e => setField('nombres', e.target.value)} placeholder="Carlos" />
        </Field>
        <Field label="Apellidos" required error={errors.apellidos}>
          <input className={inputCls(errors.apellidos)} value={form.apellidos}
            onChange={e => setField('apellidos', e.target.value)} placeholder="Mendoza" />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Tipo Doc.">
          <select className={inputCls(false)} value={form.tipo_documento}
            onChange={e => setField('tipo_documento', e.target.value)}>
            {TIPOS_DOC.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <div className="col-span-2">
          <Field label="Número de Documento" required error={errors.cedula}>
            <input className={inputCls(errors.cedula)} value={form.cedula}
              onChange={e => setField('cedula', e.target.value)} placeholder="1234567890" />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Correo electrónico" required error={errors.email}>
          <input type="email" className={inputCls(errors.email)} value={form.email}
            onChange={e => setField('email', e.target.value)} placeholder="usuario@mail.com" />
        </Field>
        <Field label="Celular">
          <input className={inputCls(false)} value={form.celular}
            onChange={e => setField('celular', e.target.value)} placeholder="+57 300 000 0000" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Rol en el sistema" required>
          <select className={inputCls(false)} value={form.role}
            onChange={e => setField('role', e.target.value)}>
            {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>
          {form.role === 'admin' && (
            <p className="text-xs text-amber-500 mt-1">⚠ Tendrá acceso total al sistema</p>
          )}
        </Field>
        <Field label="Unidad (Apt.)">
          <input className={inputCls(false)} value={form.unidad || ''}
            onChange={e => setField('unidad', e.target.value)} placeholder="Ej: 302" />
          <p className="text-xs text-gray-400 mt-1">Solo si es residente/propietario</p>
        </Field>
      </div>

      {/* Contraseña solo en creación */}
      {!isEdit && (
        <>
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-3">Acceso al sistema</p>
          </div>
          <Field label="Contraseña" required error={errors.password}>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} className={inputCls(errors.password)}
                value={form.password} onChange={e => setField('password', e.target.value)}
                placeholder="Mín. 8 chars, mayúsculas y números" />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
          <Field label="Confirmar Contraseña" required error={errors.confirmPassword}>
            <input type={showPass ? 'text' : 'password'} className={inputCls(errors.confirmPassword)}
              value={form.confirmPassword} onChange={e => setField('confirmPassword', e.target.value)}
              placeholder="Repita la contraseña" />
          </Field>

          {/* Aviso de consentimiento Ley 1581 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-bold text-blue-700">Ley 1581 de 2012 — </span>
              Al crear este usuario, el administrador declara haber obtenido el consentimiento
              expreso del titular para el tratamiento de sus datos personales.
            </p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Usuarios</h2>
          <p className="text-sm text-gray-500">Gestión de residentes, propietarios y personal</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <UserPlus size={16} /> Nuevo Usuario
        </button>
      </div>

      {/* Toast */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-2.5 text-sm font-medium">
          {successMsg}
        </div>
      )}

      {/* Filtro por rol */}
      <div className="flex gap-2 flex-wrap">
        {['', ...ROLES].map((r) => (
          <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors
              ${roleFilter === r
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {r || 'Todos'}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-5 py-3 text-left">Usuario</th>
              <th className="px-5 py-3 text-left">Rol</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Cédula</th>
              <th className="px-5 py-3 text-left hidden lg:table-cell">Estado</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 animate-pulse rounded" /></td>
                    ))}
                  </tr>
                ))
              : data?.data?.map((u) => (
                  <tr key={u._id} className={`hover:bg-gray-50 transition-colors ${!u.activo ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {u.nombres?.[0]}{u.apellidos?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.nombres} {u.apellidos}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${ROLE_COLORS[u.role] || ''}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{u.cedula}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className={`flex items-center gap-1.5 text-xs ${u.activo ? 'text-emerald-600' : 'text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetail(u)}
                          className="px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors">
                          Ver
                        </button>
                        <button onClick={() => openEdit(u)}
                          className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                          Editar
                        </button>
                        {u.activo && (
                          <button onClick={() => toggleActiveMutation.mutate(u._id)}
                            className="px-2.5 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg font-medium transition-colors">
                            Desact.
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
            <span className="text-xs text-gray-400">{data.pagination.total} usuarios</span>
            <div className="flex gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.pages}
                className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {/* ════ MODAL CREAR ════ */}
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900">Nuevo Usuario</h3>
                <p className="text-xs text-gray-500 mt-0.5">Complete todos los campos obligatorios</p>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-200 rounded-lg"><X size={16} /></button>
            </div>
            {renderForm(false)}
            <div className="flex gap-3 px-5 py-4 border-t bg-gray-50">
              <button onClick={closeModal}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-100">
                Cancelar
              </button>
              <button onClick={handleCreate} disabled={createMutation.isPending}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                {createMutation.isPending
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creando...</>
                  : <><UserPlus size={15} />Crear Usuario</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL DETALLE ════ */}
      {modal === 'detail' && selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-900">Perfil de Usuario</h3>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white text-xl font-bold flex items-center justify-center">
                  {selected.nombres?.[0]}{selected.apellidos?.[0]}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{selected.nombres} {selected.apellidos}</h4>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${ROLE_COLORS[selected.role] || ''}`}>
                    {selected.role}
                  </span>
                </div>
              </div>
              <div className="space-y-0 rounded-xl border border-gray-100 overflow-hidden">
                {[
                  ['Correo', selected.email],
                  ['Cédula', `${selected.tipo_documento} ${selected.cedula}`],
                  ['Celular', selected.celular || '—'],
                  ['Estado', selected.activo ? '✅ Activo' : '⛔ Inactivo'],
                  ['Consentimiento', selected.consent?.dado ? `✅ Ley 1581 aceptada` : '⚠ Pendiente'],
                ].map(([label, value], i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
                    <span className="text-sm text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t">
              <button onClick={() => openEdit(selected)}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">
                ✏ Editar
              </button>
              <button onClick={() => { handleToggleActive(selected); closeModal(); }}
                className="flex-1 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium">
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL EDITAR ════ */}
      {modal === 'edit' && selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900">Editar Usuario</h3>
                <p className="text-xs text-gray-500">{selected.nombres} {selected.apellidos}</p>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-200 rounded-lg"><X size={16} /></button>
            </div>
            {renderForm(true)}
            <div className="flex gap-3 px-5 py-4 border-t bg-gray-50">
              <button onClick={closeModal}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-100">
                Cancelar
              </button>
              <button onClick={handleEdit} disabled={updateMutation.isPending}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2">
                {updateMutation.isPending
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>
                  : <><Check size={15} />Guardar Cambios</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
