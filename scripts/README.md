# 🛠️ Scripts de Calidad - EmotioXV2

## 🎯 Descripción

Este directorio contiene scripts automatizados para mantener la calidad del código y facilitar el desarrollo siguiendo nuestros estándares estrictos.

---

## 📋 Scripts Disponibles

### 🔍 `check-quality.sh`
**Script principal de verificación de calidad**

```bash
# Ejecutar desde la raíz del proyecto
./scripts/check-quality.sh

# O usar el alias npm
npm run quality-check
```

**¿Qué hace?**
- ✅ Compilación TypeScript en todos los proyectos
- ✅ Linting con ESLint
- ✅ Build de todos los proyectos  
- ✅ Verificación de tipos `any`/`unknown` prohibidos
- ✅ Validación de estructura Clean Architecture
- ✅ Ejecución de tests
- ✅ Auditoría de seguridad

**Output esperado:**
```
🚀 Starting EmotioXV2 Quality Check...
================================================
📝 Checking TypeScript compilation...
✅ backendV2 TypeScript compilation
✅ frontend TypeScript compilation
✅ shared TypeScript compilation
✅ public-tests TypeScript compilation

🔍 Running linters...
✅ backendV2 linting
✅ frontend linting
✅ shared linting
✅ public-tests linting

🏗️ Building projects...
✅ backendV2 build
✅ frontend build
✅ shared build
✅ public-tests build

🚫 Checking for prohibited any/unknown types...
✅ No prohibited 'any' types found
✅ No prohibited 'unknown' types found

🏗️ Validating Clean Architecture...
✅ backendV2 structure validated
✅ frontend structure validated
✅ shared structure validated
✅ public-tests structure validated

🎉 ALL QUALITY CHECKS PASSED!
```

---

## 🚀 Scripts NPM Disponibles

### Scripts Individuales
```bash
# Verificación de tipos en todos los proyectos
npm run check-types-all

# Linting en todos los proyectos
npm run lint-all

# Build en todos los proyectos
npm run build-all

# Verificar tipos 'any' prohibidos
npm run check-no-any

# Verificar tipos 'unknown' prohibidos
npm run check-no-unknown

# Script completo de calidad
npm run quality-check

# Test del pre-commit hook
npm run pre-commit-test
```

### Scripts por Proyecto
```bash
# Backend
cd backendV2
npm run lint
npm run lint -- --fix
npx tsc --noEmit
npx tsc
npm test

# Frontend
cd frontend
npm run lint
npm run lint -- --fix
npm run build
npm test

# Shared
cd shared
npm run lint
npm run lint -- --fix
npx tsc --noEmit
npx tsc

# Public-tests
cd public-tests
npm run lint
npm run lint -- --fix
npm run build
npm test
```

---

## ⚡ Workflow de Desarrollo

### 🔄 Flujo Recomendado

#### 1. **Antes de comenzar a codear**
```bash
# Actualizar desde develop/main
git checkout develop
git pull origin develop

# Crear nueva branch
git checkout -b feature/nueva-funcionalidad

# Verificar estado inicial
npm run quality-check
```

#### 2. **Durante el desarrollo**
```bash
# Verificaciones rápidas
npm run check-no-any
npm run check-no-unknown

# Verificación completa periódica
npm run quality-check
```

#### 3. **Antes de commit**
```bash
# El pre-commit hook se ejecuta automáticamente
# Pero puedes probarlo manualmente:
npm run pre-commit-test

# O ejecutar verificación completa
npm run quality-check
```

#### 4. **Antes de crear PR**
```bash
# Verificación final completa
npm run quality-check

# Si todo está ✅, proceder:
git push origin feature/nueva-funcionalidad
```

---

## 🚫 Casos de Fallo Común

### ❌ Error: Tipos `any` encontrados
```bash
❌ FOUND PROHIBITED 'any' TYPES!
./src/services/auth.service.ts:42:const data: any = response;
```

