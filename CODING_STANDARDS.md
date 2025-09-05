# 🚀 EmotioXV2 - Estándares de Codificación

## ⚠️ PRINCIPIO CERO: TIPADO PERFECTO
> **"Si manejamos todo el backend, ni en public-tests ni en frontend deberíamos tener jamás un `unknown` o `any`, dado que sabemos desde el frontend siempre exactamente qué dato se manejará en todos los escenarios."**

### **🚫 PROHIBICIÓN ABSOLUTA**
```typescript
// ❌ PROHIBIDO - Será rechazado automáticamente en CI/CD
const data: any = response.data;
const user: unknown = payload;
const result = data as any;
function processData(input: any): any { }
```

### **✅ TIPADO OBLIGATORIO**
```typescript
// ✅ CORRECTO - Tipos específicos siempre
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'researcher' | 'user' | 'participant';
}

const response: ApiResponse<User> = await fetchUser();
const user: User = response.data;
```

---

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

---

## ⚡ PRE-COMMIT WORKFLOW OBLIGATORIO

### **Comandos Obligatorios Antes de Commit**

#### 1. **Compilación TypeScript (OBLIGATORIO)**
```bash
# Backend
cd backendV2 && npx tsc --noEmit

# Frontend  
cd frontend && npm run build

# Shared
cd shared && npx tsc --noEmit

# Public-tests
cd public-tests && npx tsc --noEmit
```

#### 2. **Linting y Formateo (OBLIGATORIO)**
```bash
# Backend
cd backendV2 && npm run lint
cd backendV2 && npm run lint -- --fix

# Frontend
cd frontend && npm run lint  
cd frontend && npm run lint -- --fix

# Shared
cd shared && npm run lint
cd shared && npm run lint -- --fix

# Public-tests
cd public-tests && npm run lint
cd public-tests && npm run lint -- --fix
```

#### 3. **Tests (cuando existan)**
```bash
cd backendV2 && npm test
cd frontend && npm test
cd shared && npm test
cd public-tests && npm test
```

### **Setup Pre-commit Hooks**

Instalar Husky:
```bash
npm install --save-dev husky
npx husky install
```

Crear `.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🚀 Running pre-commit checks..."

# TypeScript compilation
echo "📝 Checking TypeScript compilation..."
cd backendV2 && npx tsc --noEmit || exit 1
cd ../frontend && npm run build > /dev/null 2>&1 || exit 1
cd ../shared && npx tsc --noEmit || exit 1
cd ../public-tests && npx tsc --noEmit || exit 1
cd ..

# Linting
echo "🔍 Running linters..."
cd backendV2 && npm run lint || exit 1
cd ../frontend && npm run lint || exit 1
cd ../shared && npm run lint || exit 1
cd ../public-tests && npm run lint || exit 1
cd ..

# Tests
echo "🧪 Running tests..."
cd backendV2 && npm test || exit 1
cd ../frontend && npm test || exit 1
cd ..

echo "✅ All pre-commit checks passed!"
```

---

## 🔄 GITHUB ACTIONS & CI/CD

### **Workflow de CI/CD Obligatorio**

`.github/workflows/ci.yml`:
```yaml
name: EmotioXV2 - CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  typescript-check:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        project: [backendV2, frontend, shared, public-tests]
    
    name: TypeScript Check - ${{ matrix.project }}
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: ${{ matrix.project }}/package-lock.json
    
    - name: Install dependencies
      run: cd ${{ matrix.project }} && npm ci
    
    - name: TypeScript compilation check
      run: cd ${{ matrix.project }} && npx tsc --noEmit
    
    - name: Lint check
      run: cd ${{ matrix.project }} && npm run lint
    
    - name: Run tests
      run: cd ${{ matrix.project }} && npm test
      continue-on-error: ${{ matrix.project == 'frontend' || matrix.project == 'public-tests' }}

  build-verification:
    runs-on: ubuntu-latest
    needs: typescript-check
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Build Backend
      run: cd backendV2 && npm ci && npx tsc
    
    - name: Build Frontend
      run: cd frontend && npm ci && npm run build
    
    - name: Build Shared
      run: cd shared && npm ci && npx tsc
    
    - name: Build Public-tests
      run: cd public-tests && npm ci && npm run build

  type-safety-audit:
    runs-on: ubuntu-latest
    name: "🚫 Prohibir any/unknown"
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Check for prohibited 'any' and 'unknown' types
      run: |
        echo "🔍 Scanning for prohibited 'any' and 'unknown' types..."
        
        # Buscar 'any' types (excluyendo comentarios y node_modules)
        if grep -r ": any\|any\[\]\|any>" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules . | grep -v "//.*any"; then
          echo "❌ FOUND PROHIBITED 'any' TYPES!"
          echo "Please replace with specific types."
          exit 1
        fi
        
        # Buscar 'unknown' types (excluyendo type guards legítimos)
        if grep -r ": unknown\|unknown\[\]\|unknown>" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules . | grep -v "isValidUser\|parseJwt\|//.*unknown"; then
          echo "❌ FOUND PROHIBITED 'unknown' TYPES!"
          echo "Please replace with specific types or use proper type guards."
          exit 1
        fi
        
        echo "✅ No prohibited 'any' or 'unknown' types found!"

  clean-architecture-check:
    runs-on: ubuntu-latest
    name: "🏗️ Clean Architecture Validation"
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Validate file structure
      run: |
        echo "🏗️ Validating Clean Architecture structure..."
        
        # Verificar estructura de carpetas obligatoria
        for project in backendV2 frontend shared public-tests; do
          echo "Checking $project structure..."
          
          if [ ! -d "$project/src/types" ]; then
            echo "❌ Missing required 'types' directory in $project"
            exit 1
          fi
          
          if [ ! -d "$project/src/utils" ]; then
            echo "❌ Missing required 'utils' directory in $project"
            exit 1
          fi
        done
        
        echo "✅ Clean Architecture structure validated!"

  quality-gates:
    runs-on: ubuntu-latest
    needs: [typescript-check, build-verification, type-safety-audit, clean-architecture-check]
    name: "🎯 Quality Gates"
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Quality Summary
      run: |
        echo "🎯 Quality Gates Summary:"
        echo "✅ TypeScript Compilation: PASSED"  
        echo "✅ Linting: PASSED"
        echo "✅ Build: PASSED"
        echo "✅ Type Safety (no any/unknown): PASSED"
        echo "✅ Clean Architecture: PASSED"
        echo ""
        echo "🚀 Ready for production deployment!"
```

