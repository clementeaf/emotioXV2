# 🏗️ ESTÁNDARES DE CÓDIGO - EmotioXV2

## 📋 PRINCIPIOS FUNDAMENTALES

### SOLID
- **S**ingle Responsibility: Una clase/función = una responsabilidad
- **O**pen/Closed: Abierto a extensión, cerrado a modificación
- **L**iskov Substitution: Subtipos deben ser sustituibles por sus tipos base
- **I**nterface Segregation: Interfaces específicas > interfaces generales
- **D**ependency Inversion: Depender de abstracciones, no de concreciones

### DRY (Don't Repeat Yourself)
- Eliminar duplicación de código
- Crear funciones/hooks reutilizables
- Centralizar configuraciones y constantes

### KISS (Keep It Simple, Stupid)
- Soluciones simples sobre complejas
- Evitar over-engineering
- Código autodocumentado

### YAGNI (You Aren't Gonna Need It)
- Implementar solo lo necesario
- No anticipar funcionalidades futuras
- Refactorizar cuando sea realmente necesario

---

## 🔒 ESTÁNDARES OBLIGATORIOS

### TypeScript Estricto
```typescript
// ❌ NUNCA
const data: any = response;
function process(item: any): any { }

// ✅ SIEMPRE
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

const data: ApiResponse<UserData> = response;
function processUser(user: User): ProcessedUser { }
```

### Límite de Líneas
- **200 líneas máximo** por archivo
- Si excede → dividir en módulos más pequeños
- Separar lógica en hooks/utils específicos

### Nomenclatura
```typescript
// Interfaces: PascalCase con 'I' prefix opcional
interface UserData { }
interface IApiResponse<T> { }

// Tipos: PascalCase
type RequestStatus = 'loading' | 'success' | 'error';

// Funciones/Variables: camelCase
const getUserData = () => { };
const isLoading = false;

// Constantes: SCREAMING_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_ENDPOINTS = { };
```

---

## 🏗️ ARQUITECTURA DE ARCHIVOS

### Estructura por Responsabilidad
```
src/
├── hooks/           # Lógica de estado reutilizable
├── services/        # Llamadas API y lógica de negocio
├── types/           # Definiciones TypeScript
├── utils/           # Funciones auxiliares puras
├── components/      # Componentes UI (max 200 líneas)
└── config/          # Configuraciones centralizadas
```

### Separación de Concerns
- **Hooks**: Lógica de estado y efectos
- **Services**: Comunicación con APIs
- **Components**: Solo UI y interacciones
- **Utils**: Funciones puras sin efectos secundarios
- **Types**: Definiciones de tipos centralizadas

---

## 🔧 MIGRACIÓN A ALOVA.JS

### Patrón de Migración
```typescript
// ❌ ANTES (fetch + custom hooks)
export const useResearchData = () => {
  const [data, setData] = useState<any>(null);
  
  useEffect(() => {
    fetch('/api/research')
      .then(res => res.json())
      .then(setData);
  }, []);
  
  return { data };
};

// ✅ DESPUÉS (AlovaJS)
interface ResearchData {
  id: string;
  title: string;
  status: ResearchStatus;
}

export const useResearchData = () => {
  return useRequest(
    alovaInstance.Get<ResearchData[]>('/research'),
    {
      initialData: [],
    }
  );
};
```

### Estructura de Services
```typescript
// services/researchService.ts (max 200 líneas)
import { alovaInstance } from '../config/alova.config';
import type { Research, CreateResearchRequest } from '../types/research';

export const researchMethods = {
  getAll: () => alovaInstance.Get<Research[]>('/research'),
  getById: (id: string) => alovaInstance.Get<Research>(`/research/${id}`),
  create: (data: CreateResearchRequest) => 
    alovaInstance.Post<Research>('/research', data),
  update: (id: string, data: Partial<Research>) => 
    alovaInstance.Put<Research>(`/research/${id}`, data),
  delete: (id: string) => alovaInstance.Delete(`/research/${id}`)
};
```

---

## 🚫 ANTI-PATRONES PROHIBIDOS

### Tipos
```typescript
// ❌ NUNCA
const data: any = {};
function process(item: any): any { }
const result = data as any;

// ❌ NUNCA
interface Props {
  [key: string]: any;
}
```

### Archivos Grandes
```typescript
// ❌ NUNCA: Un archivo de 500 líneas
// ✅ SIEMPRE: Dividir en módulos de <200 líneas
```

### Duplicación
```typescript
// ❌ NUNCA: Misma lógica en múltiples lugares
// ✅ SIEMPRE: Extraer a hook/util reutilizable
```

### Side Effects en Componentes
```typescript
// ❌ NUNCA: fetch directo en componentes
const Component = () => {
  useEffect(() => {
    fetch('/api/data').then(/* ... */);
  }, []);
};

// ✅ SIEMPRE: Usar hooks especializados
const Component = () => {
  const { data } = useResearchData();
};
```

---

## 📏 MÉTRICAS DE CALIDAD

### Obligatorias
- ✅ **0 errores ESLint**
- ✅ **0 warnings TypeScript**
- ✅ **0 usos de `any`**
- ✅ **<200 líneas por archivo**
- ✅ **100% funciones tipadas**

### Deseables
- 🎯 **Cobertura tests >80%**
- 🎯 **Tiempo build <30s**
- 🎯 **Bundle size optimizado**

---

## 🔄 PROCESO DE MIGRACIÓN

### 1. Análisis
- Identificar archivos con fetch/any
- Mapear dependencias
- Definir interfaces TypeScript

### 2. Preparación  
- Crear tipos estrictos
- Definir métodos AlovaJS
- Preparar hooks de migración

### 3. Migración
- Un archivo a la vez
- Mantener funcionalidad
- Tests antes/después

### 4. Limpieza
- Eliminar código duplicado
- Optimizar imports
- Validar estándares

### 5. Validación
- ESLint clean
- TypeScript strict
- Funcionalidad intacta

---

## 🎯 CHECKLIST PRE-COMMIT

- [ ] Cero `any` types
- [ ] Archivo <200 líneas
- [ ] ESLint sin warnings
- [ ] TypeScript strict
- [ ] Interfaces bien definidas
- [ ] Single responsibility
- [ ] No duplicación de código
- [ ] Imports organizados
- [ ] Nomenclatura consistente
- [ ] Funcionalidad probada

---

**Este documento es ley. Todo código debe cumplir estos estándares.**