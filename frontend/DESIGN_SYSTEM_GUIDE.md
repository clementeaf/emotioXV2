# 🎨 Guía del Sistema de Diseño Frontend

## 📋 Resumen

Este sistema de diseño implementa la misma elegante interfaz de usuario del proyecto `public-tests`, proporcionando:

- **Layout con sidebar lateral** para navegación y progreso
- **Formularios centrados** con diseño consistente
- **Sistema de espaciado estandarizado**
- **Componentes reutilizables** para diferentes tipos de formularios

---

## 🏗️ Componentes Principales

### 1. **StudyLayout** - Layout Principal

El componente base que proporciona la estructura con sidebar lateral y área de contenido centrada.

```tsx
import { StudyLayout } from '@/components/layout/StudyLayout';

function MyStudyPage() {
  const steps = [
    { id: 'welcome', name: 'Bienvenida', type: 'welcome', completed: true },
    { id: 'survey', name: 'Encuesta', type: 'survey', completed: false },
    { id: 'thanks', name: 'Gracias', type: 'thankyou', completed: false }
  ];

  return (
    <StudyLayout
      researchId="research-123"
      sidebarSteps={steps}
      currentStepIndex={1}
      onNavigateToStep={(index) => console.log('Navegando a', index)}
      showProgressBar={true}
    >
      {/* Tu contenido aquí */}
    </StudyLayout>
  );
}
```

#### Props de StudyLayout:
- `researchId` - ID del estudio (se muestra en el footer del sidebar)
- `sidebarSteps` - Array de pasos para mostrar en el sidebar
- `currentStepIndex` - Índice del paso actual (0-based)
- `onNavigateToStep` - Callback para navegación
- `showProgressBar` - Mostrar barra de progreso en la parte superior
- `className` - Clases CSS adicionales

---

### 2. **FormCard** - Contenedor de Formularios

Proporciona el recuadro centrado con sombra para formularios, similar al diseño de `public-tests`.

```tsx
import { FormCard } from '@/components/layout/FormCard';

function MySurveyForm() {
  return (
    <FormCard 
      title="Encuesta de Satisfacción"
      description="Ayúdanos a mejorar nuestro servicio"
      variant="centered"
      showProgress={true}
      currentStep={2}
      totalSteps={5}
    >
      {/* Contenido del formulario */}
      <div className="space-y-4">
        <input type="text" placeholder="Tu nombre" />
        <button className="w-full bg-indigo-600 text-white py-2 rounded">
          Continuar
        </button>
      </div>
    </FormCard>
  );
}
```

#### Props de FormCard:
- `title` - Título del formulario
- `description` - Descripción/subtítulo
- `variant` - `'default' | 'centered' | 'wide'`
- `showProgress` - Mostrar indicador de progreso interno
- `currentStep/totalSteps` - Para calcular progreso

---

### 3. **StudySidebar** - Barra Lateral de Progreso

Sidebar elegante que muestra el progreso del estudio con estados visuales.

#### Características:
- ✅ **Estados visuales**: Completado (verde), Actual (azul), Pendiente (gris)
- ✅ **Navegación inteligente**: Solo permite navegar a pasos completados o actuales
- ✅ **Responsive**: Se colapsa en móviles
- ✅ **Progreso visual**: Contador y barra de progreso
- ✅ **Info contextual**: ID del estudio en el footer

---

## 🎨 Utilidades de Estilo

### formHelpers.ts

Proporciona utilidades consistentes para todos los formularios:

```tsx
import { 
  getFormContainerClass, 
  formSpacing,
  getStandardButtonText,
  getButtonDisabledState,
  getErrorDisplayProps 
} from '@/utils/formHelpers';

function MyForm() {
  return (
    <div className={getFormContainerClass('centered')}>
      <h2 className={`text-xl font-medium ${formSpacing.field}`}>
        Título del Formulario
      </h2>
      
      <div className={formSpacing.section}>
        {/* Contenido del formulario */}
      </div>
      
      <button 
        className={`bg-indigo-600 text-white ${formSpacing.button}`}
        disabled={getButtonDisabledState({
          isRequired: true,
          value: formValue,
          isSaving: loading
        })}
      >
        {getStandardButtonText({
          isSaving: loading,
          hasExistingData: !!existingData
        })}
      </button>
    </div>
  );
}
```

#### Espaciado Estandarizado:
```tsx
export const formSpacing = {
  section: 'mb-8',    // Separación entre secciones
  field: 'mb-4',      // Separación entre campos
  label: 'mb-2',      // Separación de labels
  error: 'mt-2',      // Separación de errores
  button: 'mt-6',     // Separación de botones
  scaleGap: 'gap-2',  // Espaciado para escalas
  scaleLabels: 'mt-2 px-1' // Labels de escalas
};
```

---

## 📊 Ejemplos de Uso

### Ejemplo 1: Formulario de Encuesta Simple

