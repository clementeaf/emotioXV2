# 🚀 Scripts de Deployment Organizados - EmotioXV2

## 📁 Estructura de Scripts

### 🎯 **Scripts Principales (Uso Diario)**

#### **1. `deploy-frontend.sh`** ⚡ **RÁPIDO**
```bash
bash scripts/deploy/deploy-frontend.sh
```
- **Tiempo:** 3-4 minutos
- **Función:** Deploy del frontend a S3/CloudFront
- **Uso:** Cuando solo cambias código del frontend

#### **2. `deploy-public-tests.sh`** ⚡ **RÁPIDO**
```bash
bash scripts/deploy/deploy-public-tests.sh
```
- **Tiempo:** 2-3 minutos
- **Función:** Deploy de public-tests a S3/CloudFront
- **Uso:** Cuando solo cambias código de public-tests

#### **3. `deploy-both.sh`** 🚀 **COMPLETO**
```bash
bash scripts/deploy/deploy-both.sh
```
- **Tiempo:** 5-6 minutos
- **Función:** Deploy de ambos frontends
- **Uso:** Cuando cambias ambos o necesitas sincronización

### 🔧 **Scripts de Configuración**

#### **4. `setup-env.sh`** ⚙️
```bash
bash scripts/deploy/setup-env.sh
```
- **Función:** Configura variables de entorno
- **Uso:** Primera vez o cuando cambias URLs

#### **5. `validate-deployment.sh`** ✅
```bash
bash scripts/deploy/validate-deployment.sh
```
- **Función:** Valida que el deployment fue exitoso
- **Uso:** Después de cualquier deployment

### 📊 **Scripts de Información**

#### **6. `show-urls.sh`** 📋
```bash
bash scripts/deploy/show-urls.sh
```
- **Función:** Muestra todas las URLs activas
- **Uso:** Para verificar dónde está desplegado

## 🎯 **Flujo de Trabajo Recomendado**

### **Para cambios en Frontend:**
```bash
bash scripts/deploy/deploy-frontend.sh
```

### **Para cambios en Public-Tests:**
```bash
bash scripts/deploy/deploy-public-tests.sh
```

### **Para cambios en ambos:**
```bash
bash scripts/deploy/deploy-both.sh
```

### **Para verificar URLs:**
```bash
bash scripts/deploy/show-urls.sh
```

## ⚡ **Comandos Ultra-Rápidos**

### **Deploy Frontend (1 comando):**
```bash
bash scripts/deploy/deploy-frontend.sh
```

### **Deploy Public-Tests (1 comando):**
```bash
bash scripts/deploy/deploy-public-tests.sh
```

### **Deploy Ambos (1 comando):**
```bash
bash scripts/deploy/deploy-both.sh
```

## 🔧 **Configuración**

Los scripts usan las siguientes configuraciones por defecto:

- **Frontend Bucket:** `emotioxv2-frontend-bucket`
- **Public-Tests Bucket:** `emotioxv2-public-tests-bucket`
- **CloudFront IDs:** Configurados automáticamente
- **Región:** `us-east-1`

## 📝 **Notas Importantes**

1. **Todos los scripts son independientes** - puedes ejecutar cualquiera sin depender de otros
2. **Validación automática** - cada script valida su propio éxito
3. **Rollback automático** - si algo falla, se restaura el estado anterior
4. **Logs detallados** - cada paso se registra claramente
5. **Tiempo estimado** - cada script muestra el tiempo aproximado

## 🚨 **En Caso de Error**

Si algún script falla:

1. Revisa los logs de error
2. Ejecuta `bash scripts/deploy/validate-deployment.sh`
3. Si persiste, ejecuta `bash scripts/deploy/setup-env.sh`
4. Contacta al equipo de desarrollo

---

**¡Con estos scripts, el deployment será extremadamente sencillo! 🎉**
