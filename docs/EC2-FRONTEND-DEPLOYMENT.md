# 🚀 Guía de Despliegue del Frontend en EC2 - EmotioXV2

## 📋 **RESUMEN EJECUTIVO**

Esta guía te permite actualizar el código del frontend de EmotioXV2 en la instancia EC2 de forma rápida y segura.

### ✅ **ESTADO ACTUAL VERIFICADO**
- **EC2 IP**: `54.90.132.233`
- **Usuario**: `ec2-user`
- **Puerto**: `3000`
- **Tecnología**: Docker + Next.js SSR
- **Framework**: Next.js 15.3.3 con App Router

---

## 🎯 **OPCIONES DE ACTUALIZACIÓN**

### **OPCIÓN 1: Actualización Automática (Recomendada)**
```bash
# Ejecutar script de actualización completo
./scripts/update-frontend-ec2.sh
```

### **OPCIÓN 2: Configuración Inicial + Actualización**
```bash
# 1. Configurar EC2 (solo la primera vez)
./scripts/setup-ec2-quick.sh

# 2. Actualizar frontend
./scripts/update-frontend-ec2.sh
```

### **OPCIÓN 3: Monitoreo del Estado**
```bash
# Verificar estado actual
./scripts/monitor-frontend-ec2.sh
```

---

## 🔧 **REQUISITOS PREVIOS**

### **En tu máquina local:**
- [ ] Docker instalado
- [ ] SSH configurado
- [ ] Clave SSH en `~/.ssh/tu-llave-ec2.pem`
- [ ] Acceso a internet

### **En EC2:**
- [ ] Docker instalado y ejecutándose
- [ ] Puerto 3000 abierto
- [ ] Usuario `ec2-user` con permisos Docker

---

## 📝 **INSTRUCCIONES PASO A PASO**

### **PASO 1: Verificar Configuración**
```bash
# Verificar que tienes la clave SSH
ls -la ~/.ssh/tu-llave-ec2.pem

# Verificar que Docker está instalado
docker --version
```

### **PASO 2: Configurar EC2 (Primera vez)**
```bash
# Ejecutar configuración inicial
./scripts/setup-ec2-quick.sh
```

**Este script hace:**
- ✅ Instala Docker en EC2
- ✅ Configura firewall (puerto 3000)
- ✅ Crea directorios de trabajo
- ✅ Configura variables de entorno
- ✅ Crea script de despliegue local

### **PASO 3: Actualizar Frontend**
```bash
# Ejecutar actualización completa
./scripts/update-frontend-ec2.sh
```

**Este script hace:**
- ✅ Construye imagen Docker localmente
- ✅ Copia imagen a EC2
- ✅ Detiene contenedor existente
- ✅ Inicia nuevo contenedor
- ✅ Verifica despliegue

### **PASO 4: Verificar Despliegue**
```bash
# Monitorear estado
./scripts/monitor-frontend-ec2.sh
```

---

## 🔍 **VERIFICACIÓN MANUAL**

### **Verificar conexión SSH:**
```bash
ssh -i ~/.ssh/tu-llave-ec2.pem ec2-user@54.90.132.233
```

### **Verificar Docker en EC2:**
```bash
# Conectarse a EC2
ssh -i ~/.ssh/tu-llave-ec2.pem ec2-user@54.90.132.233

# Verificar Docker
docker --version
docker ps
```

### **Verificar aplicación:**
```bash
# Desde tu máquina local
curl -I http://54.90.132.233:3000

# O abrir en navegador
open http://54.90.132.233:3000
```

---

## 🛠️ **SOLUCIÓN DE PROBLEMAS**

### **Error: "No se puede conectar a EC2"**
```bash
# Verificar IP y clave SSH
ping 54.90.132.233
ls -la ~/.ssh/tu-llave-ec2.pem

# Verificar permisos de clave
chmod 600 ~/.ssh/tu-llave-ec2.pem
```

### **Error: "Docker no está instalado"**
```bash
# Conectarse a EC2 y instalar Docker manualmente
ssh -i ~/.ssh/tu-llave-ec2.pem ec2-user@54.90.132.233

sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user
```

