// Lista de tareas cognitivas disponibles para la aplicación
import CitySelectionTask from './CitySelectionTask';
import InstructionsTask from './InstructionsTask';
import GenderSelectionTask from './GenderSelectionTask';
import SocialMediaTask from './SocialMediaTask';
import PasswordResetTask from './PasswordResetTask';
import TransactionAuthTask from './TransactionAuthTask';
import PrioritizationTask from './PrioritizationTask';
import NavigationFlowTask from './NavigationFlowTask';

// Tipos para las tareas
export interface TaskDefinition {
  id: string;
  component: React.ComponentType<any>; // Cambiado para aceptar props adicionales
  title: string;
  description?: string;
  props?: Record<string, any>; // Props adicionales para el componente
}

// Lista de tareas cognitivas disponibles
export const TASKS: TaskDefinition[] = [
  {
    id: 'instructions',
    component: InstructionsTask,
    title: 'Instrucciones',
    description: 'Instrucciones para las tareas cognitivas.'
  },
  { 
    id: 'city', 
    component: CitySelectionTask,
    title: 'Selección de Ciudad',
    description: 'Por favor, indica en qué ciudad vives actualmente.'
  },
  {
    id: 'gender',
    component: GenderSelectionTask,
    title: 'Selección de Género',
    description: 'Por favor, indica con qué género te identificas.'
  },
  {
    id: 'social-media',
    component: SocialMediaTask,
    title: 'Redes Sociales',
    description: 'Selecciona las redes sociales donde tienes cuenta.'
  },
  {
    id: 'password-reset',
    component: PasswordResetTask,
    title: 'Recuperación de Contraseña',
    description: 'Simula una recuperación de contraseña.'
  },
  {
    id: 'transaction-text',
    component: TransactionAuthTask,
    title: 'Autorización de Transacción (Texto Corto)',
    description: 'Pregunta de autorización de transacción en formato texto corto.',
    props: { viewFormat: 'text-only' }
  },
  {
    id: 'transaction-longtext',
    component: TransactionAuthTask,
    title: 'Autorización de Transacción (Texto Largo)',
    description: 'Pregunta de autorización de transacción en formato texto largo.',
    props: { viewFormat: 'long-text' }
  },
  {
    id: 'transaction-desktop',
    component: TransactionAuthTask,
    title: 'Autorización de Transacción (Desktop)',
    description: 'Pregunta de autorización de transacción con imagen de desktop.',
    props: { viewFormat: 'desktop-image' }
  },
  {
    id: 'transaction-mobile',
    component: TransactionAuthTask,
    title: 'Autorización de Transacción (Mobile)',
    description: 'Pregunta de autorización de transacción con imagen de móvil.',
    props: { viewFormat: 'mobile-image' }
  },
  {
    id: 'prioritization',
    component: PrioritizationTask,
    title: 'Escala Lineal - Priorización',
    description: 'Prioriza las siguientes opciones según tu preferencia.',
    props: { 
      question: '¿Cómo priorizarías las siguientes opciones?',
      options: ['Opción 1', 'Opción 2', 'Opción 3'] 
    }
  },
  {
    id: 'navigation-flow',
    component: NavigationFlowTask,
    title: 'Flujo de Navegación',
    description: 'Identifica la pantalla correcta según el objetivo indicado.',
    props: {
      title: 'Navegación de flujo - Desktop',
      question: '¿En cuál de las siguientes pantallas encuentras X objetivo?',
      instructions: 'Haz clic en una opción para ver en detalle',
      footerText: 'Revisa todas las pantallas antes de elegir una únicamente'
    }
  },
  // Aquí se pueden añadir más tareas cognitivas a medida que se desarrollen
];

// Utilidades para las tareas
export const getTaskProgress = (currentTaskIndex: number): number => {
  if (currentTaskIndex < 0 || !TASKS.length) return 0;
  
  // Si es la tarea de instrucciones (índice 0), mostramos 0% de progreso
  if (currentTaskIndex === 0) return 0;
  
  // Para las demás tareas, calculamos el progreso sin contar la tarea de instrucciones
  return Math.round(((currentTaskIndex) / (TASKS.length - 1)) * 100);
}; 