---

## 🚫 REGLAS ADICIONALES DE BLOQUEO

### **Commit Message Standards**
```bash
# ✅ CORRECTO
feat: add user authentication with JWT tokens
fix: resolve memory leak in research data processing  
refactor: migrate auth service from fetch to AlovaJS
docs: update API documentation for user endpoints

# ❌ PROHIBIDO
fix stuff
update
changes
wip
```

### **Branch Protection Rules**
- ✅ **main**: Solo PR con review obligatorio
- ✅ **develop**: PR con CI/CD exitoso
- 🚫 **Commits directos a main/develop**: PROHIBIDOS

### **Pull Request Requirements**
- ✅ CI/CD pipeline exitoso (verde)
- ✅ Code review de al menos 1 desarrollador
- ✅ 0 errores TypeScript  
- ✅ 0 warnings ESLint
- ✅ 0 tipos `any` o `unknown`
- ✅ Descripción clara de los cambios

---

## 🎯 CHECKLIST COMPLETO PRE-COMMIT

### **Antes de hacer `git add`**
- [ ] Código cumple principio de responsabilidad única
- [ ] No hay tipos `any` ni `unknown` (excepto type guards)
- [ ] Todas las interfaces están completas y específicas
- [ ] Funciones tienen nombres descriptivos
- [ ] No hay código comentado o duplicado
- [ ] Importaciones organizadas y optimizadas

### **Antes de hacer `git commit`**
- [ ] `npx tsc --noEmit` pasa en todos los proyectos
- [ ] `npm run lint` pasa sin errores ni warnings
- [ ] `npm run build` exitoso en todos los proyectos
- [ ] Tests unitarios pasan (cuando aplique)
- [ ] Commit message sigue convención
- [ ] Branch actualizado con develop/main

### **Antes de hacer `git push`**
- [ ] Pre-commit hooks ejecutados exitosamente
- [ ] No archivos sensibles incluidos (.env, secrets, etc.)
- [ ] README actualizado si es necesario
- [ ] Pull Request template completo

---

## 🏆 MÉTRICAS DE CALIDAD CONTINUA

### **Objetivos de Rendimiento**
- 🎯 **TypeScript Compilation**: < 5 segundos por proyecto
- 🎯 **Linting**: < 3 segundos por proyecto  
- 🎯 **Build Frontend**: < 30 segundos
- 🎯 **Build Backend**: < 20 segundos
- 🎯 **CI/CD Pipeline**: < 5 minutos total

### **Métricas de Código**
- 🎯 **Cobertura de Tests**: > 80% (cuando aplique)
- 🎯 **Archivos > 200 líneas**: 0
- 🎯 **Funciones > 50 líneas**: 0
- 🎯 **Complejidad ciclomática**: < 10
- 🎯 **Duplicación de código**: < 3%

### **Monitoreo Automático**
- GitHub Actions reporta métricas en cada PR
- Dashboard de calidad actualizado automáticamente
- Alertas automáticas si métricas empeoran
- Reporte semanal de evolución de código

---

## 🔒 ENFORCEMENT (CUMPLIMIENTO OBLIGATORIO)

### **Automatización**
- ❌ **Commits con `any/unknown`**: Bloqueados automáticamente
- ❌ **PRs con errores TypeScript**: No se pueden mergear
- ❌ **Builds fallidos**: Deploy automáticamente cancelado
- ❌ **Lint warnings**: CI/CD falla hasta resolución

### **Consecuencias**
- 🚨 **1era violación**: Warning y retraso de merge
- 🚨 **2da violación**: Review obligatorio adicional  
- 🚨 **3ra violación**: Capacitación obligatoria en estándares
- 🚨 **Violación crítica**: Rollback automático de cambios

---

**Este documento es LEY. Todo código debe cumplir estos estándares.**

**Fecha de Actualización**: 2025-01-05  
**Versión**: 2.0  
**Estado**: ✅ Activo y Aplicado Automáticamente