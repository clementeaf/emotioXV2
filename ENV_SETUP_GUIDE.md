# 🚀 GUÍA DE CONFIGURACIÓN DE VARIABLES DE ENTORNO

## 📋 **CONFIGURACIÓN RÁPIDA**

### **🏠 DESARROLLO LOCAL**

#### **1. Frontend (Next.js)**
```bash
cd frontend
cp .env.example .env.local
# ✅ Ya configurado para desarrollo local
```

#### **2. Public-tests (Vite)**
```bash
cd public-tests
cp .env.example .env.local
# ✅ Ya configurado para desarrollo local
```

#### **3. Backend (Serverless)**
```bash
cd backendV2
cp .env.example .env.local
# ✅ Configurar según necesidades
```

### **🌐 PRODUCCIÓN**

#### **1. Frontend (Next.js)**
```bash
cd frontend
cp .env.production .env.local
# ✅ Configurado para producción
```

#### **2. Public-tests (Vite)**
```bash
cd public-tests
cp .env.production .env.local
# ✅ Configurado para producción
```

## 🎯 **LÓGICA DE DETECCIÓN AUTOMÁTICA**

### **FRONTEND → PUBLIC-TESTS**
```typescript
// ✅ DETECCIÓN AUTOMÁTICA
const isDevelopment = window.location.hostname === 'localhost';
const publicTestsUrl = isDevelopment 
  ? 'http://localhost:5173'  // 🏠 DESARROLLO
  : 'https://d35071761848hm.cloudfront.net'; // 🌐 PRODUCCIÓN
```

### **PUBLIC-TESTS → BACKEND**
```typescript
// ✅ DETECCIÓN AUTOMÁTICA
const isDevelopment = import.meta.env.DEV;
const apiUrl = isDevelopment 
  ? 'http://localhost:3001'  // 🏠 DESARROLLO
  : 'https://h68qs1et9j.execute-api.us-east-1.amazonaws.com/dev'; // 🌐 PRODUCCIÓN
```

## 🔄 **FLUJO DE DESARROLLO**

### **🏠 DESARROLLO LOCAL**
1. **Frontend:** `localhost:3000`
2. **Public-tests:** `localhost:5173`
3. **Backend:** `localhost:3001` (opcional)
4. **Resultado:** Frontend local → Public-tests local ✅

### **🌐 PRODUCCIÓN**
1. **Frontend:** Desplegado en S3/CloudFront
2. **Public-tests:** Desplegado en S3/CloudFront
3. **Backend:** AWS Lambda
4. **Resultado:** Frontend desplegado → Public-tests desplegado ✅

## ✅ **BENEFICIOS**

1. **🎯 Sin conflictos:** Cada proyecto maneja sus variables
2. **🔄 Automático:** Detección de entorno sin configuración manual
3. **📱 Local:** Funciona perfectamente en desarrollo
4. **🌐 Producción:** Configuración específica para cada entorno
5. **📋 Documentado:** Plantillas claras para cada proyecto

## 🚫 **PROBLEMAS RESUELTOS**

- ❌ **Antes:** `.env` global causaba conflictos
- ❌ **Antes:** URLs inconsistentes entre proyectos
- ❌ **Antes:** Configuración manual compleja
- ✅ **Ahora:** Jerarquía clara y automática
- ✅ **Ahora:** URLs consistentes
- ✅ **Ahora:** Configuración automática por entorno
