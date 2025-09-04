'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Save,
  X,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { adminAPI } from '@/config/api-client';
import { useAdmin } from '@/contexts/AdminContext';

interface UserData {
  id: string;
  email: string;
  password?: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface CreateUserData {
  email: string;
  password: string;
  role: 'user' | 'admin';
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAdmin();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Formulario para crear usuario
  const [newUser, setNewUser] = useState<CreateUserData>({
    email: '',
    password: '',
    role: 'user'
  });

  // Load users on authentication or redirect if not authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    } else {
      router.push('/admin');
    }
  }, [isAuthenticated, router]);

  // Cargar todos los usuarios desde el backend
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const response = await adminAPI.getAllUsers();
      
      // Check if response is a Response object that needs to be parsed
      let data = response;
      
      // If it's a Response object with a json method, parse it
      if (response && typeof response.json === 'function') {
        try {
          // Clone the response before reading to avoid stream already read error
          const clonedResponse = response.clone ? response.clone() : response;
          data = await clonedResponse.json();
        } catch (parseError) {
          // Try to get text if JSON parsing fails
          await response.text();
        }
      }
      
      // Handle different response formats
      if (data) {
        
        // Format 1: { success: true, data: [...] }
        if (data.success && Array.isArray(data.data)) {
          setUsers(data.data);
          setFilteredUsers(data.data);
          toast.success(`Cargados ${data.data.length} usuarios`);
        }
        // Format 2: { data: [...] }
        else if (Array.isArray(data.data)) {
          setUsers(data.data);
          setFilteredUsers(data.data);
          toast.success(`Cargados ${data.data.length} usuarios`);
        }
        // Format 3: Direct array
        else if (Array.isArray(data)) {
          setUsers(data);
          setFilteredUsers(data);
          toast.success(`Cargados ${data.length} usuarios`);
        }
        // Format 4: { users: [...] }
        else if (Array.isArray(data.users)) {
          setUsers(data.users);
          setFilteredUsers(data.users);
          toast.success(`Cargados ${data.users.length} usuarios`);
        }
        else {
          toast.error('Formato de respuesta inesperado');
        }
      } else {
        toast.error('No se recibieron datos del servidor');
      }
      
    } catch (error) {
      toast.error(`Error cargando usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios por búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Crear nuevo usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.email || !newUser.password) {
      toast.error('Email y contraseña son obligatorios');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const response = await adminAPI.createUser({
        email: newUser.email,
        password: newUser.password,
        role: newUser.role
      });
      
      
      // Check if response indicates success
      if (response) {
        // Always reload the users list after creation
        await loadUsers();
        
        setNewUser({ email: '', password: '', role: 'user' });
        setShowCreateForm(false);
        toast.success('Usuario creado exitosamente');
      } else {
        toast.error('No se pudo crear el usuario');
      }
      
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error creando usuario';
      toast.error(errorMessage);
    }
  };

  // Actualizar usuario
  const handleUpdateUser = async (userId: string, updates: Partial<UserData>) => {
    try {
      const response = await adminAPI.updateUser(userId, {
        email: updates.email,
        password: updates.password,
        role: updates.role,
        status: updates.status
      });
      
      if (response && response.data) {
        // Recargar la lista de usuarios
        await loadUsers();
        
        setEditingUser(null);
        toast.success('Usuario actualizado exitosamente');
      }
      
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error actualizando usuario';
      toast.error(errorMessage);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId: string) => {
    const user = users.find(user => user.id === userId);
    if (user) {
      setUserToDelete(user);
      setShowDeleteModal(true);
    }
  };

  // Confirmar eliminación de usuario
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await adminAPI.deleteUser(userToDelete.id);
      
      if (response) {
        // Recargar la lista de usuarios
        await loadUsers();
        
        toast.success('Usuario eliminado exitosamente');
      }
      
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error eliminando usuario';
      toast.error(errorMessage);
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  // Alternar visibilidad de contraseña
  const togglePasswordVisibility = (userId: string) => {
    const newShowPasswords = new Set(showPasswords);
    if (newShowPasswords.has(userId)) {
      newShowPasswords.delete(userId);
    } else {
      newShowPasswords.add(userId);
    }
    setShowPasswords(newShowPasswords);
  };

  // Generar contraseña aleatoria
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Toggle single user selection
  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  // Toggle all users selection
  const toggleAllUsersSelection = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    }
  };

  // Bulk delete users
  const handleBulkDelete = () => {
    if (selectedUsers.size === 0) {
      toast.error('No has seleccionado ningún usuario');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    const usersToDelete = Array.from(selectedUsers);
    let successCount = 0;
    let failCount = 0;

    for (const userId of usersToDelete) {
      try {
        await adminAPI.deleteUser(userId);
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0) {
      await loadUsers();
      toast.success(`${successCount} usuario(s) eliminado(s) exitosamente`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} usuario(s) no pudieron ser eliminados`);
    }

    setSelectedUsers(new Set());
    setShowBulkDeleteModal(false);
  };

  // Show loading while redirecting if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/admin')}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <User className="h-8 w-8 text-indigo-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Administración de Usuarios
                  </h1>
                  <p className="text-sm text-gray-600">
                    Gestiona usuarios del sistema EmotioXV2 ({filteredUsers.length} usuarios)
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={loadUsers}
                  disabled={loading}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                {selectedUsers.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar ({selectedUsers.size})
                  </button>
                )}
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Usuario
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Buscador */}
        <div className="bg-white shadow rounded-lg mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios por email o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Formulario de creación */}
        {showCreateForm && (
          <div className="bg-white shadow rounded-lg mb-6 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Crear Nuevo Usuario
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewUser({ email: '', password: '', role: 'user' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="usuario@ejemplo.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Contraseña"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setNewUser(prev => ({ ...prev, password: generateRandomPassword() }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Generar contraseña aleatoria"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabla de usuarios */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Lista de Usuarios
            </h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Cargando usuarios...</p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-96" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db #f3f4f6'
            }}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onChange={toggleAllUsersSelection}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contraseña
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      editingUser={editingUser}
                      showPassword={showPasswords.has(user.id)}
                      isSelected={selectedUsers.has(user.id)}
                      onToggleSelect={() => toggleUserSelection(user.id)}
                      onEdit={setEditingUser}
                      onUpdate={handleUpdateUser}
                      onDelete={handleDeleteUser}
                      onTogglePassword={() => togglePasswordVisibility(user.id)}
                      generateRandomPassword={generateRandomPassword}
                    />
                  ))}
                </tbody>
              </table>
              
              {filteredUsers.length === 0 && !loading && (
                <div className="p-6 text-center">
                  <User className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">
                    {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de confirmación de eliminación masiva */}
        {showBulkDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Confirmar eliminación masiva
              </h3>
              
              <p className="text-gray-600 text-center mb-6">
                ¿Estás seguro de que quieres eliminar{' '}
                <strong>{selectedUsers.size} usuario(s)</strong>?{' '}
                Esta acción no se puede deshacer.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowBulkDeleteModal(false);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmBulkDelete}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                >
                  Eliminar Todos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación individual */}
        {showDeleteModal && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Confirmar eliminación
              </h3>
              
              <p className="text-gray-600 text-center mb-6">
                ¿Estás seguro de que quieres eliminar el usuario{' '}
                <strong>"{userToDelete.email}"</strong>?{' '}
                Esta acción no se puede deshacer.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para cada fila de usuario
interface UserRowProps {
  user: UserData;
  editingUser: UserData | null;
  showPassword: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: (user: UserData | null) => void;
  onUpdate: (userId: string, updates: Partial<UserData>) => void;
  onDelete: (userId: string) => void;
  onTogglePassword: () => void;
  generateRandomPassword: () => string;
}

function UserRow({ 
  user, 
  editingUser, 
  showPassword,
  isSelected,
  onToggleSelect,
  onEdit, 
  onUpdate, 
  onDelete, 
  onTogglePassword,
  generateRandomPassword
}: UserRowProps) {
  const [editForm, setEditForm] = useState({
    email: user.email,
    password: '',
    role: user.role,
    status: user.status
  });

  const isEditing = editingUser?.id === user.id;

  useEffect(() => {
    if (isEditing) {
      setEditForm({
        email: user.email,
        password: '',
        role: user.role,
        status: user.status
      });
    }
  }, [isEditing, user]);

  const handleSave = () => {
    if (!editForm.email.trim()) {
      toast.error('El email es obligatorio');
      return;
    }

    const updates: Partial<UserData> = {
      email: editForm.email,
      role: editForm.role,
      status: editForm.status
    };
    
    if (editForm.password.trim()) {
      updates.password = editForm.password;
    }
    
    onUpdate(user.id, updates);
  };

  const handleCancel = () => {
    setEditForm({
      email: user.email,
      password: '',
      role: user.role,
      status: user.status
    });
    onEdit(null);
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setEditForm(prev => ({ ...prev, password: newPassword }));
    toast.success('Contraseña generada');
  };

  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {isEditing ? (
          <input
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        ) : (
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
              <span className="text-sm font-medium text-indigo-800">
                {user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{user.email}</div>
              <div className="text-sm text-gray-500">ID: {user.id}</div>
            </div>
          </div>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={editForm.password}
              onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nueva contraseña (opcional)"
            />
            <button
              onClick={handleGeneratePassword}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Generar contraseña"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2 font-mono">
              {showPassword ? (user.password || '••••••••') : '••••••••'}
            </span>
            <button
              onClick={onTogglePassword}
              className="text-gray-400 hover:text-gray-600"
              title={showPassword ? 'Ocultar' : 'Mostrar'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        {isEditing ? (
          <select
            value={editForm.role}
            onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        ) : (
          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
            user.role === 'admin' 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {user.role === 'admin' ? 'Administrador' : 'Usuario'}
          </span>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        {isEditing ? (
          <select
            value={editForm.status}
            onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        ) : (
          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
            user.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {user.status === 'active' ? 'Activo' : 'Inactivo'}
          </span>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {isEditing ? (
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleSave}
              className="text-green-600 hover:text-green-900 p-1 rounded"
              title="Guardar"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
              title="Cancelar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => onEdit(user)}
              className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(user.id)}
              className="text-red-600 hover:text-red-900 p-1 rounded"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}