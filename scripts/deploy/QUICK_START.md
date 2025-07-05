# 🚀 Guía de Inicio Rápido - Deployment EmotioXV2

## ⚡ **COMANDOS ULTRA-RÁPIDOS**

### **Para cualquier cambio en el código:**

```bash
# 🖥️ Solo frontend (3-4 min)
bash scripts/deploy/deploy-frontend.sh

# 📱 Solo public-tests (2-3 min)
bash scripts/deploy/deploy-public-tests.sh

# 🚀 Ambos (5-6 min)
bash scripts/deploy/deploy-both.sh
```

### **Para verificar URLs:**
```bash
bash scripts/deploy/show-urls.sh
```

### **Para validar que funciona:**
```bash
bash scripts/deploy/validate-deployment.sh
```

## 🎯 **FLUJO DE TRABAJO RECOMENDADO**

### **1. Cambias código del frontend:**
```bash
bash scripts/deploy/deploy-frontend.sh
```

### **2. Cambias código de public-tests:**
```bash
bash scripts/deploy/deploy-public-tests.sh
```

### **3. Cambias ambos:**
```bash
bash scripts/deploy/deploy-both.sh
```

### **4. Verificas que funciona:**
```bash
bash scripts/deploy/validate-deployment.sh
```

## 📋 **URLS ACTIVAS**

- **🖥️ Frontend:** https://d2s9nr0bm47yl1.cloudfront.net/
- **📱 Public-Tests:** https://d2zt8ia21te5mv.cloudfront.net/

## ⚙️ **CONFIGURACIÓN AUTOMÁTICA**

Los scripts configuran automáticamente:
- ✅ Variables de entorno
- ✅ Build optimizado
- ✅ Deploy a S3
- ✅ Invalidación de CloudFront
- ✅ Validación de éxito

## 🚨 **EN CASO DE ERROR**

1. **Revisa los logs** - cada script muestra información detallada
2. **Valida el deployment:** `bash scripts/deploy/validate-deployment.sh`
3. **Verifica URLs:** `bash scripts/deploy/show-urls.sh`
4. **Si persiste:** Contacta al equipo

## 📊 **TIEMPOS ESTIMADOS**

| Script | Tiempo | Uso |
|--------|--------|-----|
| `deploy-frontend.sh` | 3-4 min | Solo frontend |
| `deploy-public-tests.sh` | 2-3 min | Solo public-tests |
| `deploy-both.sh` | 5-6 min | Ambos |

## 🎉 **¡LISTO!**

Con estos scripts, el deployment será **extremadamente sencillo**. Solo ejecuta el comando correspondiente y listo.

---

**¿Necesitas ayuda?** Revisa `scripts/deploy/README.md` para documentación completa.