### **Error: "Contenedor no está ejecutándose"**
```bash
# Verificar logs del contenedor
ssh -i ~/.ssh/tu-llave-ec2.pem ec2-user@54.90.132.233
docker logs emotiox-frontend-ssr

# Reiniciar contenedor
docker restart emotiox-frontend-ssr
```

### **Error: "Puerto 3000 no accesible"**
```bash
# Verificar firewall en EC2
ssh -i ~/.ssh/tu-llave-ec2.pem ec2-user@54.90.132.233
sudo firewall-cmd --list-ports
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

---

## 📊 **MONITOREO Y MANTENIMIENTO**

### **Ver logs en tiempo real:**
```bash
ssh -i ~/.ssh/tu-llave-ec2.pem ec2-user@54.90.132.233
docker logs -f emotiox-frontend-ssr
```

### **Verificar recursos del sistema:**
```bash
ssh -i ~/.ssh/tu-llave-ec2.pem ec2-user@54.90.132.233
htop
df -h
docker system df
```

### **Limpiar recursos Docker:**
```bash
ssh -i ~/.ssh/tu-llave-ec2.pem ec2-user@54.90.132.233
docker system prune -f
docker image prune -f
```

---

## 🔄 **FLUJO DE TRABAJO TÍPICO**

### **Para actualizaciones diarias:**
```bash
# 1. Hacer cambios en el código
git add .
git commit -m "feat: actualización frontend"

# 2. Actualizar en EC2
./scripts/update-frontend-ec2.sh

# 3. Verificar despliegue
./scripts/monitor-frontend-ec2.sh
```

### **Para rollback en caso de problemas:**
```bash
# Conectarse a EC2
ssh -i ~/.ssh/tu-llave-ec2.pem ec2-user@54.90.132.233

# Ver imágenes disponibles
docker images

# Ejecutar imagen anterior
docker stop emotiox-frontend-ssr
docker rm emotiox-frontend-ssr
docker run -d --name emotiox-frontend-ssr -p 3000:3000 --env-file ~/.env.production emotiox-frontend-ssr:previous
```

---

## 📋 **CHECKLIST DE DESPLIEGUE**

### **Antes del despliegue:**
- [ ] Código probado localmente
- [ ] Tests pasando
- [ ] Variables de entorno actualizadas
- [ ] Backup de versión anterior (opcional)

### **Durante el despliegue:**
- [ ] Script ejecutándose sin errores
- [ ] Imagen Docker construida correctamente
- [ ] Contenedor iniciado en EC2
- [ ] Aplicación respondiendo en puerto 3000

### **Después del despliegue:**
- [ ] Verificar funcionalidad principal
- [ ] Verificar autenticación
- [ ] Verificar conexión con API
- [ ] Monitorear logs por errores

---

## 🎯 **COMANDOS RÁPIDOS**

### **Actualización completa:**
```bash
./scripts/update-frontend-ec2.sh
```

### **Solo monitoreo:**
```bash
./scripts/monitor-frontend-ec2.sh
```

### **Configuración inicial:**
```bash
./scripts/setup-ec2-quick.sh
```

### **Acceso directo a EC2:**
```bash
ssh -i ~/.ssh/tu-llave-ec2.pem ec2-user@54.90.132.233
```

### **Ver logs en tiempo real:**
```bash
ssh -i ~/.ssh/tu-llave-ec2.pem ec2-user@54.90.132.233 'docker logs -f emotiox-frontend-ssr'
```

---

## 📞 **SOPORTE**

### **En caso de problemas:**
1. Ejecutar `./scripts/monitor-frontend-ec2.sh` para diagnóstico
2. Revisar logs del contenedor
3. Verificar configuración de red y firewall
4. Contactar al equipo de desarrollo

### **Información útil:**
- **URL de producción**: http://54.90.132.233:3000
- **Usuario EC2**: ec2-user
- **Contenedor**: emotiox-frontend-ssr
- **Puerto**: 3000

---

## ✅ **CONCLUSIÓN**

Con estos scripts y guías, puedes actualizar el frontend de EmotioXV2 en EC2 de forma:
- ✅ **Rápida**: Un solo comando
- ✅ **Segura**: Verificaciones automáticas
- ✅ **Confiable**: Rollback disponible
- ✅ **Monitoreable**: Estado visible en tiempo real

**¡El frontend está listo para ser actualizado en EC2!** 🚀
