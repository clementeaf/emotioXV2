# 🔧 JERARQUÍA DE ARCHIVOS .ENV - EmotioXV2

## 📁 ESTRUCTURA ACTUAL (POST-REORGANIZACIÓN)

### 🏠 **DESARROLLO LOCAL**
```
frontend/.env.local          # Configuración local del frontend
public-tests/.env.local      # Configuración local de public-tests
backendV2/.env.example       # Plantilla para backend
```

### 🌐 **PRODUCCIÓN**
```
public-tests/.env.production # Configuración de producción para public-tests
```

### 📋 **PLANTILLAS**
```
frontend/.env.example        # Plantilla para frontend
public-tests/.env.example    # Plantilla para public-tests
backendV2/.env.example       # Plantilla para backend
```

## 🎯 **JERARQUÍA DE PRIORIDADES**

### **FRONTEND (Next.js)**
1. `frontend/.env.local` (máxima prioridad - desarrollo)
2. `frontend/.env.production` (producción)
3. `frontend/.env.example` (plantilla)

### **PUBLIC-TESTS (Vite)**
1. `public-tests/.env.local` (máxima prioridad - desarrollo)
2. `public-tests/.env.production` (producción)
3. `public-tests/.env.example` (plantilla)

### **BACKEND (Serverless)**
1. `backendV2/.env.local` (desarrollo)
2. `backendV2/.env.production` (producción)
3. `backendV2/.env.example` (plantilla)

## 🔄 **LÓGICA DE DETECCIÓN DE ENTORNO**

### **FRONTEND:**
```typescript
const isDevelopment = window.location.hostname === 'localhost';
const publicTestsUrl = isDevelopment 
  ? 'http://localhost:5173'  // .env.local
  : process.env.NEXT_PUBLIC_PUBLIC_TESTS_URL; // .env.production
```

### **PUBLIC-TESTS:**
```typescript
const isDevelopment = import.meta.env.DEV;
const apiUrl = isDevelopment 
  ? import.meta.env.VITE_API_URL  // .env.local
  : import.meta.env.VITE_API_URL; // .env.production
```

## ✅ **BENEFICIOS DE ESTA JERARQUÍA**

1. **🎯 Separación clara:** Cada proyecto maneja sus propias variables
2. **🔒 Sin conflictos:** No hay archivos .env globales que sobrescriban
3. **📱 Desarrollo local:** Funciona correctamente con localhost
4. **🌐 Producción:** Configuración específica para cada entorno
5. **📋 Plantillas:** .env.example para documentar variables necesarias

## 🚫 **ELIMINADO**
- `.env` (raíz) - Causaba conflictos de jerarquía
- Archivos .env duplicados en frontend/
- Configuraciones inconsistentes

## 🎯 **RESULTADO FINAL**
- **Frontend local** → **Public-tests local** ✅
- **Frontend desplegado** → **Public-tests desplegado** ✅
- **Sin conflictos de variables** ✅
- **Jerarquía clara y documentada** ✅
