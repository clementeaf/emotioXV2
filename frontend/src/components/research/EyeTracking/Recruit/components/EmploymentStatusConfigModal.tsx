import { Briefcase, Check, Plus, Target, Trash2, Users, X, X as XIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface EmploymentOption {
  id: string;
  name: string;
  isQualified: boolean;
  isCustom?: boolean;
}

// 🎯 NUEVA INTERFAZ PARA CUOTAS DE SITUACIÓN LABORAL
interface EmploymentStatusQuota {
  id: string;
  employmentStatus: string;
  quota: number;
  isActive: boolean;
}

interface EmploymentStatusConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (options: EmploymentOption[], disqualified: string[]) => void;
  // 🎯 NUEVAS PROPS PARA CUOTAS
  onQuotasSave?: (quotas: EmploymentStatusQuota[]) => void;
  onQuotasToggle?: (enabled: boolean) => void;
  currentOptions?: EmploymentOption[];
  currentDisqualified?: string[];
  // 🎯 NUEVAS PROPS PARA CUOTAS
  initialQuotas?: EmploymentStatusQuota[];
  quotasEnabled?: boolean;
}

const DEFAULT_EMPLOYMENT_STATUSES: EmploymentOption[] = [
  { id: 'dependiente', name: 'Dependiente', isQualified: true },
  { id: 'independiente', name: 'Independiente', isQualified: true },
  { id: 'cesante', name: 'Cesante', isQualified: true },
  { id: 'jubilado', name: 'Jubilado', isQualified: true }
];

