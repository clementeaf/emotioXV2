'use client';

import React, { useState } from 'react';
import { Shield, Users, Settings, Database, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const router = useRouter();

  // Verificar acceso con clave secreta
  const handleSecretKeySubmit = () => {
    if (secretKey === 'admin2025!') {
      setIsAuthenticated(true);
      toast.success('Acceso autorizado');
    } else {
      toast.error('Clave secreta incorrecta');
    }
  };

  // Pantalla de autenticación
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Panel de Administración
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Ingresa la clave secreta para acceder
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <div>
              <input
                type="password"
                placeholder="Clave secreta"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSecretKeySubmit()}
              />
            </div>
            <button
              onClick={handleSecretKeySubmit}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Shield className="h-4 w-4 mr-2" />
              Acceder
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Panel de administración
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Panel de Administración
                </h1>
                <p className="text-sm text-gray-600">
                  Sistema de administración EmotioXV2
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Módulos de administración */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Gestión de usuarios */}
          <div 
            onClick={() => router.push('/admin/users')}
            className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Gestión de Usuarios
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Crear, editar y administrar usuarios del sistema. 
              Ver credenciales y gestionar accesos.
            </p>
            <div className="flex items-center text-blue-600 text-sm font-medium">
              Administrar usuarios
              <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Gestión de base de datos */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Database className="h-8 w-8 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Base de Datos
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Herramientas para gestionar y limpiar datos.
              Backups y mantenimiento del sistema.
            </p>
            <div className="flex items-center text-green-600 text-sm font-medium">
              Próximamente
              <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Configuración del sistema */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Settings className="h-8 w-8 text-purple-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Configuración
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Ajustes generales del sistema, variables de entorno
              y configuraciones avanzadas.
            </p>
            <div className="flex items-center text-purple-600 text-sm font-medium">
              Próximamente
              <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

        </div>

        {/* Información del sistema */}
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estado del Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-green-800 font-semibold">Sistema</div>
              <div className="text-green-600">Operativo</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-800 font-semibold">Base de Datos</div>
              <div className="text-blue-600">Conectada</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-purple-800 font-semibold">API</div>
              <div className="text-purple-600">Funcionando</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}