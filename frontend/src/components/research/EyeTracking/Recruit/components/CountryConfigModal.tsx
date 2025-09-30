import { ChevronDown, ChevronRight, Edit2, Globe, Save, Search, Star, Target, Trash2, Users, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface Country {
  id: string;
  name: string;
  continent: string;
  isDisqualifying: boolean;
  isPriority?: boolean;
  isEditing?: boolean;
}

// 🎯 NUEVA INTERFAZ PARA CUOTAS DE PAÍS
interface CountryQuota {
  id: string;
  country: string;
  quota: number;
  isActive: boolean;
}

interface Continent {
  name: string;
  countries: string[];
}

interface ContinentSection {
  name: string;
  countries: Country[];
  isExcluded: boolean;
  isExpanded: boolean;
}

interface CountryConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (validCountries: string[], disqualifyingCountries: string[], priorityCountries: string[]) => void;
  // 🎯 NUEVAS PROPS PARA CUOTAS
  onQuotasSave?: (quotas: CountryQuota[]) => void;
  onQuotasToggle?: (enabled: boolean) => void;
  initialValidCountries?: string[];
  initialDisqualifyingCountries?: string[];
  initialPriorityCountries?: string[];
  // 🎯 NUEVAS PROPS PARA CUOTAS
  initialQuotas?: CountryQuota[];
  quotasEnabled?: boolean;
}

// Datos de países por continente
const CONTINENTS_DATA: Continent[] = [
  {
    name: 'América del Norte',
    countries: ['Estados Unidos', 'Canadá', 'México', 'Guatemala', 'Belice', 'El Salvador', 'Honduras', 'Nicaragua', 'Costa Rica', 'Panamá']
  },
  {
    name: 'América del Sur',
    countries: ['Brasil', 'Argentina', 'Chile', 'Perú', 'Colombia', 'Venezuela', 'Ecuador', 'Bolivia', 'Paraguay', 'Uruguay', 'Guyana', 'Surinam', 'Guyana Francesa']
  },
  {
    name: 'Europa',
    countries: ['Alemania', 'Francia', 'España', 'Italia', 'Reino Unido', 'Polonia', 'Rumania', 'Países Bajos', 'Bélgica', 'Grecia', 'República Checa', 'Portugal', 'Suecia', 'Hungría', 'Austria', 'Suiza', 'Bulgaria', 'Dinamarca', 'Finlandia', 'Eslovaquia', 'Noruega', 'Irlanda', 'Croacia', 'Eslovenia', 'Estonia', 'Letonia', 'Lituania', 'Luxemburgo', 'Malta', 'Chipre']
  },
  {
    name: 'Asia',
    countries: ['China', 'India', 'Japón', 'Indonesia', 'Pakistán', 'Bangladés', 'Rusia', 'Filipinas', 'Vietnam', 'Turquía', 'Irán', 'Tailandia', 'Myanmar', 'Corea del Sur', 'Irak', 'Afganistán', 'Arabia Saudita', 'Uzbekistán', 'Yemen', 'Malasia', 'Siria', 'Kazajistán', 'Camboya', 'Nepal', 'Tayikistán', 'Corea del Norte', 'Sri Lanka', 'Kuwait', 'Azerbaiyán', 'Jordania', 'Emiratos Árabes Unidos', 'Turkmenistán', 'Israel', 'Hong Kong', 'Taiwán', 'Singapur', 'Líbano', 'Omán', 'Qatar', 'Bahrein', 'Timor Oriental', 'Bután', 'Maldivas', 'Brunei']
  },
  {
    name: 'África',
    countries: ['Nigeria', 'Etiopía', 'Egipto', 'República Democrática del Congo', 'Tanzania', 'Sudáfrica', 'Kenia', 'Uganda', 'Sudán', 'Argelia', 'Marruecos', 'Angola', 'Ghana', 'Mozambique', 'Madagascar', 'Camerún', 'Costa de Marfil', 'Níger', 'Burkina Faso', 'Malí', 'Malawi', 'Zambia', 'Senegal', 'Chad', 'Somalia', 'Zimbabue', 'Guinea', 'Ruanda', 'Benín', 'Burundi', 'Túnez', 'Sudán del Sur', 'Togo', 'Sierra Leona', 'Libia', 'República del Congo', 'Liberia', 'República Centroafricana', 'Mauritania', 'Eritrea', 'Namibia', 'Gambia', 'Gabón', 'Lesoto', 'Guinea-Bissau', 'Guinea Ecuatorial', 'Mauricio', 'Esuatini', 'Yibuti', 'Comoras', 'Cabo Verde', 'Seychelles', 'Santo Tomé y Príncipe']
  },
  {
    name: 'Oceanía',
    countries: ['Australia', 'Papúa Nueva Guinea', 'Nueva Zelanda', 'Fiyi', 'Islas Salomón', 'Vanuatu', 'Nueva Caledonia', 'Polinesia Francesa', 'Samoa', 'Guam', 'Kiribati', 'Micronesia', 'Tonga', 'Islas Marshall', 'Palau', 'Tuvalu', 'Nauru', 'Islas Cook', 'Niue', 'Tokelau']
  }
];

