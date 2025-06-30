# 🚀 Despliegue Automatizado Frontend EmotioX en EC2 usando Docker Hub

## ¿Qué hace este flujo?
- Build optimizado de la imagen Docker para linux/amd64
- Push automático a Docker Hub
- Pull y despliegue en EC2 (detiene, elimina y reinicia el contenedor)
- Todo en un solo script, sin pasos manuales

---

## 1️⃣ Requisitos previos
- Tener cuenta en Docker Hub
- Haber creado un repositorio (ej: `emotiox-frontend`)
- Tener acceso SSH a tu EC2 y la clave configurada (`~/.ssh/tu-llave-ec2.pem`)
- Docker instalado localmente y en EC2

---

## 2️⃣ Uso del script

### 1. Ejecuta el script desde tu máquina local:
```bash
./scripts/deploy-frontend-dockerhub.sh
```

### 2. El script te pedirá:
- Usuario de Docker Hub
- Password o token de Docker Hub (no se guarda, solo para la sesión)

### 3. El script hará automáticamente:
- Build optimizado de la imagen
- Login y push a Docker Hub
- Login, pull, stop, rm y run en EC2
- Verificación de estado

---

## 3️⃣ Variables configurables (puedes editar al inicio del script)
- `DOCKERHUB_REPO` (nombre del repo en Docker Hub)
- `EC2_HOST` (IP de tu instancia EC2)
- `EC2_USER` (usuario SSH, por defecto `ec2-user`)
- `EC2_KEY` (ruta a tu clave SSH)
- `CONTAINER_NAME` (nombre del contenedor Docker)

---

## 4️⃣ ¿Qué hace en EC2?
- Login a Docker Hub
- Pull de la imagen más reciente
- Detiene y elimina el contenedor anterior
- Inicia el nuevo contenedor en el puerto 3000
- Muestra el estado del contenedor

---

## 5️⃣ Troubleshooting
- Si falla el login a Docker Hub, revisa usuario/token
- Si hay error de espacio, limpia con:
  ```bash
  ssh -i ~/.ssh/tu-llave-ec2.pem ec2-user@<EC2_HOST> 'docker system prune -af && docker image prune -af && df -h'
  ```
- Si el contenedor no arranca, revisa logs:
  ```bash
  ssh -i ~/.ssh/tu-llave-ec2.pem ec2-user@<EC2_HOST> 'docker logs -f emotiox-frontend-ssr'
  ```

---

## 6️⃣ Checklist de despliegue
- [ ] Build y push exitoso a Docker Hub
- [ ] Pull exitoso en EC2
- [ ] Contenedor corriendo en EC2
- [ ] App accesible en http://<EC2_HOST>:3000

---

## 7️⃣ Seguridad
- El password/token de Docker Hub solo se usa en memoria, nunca se guarda en disco.
- Puedes usar un token de acceso de Docker Hub para mayor seguridad.

---

## 8️⃣ Ejemplo de uso
```bash
./scripts/deploy-frontend-dockerhub.sh
# Usuario de Docker Hub: clemente
# Password/Token de Docker Hub: ********
```

---

## 9️⃣ ¿Y si quiero usar ECR en el futuro?
¡Solo avísame! El flujo es similar, solo cambia el login y el repo.

---

**¡Listo! Ahora puedes actualizar tu frontend en EC2 en minutos, con un solo comando.**
