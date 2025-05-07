import { config } from '../config/env';

// Interfaces
interface Participant {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

// Función para obtener el token
const getToken = (): string => {
  const token = localStorage.getItem('participantToken');
  if (!token) {
    throw new Error('No hay token disponible');
  }
  return token;
};

// Función para hacer peticiones con manejo de errores
const fetchWithAuth = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  console.log(`🔍 Iniciando petición a ${endpoint}`);
  
  const token = getToken();
  const url = `${config.apiUrl}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    console.log(`🌐 URL: ${url}`);
    console.log('📤 Opciones:', { ...defaultOptions, ...options });

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
    });

    console.log(`📨 Status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 Respuesta:', data);
    return data;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
};

// Funciones para probar los endpoints

// 1. Crear un participante
export const testCreateParticipant = async (name: string, email: string): Promise<void> => {
  console.log('🧪 Probando crear participante...');
  try {
    const response = await fetchWithAuth<Participant>('/participants', {
      method: 'POST',
      body: JSON.stringify({ name, email }),
    });
    console.log('✅ Participante creado:', response.data);
  } catch (error) {
    console.error('❌ Error al crear participante:', error);
  }
};

// 2. Obtener un participante por ID
export const testGetParticipant = async (id: string): Promise<void> => {
  console.log(`🧪 Probando obtener participante ${id}...`);
  try {
    const response = await fetchWithAuth<Participant>(`/participants/${id}`);
    console.log('✅ Participante obtenido:', response.data);
  } catch (error) {
    console.error('❌ Error al obtener participante:', error);
  }
};

// 3. Obtener todos los participantes
export const testGetAllParticipants = async (): Promise<void> => {
  console.log('🧪 Probando obtener todos los participantes...');
  try {
    const response = await fetchWithAuth<Participant[]>('/participants');
    console.log('✅ Participantes obtenidos:', response.data);
  } catch (error) {
    console.error('❌ Error al obtener participantes:', error);
  }
};

// 4. Eliminar un participante
export const testDeleteParticipant = async (id: string): Promise<void> => {
  console.log(`🧪 Probando eliminar participante ${id}...`);
  try {
    await fetchWithAuth<void>(`/participants/${id}`, {
      method: 'DELETE',
    });
    console.log('✅ Participante eliminado');
  } catch (error) {
    console.error('❌ Error al eliminar participante:', error);
  }
};

// 5. Obtener pantalla de bienvenida
export const testGetWelcomeScreen = async (researchId: string): Promise<void> => {
  console.log(`🧪 Probando obtener pantalla de bienvenida para research ${researchId}...`);
  try {
    const response = await fetchWithAuth<any>(`/welcome-screens/research/${researchId}`);
    console.log('✅ Pantalla de bienvenida obtenida:', response.data);
  } catch (error) {
    console.error('❌ Error al obtener pantalla de bienvenida:', error);
  }
};

// Función para ejecutar todas las pruebas
export const runAllTests = async () => {
  console.log('🚀 Iniciando pruebas de API...');

  try {
    // Crear un participante de prueba
    await testCreateParticipant('Usuario Prueba', 'test@example.com');

    // Obtener todos los participantes
    await testGetAllParticipants();

    // Obtener el último participante creado (asumiendo que tenemos el ID)
    const participantId = 'ID_DEL_ULTIMO_PARTICIPANTE';
    await testGetParticipant(participantId);

    // Probar la pantalla de bienvenida
    const researchId = 'ID_DE_INVESTIGACION';
    await testGetWelcomeScreen(researchId);

    // Eliminar el participante de prueba
    await testDeleteParticipant(participantId);

    console.log('✅ Todas las pruebas completadas');
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}; 