```tsx
import { StudyLayout } from '@/components/layout/StudyLayout';
import { FormCard } from '@/components/layout/FormCard';
import { formSpacing, getStandardButtonText } from '@/utils/formHelpers';

function SurveyForm() {
  const [rating, setRating] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    { id: 'intro', name: 'Introducción', type: 'welcome', completed: true },
    { id: 'survey', name: 'Encuesta', type: 'survey', completed: false }
  ];

  return (
    <StudyLayout
      researchId="survey-2024-001"
      sidebarSteps={steps}
      currentStepIndex={1}
      showProgressBar={true}
    >
      <FormCard 
        title="Califica nuestro servicio"
        description="Tu opinión es muy importante para nosotros"
      >
        <div className={formSpacing.section}>
          <label className={`block text-sm font-medium ${formSpacing.label}`}>
            ¿Cómo calificarías nuestro servicio?
          </label>
          
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(num => (
              <label key={num} className="flex items-center">
                <input
                  type="radio"
                  name="rating"
                  value={num}
                  checked={rating === String(num)}
                  onChange={(e) => setRating(e.target.value)}
                  className="mr-3 text-indigo-600"
                />
                <span>{num} estrella{num > 1 ? 's' : ''}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={() => console.log('Enviar:', rating)}
          disabled={!rating || isLoading}
          className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 ${formSpacing.button}`}
        >
          {getStandardButtonText({
            isSaving: isLoading,
            hasExistingData: false
          })}
        </button>
      </FormCard>
    </StudyLayout>
  );
}
```

### Ejemplo 2: Formulario con Múltiples Pasos

```tsx
function MultiStepStudy() {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { id: 'demo', name: 'Datos Demográficos', type: 'demographic', completed: false },
    { id: 'preferences', name: 'Preferencias', type: 'survey', completed: false },
    { id: 'feedback', name: 'Comentarios', type: 'feedback', completed: false }
  ];

  const handleNext = () => {
    // Marcar paso actual como completado
    steps[currentStep].completed = true;
    
    // Avanzar al siguiente paso
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <StudyLayout
      researchId="multi-step-study"
      sidebarSteps={steps}
      currentStepIndex={currentStep}
      onNavigateToStep={setCurrentStep}
      showProgressBar={true}
    >
      {currentStep === 0 && (
        <FormCard title="Datos Demográficos">
          {/* Formulario de datos demográficos */}
        </FormCard>
      )}
      
      {currentStep === 1 && (
        <FormCard title="Tus Preferencias">
          {/* Formulario de preferencias */}
        </FormCard>
      )}
      
      {currentStep === 2 && (
        <FormCard title="Comentarios Finales">
          {/* Formulario de comentarios */}
        </FormCard>
      )}
    </StudyLayout>
  );
}
```

---

## 🎯 Mejores Prácticas

### 1. **Consistencia Visual**
- Siempre usa `FormCard` para contenedores de formularios
- Aplica `formSpacing` para espaciado consistente
- Usa los colores estandarizados (indigo para primario)

### 2. **Estados de Carga**
- Usa `getStandardButtonText()` para textos de botones consistentes
- Implementa `getButtonDisabledState()` para manejo de estados
- Muestra indicadores de progreso apropiados

### 3. **Navegación**
- Permite navegación solo a pasos válidos
- Marca pasos como completados apropiadamente
- Proporciona feedback visual claro del estado actual

### 4. **Responsive Design**
- El sidebar se colapsa automáticamente en móviles
- Los formularios se adaptan a diferentes tamaños de pantalla
- Usa el overlay en móviles para el sidebar

---

## 🔄 Migración desde Componentes Existentes

Para migrar formularios existentes al nuevo sistema:

1. **Envuelve en StudyLayout**:
   ```tsx
   // Antes
   <div className="container mx-auto">
     <MyForm />
   </div>
   
   // Después  
   <StudyLayout sidebarSteps={steps}>
     <FormCard>
       <MyForm />
     </FormCard>
   </StudyLayout>
   ```

2. **Reemplaza contenedores manuales**:
   ```tsx
   // Antes
   <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow">
   
   // Después
   <FormCard>
   ```

3. **Usa utilidades de espaciado**:
   ```tsx
   // Antes
   <div className="mb-6">
   
   // Después
   <div className={formSpacing.section}>
   ```

---

## 📱 Responsive Breakpoints

El sistema responde a estos breakpoints:

- **Mobile**: `< 1024px` - Sidebar colapsado
- **Desktop**: `>= 1024px` - Sidebar fijo lateral

---

## 🎨 Personalización de Colores

Los colores principales están definidos en Tailwind:

- **Primary**: `indigo-600` (botones, elementos activos)
- **Success**: `green-600` (elementos completados)
- **Neutral**: `neutral-*` (textos, bordes)

Para personalizar, modifica tu `tailwind.config.ts`:

```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          600: '#your-color'
        }
      }
    }
  }
}
``` 