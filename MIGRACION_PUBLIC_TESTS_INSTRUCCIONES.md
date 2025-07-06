# 🚀 Migración Public-Tests a Amplify - INSTRUCCIONES FINALES

## ✅ **ESTADO ACTUAL: APLICACIÓN CREADA**

### **📊 Información de la aplicación:**
- **App ID:** `d38z5t7y6s2foi`
- **URL final:** https://d38z5t7y6s2foi.amplifyapp.com
- **Console AWS:** https://console.aws.amazon.com/amplify/home?region=us-east-1#/d38z5t7y6s2foi

---

## 🔧 **PASO FINAL: CONECTAR GITHUB (MANUAL)**

### **1. Ir a la consola de Amplify**
```
https://console.aws.amazon.com/amplify/home?region=us-east-1#/d38z5t7y6s2foi
```

### **2. Conectar branch**
1. Click en **"Connect branch"**
2. Seleccionar **GitHub** como proveedor
3. Autorizar AWS Amplify en GitHub
4. Seleccionar:
   - **Repository:** `clementeaf/emotioXV2`
   - **Branch:** `main`

### **3. Configurar build (ya está preconfigurado)**
La configuración de build ya está aplicada:
```yaml
Build command: npm run build
Build output directory: dist
Base directory: public-tests
```

### **4. Deploy automático**
Una vez conectado, el deploy se iniciará automáticamente.

---

## 📦 **BACKUP DE CONFIGURACIÓN ACTUAL S3/CLOUDFRONT**

<function_calls>
<invoke name="run_command">
<parameter name="command">mkdir -p backups/s3-cloudfront-public-tests && \
aws cloudfront get-distribution-config --id E2X8HCFI5FM1EC > backups/s3-cloudfront-public-tests/cloudfront-config.json && \
aws s3api get-bucket-policy --bucket emotioxv2-public-tests-bucket > backups/s3-cloudfront-public-tests/s3-bucket-policy.json 2>/dev/null || true && \
aws s3api get-bucket-website --bucket emotioxv2-public-tests-bucket > backups/s3-cloudfront-public-tests/s3-website-config.json 2>/dev/null || true