export const EmploymentStatusConfigModal: React.FC<EmploymentStatusConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onQuotasSave,
  onQuotasToggle,
  currentOptions = DEFAULT_EMPLOYMENT_STATUSES,
  currentDisqualified = [],
  initialQuotas = [],
  quotasEnabled = false
}) => {
  const [options, setOptions] = useState<EmploymentOption[]>(currentOptions);
  const [disqualified, setDisqualified] = useState<string[]>(currentDisqualified);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // 🎯 NUEVOS ESTADOS PARA CUOTAS
  const [quotas, setQuotas] = useState<EmploymentStatusQuota[]>([]);
  const [quotasEnabledState, setQuotasEnabledState] = useState(quotasEnabled);
  const [activeTab, setActiveTab] = useState<'options' | 'quotas'>('options');

  useEffect(() => {
    if (isOpen) {
      setOptions(currentOptions);
      setDisqualified(currentDisqualified);
      // 🎯 INICIALIZAR CUOTAS
      setQuotas(initialQuotas);
      setQuotasEnabledState(quotasEnabled);
    }
  }, [isOpen, currentOptions, currentDisqualified, initialQuotas, quotasEnabled]);

  const handleToggleQualification = (employmentId: string) => {
    setOptions(prev =>
      prev.map(option =>
        option.id === employmentId
          ? { ...option, isQualified: !option.isQualified }
          : option
      )
    );

    setDisqualified(prev =>
      prev.includes(employmentId)
        ? prev.filter(id => id !== employmentId)
        : [...prev, employmentId]
    );
  };

  const handleEditStart = (option: EmploymentOption) => {
    setEditingId(option.id);
    setEditValue(option.name);
  };

  const handleEditSave = () => {
    if (editingId && editValue.trim()) {
      setOptions(prev =>
        prev.map(option =>
          option.id === editingId
            ? { ...option, name: editValue.trim() }
            : option
        )
      );
      setEditingId(null);
      setEditValue('');
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleAddCustom = () => {
    const newId = `custom-${Date.now()}`;
    const newOption: EmploymentOption = {
      id: newId,
      name: 'Nueva situación laboral',
      isQualified: true,
      isCustom: true
    };
    setOptions(prev => [...prev, newOption]);
    setEditingId(newId);
    setEditValue('Nueva situación laboral');
  };

  const handleDelete = (employmentId: string) => {
    setOptions(prev => prev.filter(option => option.id !== employmentId));
    setDisqualified(prev => prev.filter(id => id !== employmentId));
  };

  // 🎯 NUEVAS FUNCIONES PARA MANEJAR CUOTAS
  const handleAddQuota = () => {
    const newQuota: EmploymentStatusQuota = {
      id: `quota-${Date.now()}`,
      employmentStatus: '',
      quota: 1,
      isActive: true
    };
    setQuotas(prev => [...prev, newQuota]);
  };

  const handleUpdateQuota = (id: string, field: keyof EmploymentStatusQuota, value: any) => {
    setQuotas(prev =>
      prev.map(quota =>
        quota.id === id ? { ...quota, [field]: value } : quota
      )
    );
  };

  const handleDeleteQuota = (id: string) => {
    setQuotas(prev => prev.filter(quota => quota.id !== id));
  };

  const handleToggleQuotasEnabled = () => {
    const newState = !quotasEnabledState;
    setQuotasEnabledState(newState);
    onQuotasToggle?.(newState);
  };

  const handleSave = () => {
    const qualifiedOptions = options.filter(option => option.isQualified);
    const disqualifiedIds = options
      .filter(option => !option.isQualified)
      .map(option => option.id);

    onSave(qualifiedOptions, disqualifiedIds);

    // 🎯 GUARDAR CUOTAS SI ESTÁN HABILITADAS
    if (quotasEnabledState && onQuotasSave) {
      onQuotasSave(quotas);
    }

    onClose();
  };

  const qualifiedCount = options.filter(option => option.isQualified).length;
  const totalCount = options.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Configurar Situaciones Laborales
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 🎯 NUEVO: TABS PARA OPCIONES Y CUOTAS */}
        <div className="flex space-x-1 p-6 bg-gray-100">
          <button
            onClick={() => setActiveTab('options')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'options'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Target className="inline w-4 h-4 mr-2" />
            Opciones de Empleo
          </button>
          <button
            onClick={() => setActiveTab('quotas')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'quotas'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Users className="inline w-4 h-4 mr-2" />
            Cuotas Dinámicas
          </button>
        </div>

        {/* 🎯 CONTENIDO DE TABS */}
        {activeTab === 'options' ? (
          <div className="p-6">
            {/* Statistics */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900">
                  Situaciones calificadas: {qualifiedCount}/{totalCount}
                </span>
                <span className="text-xs text-blue-600">
                  {Math.round((qualifiedCount / totalCount) * 100)}% válidas
                </span>
              </div>
            </div>

            {/* Employment Options */}
            <div className="space-y-3">
              {options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggleQualification(option.id)}
                      className={`w-10 h-6 rounded-full transition-colors ${option.isQualified
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                        }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full transition-transform ${option.isQualified ? 'translate-x-5' : 'translate-x-1'
                          }`}
                      />
                    </button>

                    {/* Name */}
                    <div className="flex-1">
                      {editingId === option.id ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave();
                            if (e.key === 'Escape') handleEditCancel();
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          autoFocus
                        />
                      ) : (
                        <span className={`text-sm ${option.isQualified ? 'text-gray-900' : 'text-gray-500 line-through'
                          }`}>
                          {option.name}
                        </span>
                      )}
                    </div>

                    {/* Status Icon */}
                    {option.isQualified ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <XIcon size={16} className="text-red-500" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-3">
                    {editingId !== option.id && (
                      <>
                        <button
                          onClick={() => handleEditStart(option)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {option.isCustom && (
                          <button
                            onClick={() => handleDelete(option.id)}
                            className="p-1 text-red-400 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Option */}
            <div className="mt-4">
              <button
                onClick={handleAddCustom}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus size={16} />
                <span className="text-sm">Agregar situación personalizada</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* 🎯 NUEVA SECCIÓN: CONFIGURACIÓN DE CUOTAS */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Sistema de Cuotas por Situación Laboral</h3>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Habilitar cuotas</span>
                  <button
                    onClick={handleToggleQuotasEnabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${quotasEnabledState ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${quotasEnabledState ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </div>

              {quotasEnabledState ? (
                <>
                  <p className="text-gray-600 mb-4">
                    Configura cuotas específicas por situación laboral. Cuando se alcance la cuota de una situación laboral,
                    los participantes de esa situación serán descalificados automáticamente.
                  </p>

                  {/* Lista de cuotas */}
                  <div className="space-y-3 mb-4">
                    {quotas.map((quota) => (
                      <div
                        key={quota.id}
                        className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          {/* Situación Laboral */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Situación Laboral
                            </label>
                            <input
                              type="text"
                              value={quota.employmentStatus}
                              onChange={(e) => handleUpdateQuota(quota.id, 'employmentStatus', e.target.value)}
                              placeholder="ej: Dependiente"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {/* Cuota */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Cuota
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={quota.quota}
                              onChange={(e) => handleUpdateQuota(quota.id, 'quota', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        {/* Estado activo/inactivo */}
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm ${quota.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                            {quota.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                          <button
                            onClick={() => handleUpdateQuota(quota.id, 'isActive', !quota.isActive)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${quota.isActive ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${quota.isActive ? 'translate-x-5' : 'translate-x-1'
                                }`}
                            />
                          </button>
                        </div>

                        {/* Botón eliminar */}
                        <button
                          onClick={() => handleDeleteQuota(quota.id)}
                          className="p-2 text-red-600 hover:text-red-800"
                          title="Eliminar cuota"
                        >
                          <XIcon size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Agregar nueva cuota */}
                  <button
                    onClick={handleAddQuota}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Briefcase size={16} />
                    <span>Agregar nueva cuota</span>
                  </button>

                  {/* Información sobre cuotas */}
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">💡 Cómo funcionan las cuotas:</h4>
                    <ul className="text-yellow-700 text-sm space-y-1">
                      <li>• Cada situación laboral puede tener su propia cuota</li>
                      <li>• El sistema automáticamente contará los participantes que se registren</li>
                      <li>• Cuando se alcance la cuota, los participantes de esa situación serán descalificados automáticamente</li>
                      <li>• Las cuotas inactivas no afectan la descalificación</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>Habilita el sistema de cuotas para configurar límites por situación laboral</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