const CountryConfigModal: React.FC<CountryConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onQuotasSave,
  onQuotasToggle,
  initialValidCountries = [],
  initialDisqualifyingCountries = [],
  initialPriorityCountries = [],
  initialQuotas = [],
  quotasEnabled = false
}) => {
  const [continentSections, setContinentSections] = useState<ContinentSection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCountry, setEditingCountry] = useState<string | null>(null);

  // 🎯 NUEVOS ESTADOS PARA CUOTAS
  const [quotas, setQuotas] = useState<CountryQuota[]>([]);
  const [quotasEnabledState, setQuotasEnabledState] = useState(quotasEnabled);
  const [activeTab, setActiveTab] = useState<'options' | 'quotas'>('options');

  // Crear secciones de continentes con países
  const createContinentSections = useMemo(() => {
    return CONTINENTS_DATA.map(continent => {
      const countries = continent.countries.map(countryName => ({
        id: countryName,
        name: countryName,
        continent: continent.name,
        isDisqualifying: initialDisqualifyingCountries.includes(countryName),
        isPriority: initialPriorityCountries.includes(countryName),
        isEditing: false
      }));

      const isExcluded = continent.countries.every(country =>
        initialDisqualifyingCountries.includes(country)
      );

      return {
        name: continent.name,
        countries,
        isExcluded,
        isExpanded: true
      };
    });
  }, [initialDisqualifyingCountries, initialPriorityCountries]);

  useEffect(() => {
    if (isOpen) {
      setContinentSections(createContinentSections);
      // 🎯 INICIALIZAR CUOTAS
      setQuotas(initialQuotas);
      setQuotasEnabledState(quotasEnabled);
    }
  }, [isOpen, createContinentSections, initialQuotas, quotasEnabled]);

  // Filtrar continentes y países por búsqueda
  const filteredSections = useMemo(() => {
    if (!searchTerm) return continentSections;

    return continentSections.map(section => ({
      ...section,
      countries: section.countries.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(section => section.countries.length > 0);
  }, [continentSections, searchTerm]);

  const handleToggleContinentExclusion = (continentName: string) => {
    setContinentSections(prev =>
      prev.map(section =>
        section.name === continentName
          ? {
            ...section,
            isExcluded: !section.isExcluded,
            countries: section.countries.map(country => ({
              ...country,
              isDisqualifying: !section.isExcluded // Si el continente se excluye, todos los países se descalifican
            }))
          }
          : section
      )
    );
  };

  const handleToggleCountryDisqualifying = (continentName: string, countryId: string) => {
    setContinentSections(prev =>
      prev.map(section =>
        section.name === continentName
          ? {
            ...section,
            countries: section.countries.map(country =>
              country.id === countryId
                ? { ...country, isDisqualifying: !country.isDisqualifying }
                : country
            )
          }
          : section
      )
    );
  };

  const handleToggleCountryPriority = (continentName: string, countryId: string) => {
    setContinentSections(prev =>
      prev.map(section =>
        section.name === continentName
          ? {
            ...section,
            countries: section.countries.map(country =>
              country.id === countryId
                ? { ...country, isPriority: !country.isPriority }
                : country
            )
          }
          : section
      )
    );
  };

  const handleToggleContinentExpansion = (continentName: string) => {
    setContinentSections(prev =>
      prev.map(section =>
        section.name === continentName
          ? { ...section, isExpanded: !section.isExpanded }
          : section
      )
    );
  };

  const handleEditStart = (continentName: string, countryId: string) => {
    setEditingCountry(countryId);
    setContinentSections(prev =>
      prev.map(section =>
        section.name === continentName
          ? {
            ...section,
            countries: section.countries.map(country =>
              country.id === countryId
                ? { ...country, isEditing: true }
                : country
            )
          }
          : section
      )
    );
  };

  const handleEditSave = (continentName: string, countryId: string, newName: string) => {
    if (newName.trim()) {
      setContinentSections(prev =>
        prev.map(section =>
          section.name === continentName
            ? {
              ...section,
              countries: section.countries.map(country =>
                country.id === countryId
                  ? { ...country, name: newName.trim(), isEditing: false }
                  : country
              )
            }
            : section
        )
      );
      setEditingCountry(null);
    }
  };

  const handleEditCancel = (continentName: string, countryId: string) => {
    setContinentSections(prev =>
      prev.map(section =>
        section.name === continentName
          ? {
            ...section,
            countries: section.countries.map(country =>
              country.id === countryId
                ? { ...country, isEditing: false }
                : country
            )
          }
          : section
      )
    );
    setEditingCountry(null);
  };

  const handleDeleteCountry = (continentName: string, countryId: string) => {
    setContinentSections(prev =>
      prev.map(section =>
        section.name === continentName
          ? {
            ...section,
            countries: section.countries.filter(country => country.id !== countryId)
          }
          : section
      ).filter(section => section.countries.length > 0)
    );
  };

  // 🎯 NUEVAS FUNCIONES PARA MANEJAR CUOTAS
  const handleAddQuota = () => {
    const newQuota: CountryQuota = {
      id: `quota-${Date.now()}`,
      country: '',
      quota: 1,
      isActive: true
    };
    setQuotas(prev => [...prev, newQuota]);
  };

  const handleUpdateQuota = (id: string, field: keyof CountryQuota, value: any) => {
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
    const allCountries = continentSections.flatMap(section => section.countries);

    const validCountries = allCountries
      .filter(country => !country.isDisqualifying)
      .map(country => country.name);

    const disqualifyingCountries = allCountries
      .filter(country => country.isDisqualifying)
      .map(country => country.name);

    const priorityCountries = allCountries
      .filter(country => country.isPriority && !country.isDisqualifying)
      .map(country => country.name);

    onSave(validCountries, disqualifyingCountries, priorityCountries);

    // 🎯 GUARDAR CUOTAS SI ESTÁN HABILITADAS
    if (quotasEnabledState && onQuotasSave) {
      onQuotasSave(quotas);
    }

    onClose();
  };

  const validCountriesCount = continentSections
    .flatMap(section => section.countries)
    .filter(country => !country.isDisqualifying).length;

  const priorityCountriesCount = continentSections
    .flatMap(section => section.countries)
    .filter(country => country.isPriority && !country.isDisqualifying).length;

  const totalCountries = continentSections
    .flatMap(section => section.countries).length;

  const excludedContinentsCount = continentSections
    .filter(section => section.isExcluded).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Configurar países</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* 🎯 NUEVO: TABS PARA OPCIONES Y CUOTAS */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('options')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'options'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Target className="inline w-4 h-4 mr-2" />
            Opciones de País
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
          <>
            <p className="text-gray-600 mb-6">
              Organiza países por continentes. Excluye continentes completos o exceptúa países específicos.
            </p>

            {/* Búsqueda */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar países..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Estadísticas */}
            <div className="mb-6 grid grid-cols-4 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-medium text-blue-800">Total países</div>
                <div className="text-blue-600">{totalCountries}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="font-medium text-green-800">Países válidos</div>
                <div className="text-green-600">{validCountriesCount}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="font-medium text-purple-800">Prioritarios</div>
                <div className="text-purple-600">{priorityCountriesCount}</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="font-medium text-orange-800">Continentes excluidos</div>
                <div className="text-orange-600">{excludedContinentsCount}</div>
              </div>
            </div>

            {/* Lista de continentes */}
            <div className="space-y-4 mb-6 overflow-y-auto max-h-[30vh]">
              {filteredSections.map((section) => (
                <div
                  key={section.name}
                  className={`border rounded-lg overflow-hidden ${section.isExcluded
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-white'
                    }`}
                >
                  {/* Header del continente */}
                  <div
                    className={`p-4 cursor-pointer transition-colors ${section.isExcluded
                        ? 'bg-red-100 hover:bg-red-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    onClick={() => handleToggleContinentExpansion(section.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleContinentExclusion(section.name);
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${section.isExcluded ? 'bg-red-500' : 'bg-gray-300'
                            }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${section.isExcluded ? 'translate-x-6' : 'translate-x-1'
                              }`}
                          />
                        </button>
                        <div>
                          <div className="font-medium">{section.name}</div>
                          <div className="text-sm text-gray-500">
                            {section.countries.length} países
                            {section.isExcluded && (
                              <span className="text-red-600 ml-2">(Excluido)</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${section.isExcluded ? 'text-red-600' : 'text-gray-600'}`}>
                          {section.isExcluded ? 'Excluido' : 'Incluido'}
                        </span>
                        {section.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Lista de países del continente */}
                  {section.isExpanded && (
                    <div className="border-t border-gray-200">
                      {section.countries.map((country) => (
                        <div
                          key={country.id}
                          className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 ${country.isDisqualifying
                              ? 'bg-orange-50'
                              : 'bg-white'
                            }`}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            {country.isEditing ? (
                              <input
                                type="text"
                                value={editingCountry === country.id ? country.name : ''}
                                onChange={(e) => {
                                  setContinentSections(prev =>
                                    prev.map(s =>
                                      s.name === section.name
                                        ? {
                                          ...s,
                                          countries: s.countries.map(c =>
                                            c.id === country.id
                                              ? { ...c, name: e.target.value }
                                              : c
                                          )
                                        }
                                        : s
                                    )
                                  );
                                }}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded"
                                autoFocus
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Globe size={16} className="text-gray-400" />
                                <span className="font-medium">{country.name}</span>
                              </div>
                            )}

                            {/* Toggle Switches */}
                            <div className="flex items-center space-x-4">
                              {/* Toggle Clasifica/Desclasifica */}
                              <div className="flex items-center space-x-2">
                                <span className={`text-sm ${country.isDisqualifying ? 'text-orange-600' : 'text-green-600'}`}>
                                  {country.isDisqualifying ? 'Desclasifica' : 'Clasifica'}
                                </span>
                                <button
                                  onClick={() => handleToggleCountryDisqualifying(section.name, country.id)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${country.isDisqualifying ? 'bg-orange-500' : 'bg-green-500'
                                    }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${country.isDisqualifying ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                  />
                                </button>
                              </div>

                              {/* Toggle Prioritario */}
                              {!country.isDisqualifying && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleToggleCountryPriority(section.name, country.id)}
                                    className={`p-1 rounded transition-colors ${country.isPriority
                                        ? 'text-purple-600 bg-purple-100'
                                        : 'text-gray-400 hover:text-purple-400 hover:bg-purple-50'
                                      }`}
                                    title={country.isPriority ? 'Quitar prioridad' : 'Marcar como prioritario'}
                                  >
                                    <Star size={18} fill={country.isPriority ? 'currentColor' : 'none'} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Botones de acción */}
                          <div className="flex items-center space-x-2">
                            {country.isEditing ? (
                              <>
                                <button
                                  onClick={() => handleEditSave(section.name, country.id, country.name)}
                                  className="p-1 text-green-600 hover:text-green-800"
                                  title="Guardar"
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  onClick={() => handleEditCancel(section.name, country.id)}
                                  className="p-1 text-gray-600 hover:text-gray-800"
                                  title="Cancelar"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditStart(section.name, country.id)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                  title="Editar"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCountry(section.name, country.id)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="Eliminar"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Nota importante */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">Nota:</h4>
              <p className="text-blue-700 text-sm space-y-1">
                <span className="block">• Los países marcados como "Clasifica" se mostrarán a los participantes para seleccionar.</span>
                <span className="block">• Los países marcados como "Desclasifica" excluirán automáticamente a los participantes de esos países.</span>
                <span className="block">• Los países con <Star size={14} className="inline text-purple-600" fill="currentColor" /> <strong>estrella (prioritarios)</strong> tendrán preferencia en el reclutamiento.</span>
                <span className="block">• Puedes excluir continentes completos y luego exceptuar países específicos dentro de ellos.</span>
                <span className="block">• Debes mantener al menos un país que clasifique.</span>
              </p>
            </div>

            {/* Validación */}
            {validCountriesCount === 0 && totalCountries > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 text-sm">
                  ⚠️ Debes tener al menos un país que clasifique para que los participantes puedan participar.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* 🎯 NUEVA SECCIÓN: CONFIGURACIÓN DE CUOTAS */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Sistema de Cuotas por País</h3>
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
                    Configura cuotas específicas por país. Cuando se alcance la cuota de un país,
                    los participantes de ese país serán descalificados automáticamente.
                  </p>

                  {/* Lista de cuotas */}
                  <div className="space-y-3 mb-4">
                    {quotas.map((quota) => (
                      <div
                        key={quota.id}
                        className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          {/* País */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              País
                            </label>
                            <input
                              type="text"
                              value={quota.country}
                              onChange={(e) => handleUpdateQuota(quota.id, 'country', e.target.value)}
                              placeholder="ej: España"
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
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Agregar nueva cuota */}
                  <button
                    onClick={handleAddQuota}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Globe size={16} />
                    <span>Agregar nueva cuota</span>
                  </button>

                  {/* Información sobre cuotas */}
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2">💡 Cómo funcionan las cuotas:</h4>
                    <ul className="text-yellow-700 text-sm space-y-1">
                      <li>• Cada país puede tener su propia cuota</li>
                      <li>• El sistema automáticamente contará los participantes que se registren</li>
                      <li>• Cuando se alcance la cuota, los participantes de ese país serán descalificados automáticamente</li>
                      <li>• Las cuotas inactivas no afectan la descalificación</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Globe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>Habilita el sistema de cuotas para configurar límites por país</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={validCountriesCount === 0}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guardar configuración
          </button>
        </div>
      </div>
    </div>
  );
};

export default CountryConfigModal;
