'use client';

import React from 'react';
import { Settings } from 'lucide-react';

/**
 * Página de Configuraciones del Dashboard
 */
export default function SettingsPage() {
  return (
    <div className="liquid-glass flex-1 mt-10 ml-4 p-4 rounded-2xl mb-4 min-h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] flex flex-col justify-start overflow-y-auto">
      <div className="mx-auto px-6 py-8 w-full max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Configuraciones</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Gestiona las configuraciones generales del sistema
          </p>
        </div>

        <div className="space-y-6">
          {/* Configuraciones de Usuario */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Configuraciones de Usuario
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Idioma del Sistema
                </label>
                <select className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zona Horaria
                </label>
                <select className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="America/Santiago">Santiago, Chile</option>
                  <option value="America/Buenos_Aires">Buenos Aires, Argentina</option>
                  <option value="America/Mexico_City">Ciudad de México</option>
                </select>
              </div>
            </div>
          </div>

          {/* Configuraciones de Notificaciones */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Notificaciones
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Notificaciones por Email
                  </h3>
                  <p className="text-sm text-gray-500">
                    Recibir notificaciones sobre investigaciones completadas
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Alertas de Sistema
                  </h3>
                  <p className="text-sm text-gray-500">
                    Notificaciones sobre mantenimiento y actualizaciones
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Configuraciones de Seguridad */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Seguridad
            </h2>
            <div className="space-y-4">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Cambiar Contraseña
              </button>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Sesiones Activas
                </h3>
                <div className="text-sm text-gray-500">
                  <p>Dispositivo actual - Última actividad: Ahora</p>
                  <button className="text-red-600 hover:text-red-800 mt-1">
                    Cerrar todas las demás sesiones
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Configuraciones del Sistema */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Sistema
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Exportación de Datos
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  Exporta todos tus datos de investigaciones
                </p>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Exportar Datos
                </button>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Eliminar Cuenta
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  Eliminar permanentemente tu cuenta y todos los datos asociados
                </p>
                <button className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                  Eliminar Cuenta
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="mt-8 flex justify-end">
          <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Guardar Configuraciones
          </button>
        </div>
      </div>
    </div>
  );
}