**Solución:**
```typescript
// ❌ Malo
const data: any = response;

// ✅ Correcto
interface ApiResponse {
  data: UserData;
  status: number;
}
const data: ApiResponse = response;
```

### ❌ Error: TypeScript compilation failed
```bash
❌ backendV2 TypeScript compilation
src/services/user.service.ts(15,7): error TS2339: Property 'name' does not exist on type '{}'.
```

**Solución:**
- Revisar errores de TypeScript mostrados
- Agregar tipos específicos
- Ejecutar `npx tsc --noEmit` para más detalles

### ❌ Error: Linting failed
```bash
❌ frontend linting
src/components/UserForm.tsx
  15:7  error  'user' is assigned a value but never used
```

**Solución:**
```bash
# Auto-fix de problemas de linting
cd frontend && npm run lint -- --fix
```

### ❌ Error: Build failed
```bash
❌ frontend build
Error: Missing dependency 'react-router-dom'
```

**Solución:**
```bash
# Instalar dependencias faltantes
cd frontend && npm install
```

---

## 🏗️ Estructura de Carpetas Validada

El script verifica automáticamente que exista esta estructura:

```
proyecto/
├── src/
│   ├── types/        # ✅ OBLIGATORIO
│   └── utils/        # ✅ OBLIGATORIO
├── package.json      # ✅ OBLIGATORIO
└── tsconfig.json     # ✅ OBLIGATORIO
```

### Directorios Adicionales (Recomendados)
```
src/
├── types/           # Tipos específicos
├── utils/           # Utilidades puras
├── services/        # Lógica de negocio
├── controllers/     # Controladores (backend)
├── components/      # Componentes (frontend)
├── hooks/           # Custom hooks (frontend)
├── interfaces/      # Contratos y abstracciones
└── config/          # Configuración
```

---

## 🚨 Troubleshooting

### Script no ejecuta
```bash
chmod +x scripts/check-quality.sh
```

### Husky hooks no funcionan
```bash
npx husky install
chmod +x .husky/pre-commit
```

### NPM scripts fallan
```bash
# Verificar que estás en el directorio raíz
pwd  # Debe mostrar .../emotioXV2

# Instalar dependencias
npm install
```

### Performance lenta
```bash
# Para desarrollo, puedes saltarte el build de frontend:
# Comentar esta línea en el script:
# cd ../frontend && npm run build > /dev/null 2>&1 || exit 1
```

---

## 📊 Métricas de Rendimiento

### Tiempos Objetivo
- **TypeScript check**: < 5s por proyecto
- **Linting**: < 3s por proyecto
- **Build backend**: < 20s
- **Build frontend**: < 30s
- **Script completo**: < 2 minutos

### Optimizaciones
- Builds en paralelo cuando sea posible
- Cache de TypeScript
- ESLint cache
- Skip tests opcionales en desarrollo

---

## 🔧 Personalización

### Modificar verificaciones
Editar `scripts/check-quality.sh`:

```bash
# Saltar tests en desarrollo
# cd backendV2 && npm test || echo "⚠️ Backend tests not configured or failed"

# Agregar verificaciones custom
echo "🔒 Checking for secrets..."
grep -r "api_key\|password\|secret" --exclude-dir=node_modules . || echo "✅ No hardcoded secrets"
```

### Configurar exclusiones
Para tipos `any`/`unknown` legítimos:

```bash
# En el script, agregar a las exclusiones:
grep -v "//.*any\|legitimate-file.ts"
```

---

## 📈 Integraciones

### VSCode
Agregar a `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Quality Check",
      "type": "shell",
      "command": "npm run quality-check",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always"
      }
    }
  ]
}
```

### GitHub Actions
Los mismos checks se ejecutan automáticamente en CI/CD.

### Pre-commit Hook
Se ejecuta automáticamente en cada commit.

---

**Fecha**: 2025-01-05  
**Versión**: 1.0  
**Mantenedor**: Equipo EmotioXV2