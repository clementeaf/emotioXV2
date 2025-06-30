#!/bin/bash
set -e

# === CONFIGURACIÓN INICIAL ===
DOCKERHUB_USER=""
DOCKERHUB_REPO="emotiox-frontend"
IMAGE_TAG="latest"
EC2_HOST="54.90.132.233"
EC2_USER="ec2-user"
EC2_KEY="~/.ssh/tu-llave-ec2.pem"
CONTAINER_NAME="emotiox-frontend-ssr"

# === COLORES PARA LOGS ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_message() {
  echo -e "${BLUE}[EmotioXV2]${NC} $1"
}
print_success() {
  echo -e "${GREEN}[ÉXITO]${NC} $1"
}
print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}
print_warning() {
  echo -e "${YELLOW}[ADVERTENCIA]${NC} $1"
}

# === PEDIR CREDENCIALES DOCKER HUB ===
read -p "Usuario de Docker Hub: " DOCKERHUB_USER
read -s -p "Password/Token de Docker Hub: " DOCKERHUB_PASS
export DOCKERHUB_USER
export DOCKERHUB_PASS

echo
print_message "Configurando despliegue para $DOCKERHUB_USER/$DOCKERHUB_REPO:$IMAGE_TAG"

# === BUILD DOCKER OPTIMIZADO ===
print_message "Construyendo imagen Docker optimizada..."
docker buildx build --platform linux/amd64 -t $DOCKERHUB_USER/$DOCKERHUB_REPO:$IMAGE_TAG --load -f frontend/Dockerfile .
print_success "Imagen construida: $DOCKERHUB_USER/$DOCKERHUB_REPO:$IMAGE_TAG"

# === LOGIN DOCKER HUB ===
print_message "Haciendo login en Docker Hub..."
echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin
print_success "Login exitoso en Docker Hub"

# === PUSH DOCKER HUB ===
print_message "Haciendo push de la imagen a Docker Hub..."
docker push $DOCKERHUB_USER/$DOCKERHUB_REPO:$IMAGE_TAG
print_success "Imagen publicada en Docker Hub"

# === DEPLOY EN EC2 ===
print_message "Desplegando en EC2 ($EC2_HOST)..."

ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" bash -s <<EOF
set -e

echo "[EC2] Login a Docker Hub..."
echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin

echo "[EC2] Pull de la imagen..."
docker pull $DOCKERHUB_USER/$DOCKERHUB_REPO:$IMAGE_TAG

echo "[EC2] Deteniendo y eliminando contenedor anterior..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

echo "[EC2] Iniciando nuevo contenedor..."
docker run -d --name $CONTAINER_NAME --restart unless-stopped -p 3000:3000 --env-file ~/.env.production $DOCKERHUB_USER/$DOCKERHUB_REPO:$IMAGE_TAG

sleep 5
echo "[EC2] Estado del contenedor:"
docker ps | grep $CONTAINER_NAME
EOF

print_success "Despliegue completado. Accede a: http://$EC2_HOST:3000"
