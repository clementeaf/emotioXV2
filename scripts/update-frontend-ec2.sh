#!/bin/bash
set -e

# === CONFIGURACIÓN EC2 ===
EC2_USER=ec2-user
EC2_HOST=54.90.132.233
EC2_KEY=~/.ssh/tu-llave-ec2.pem
IMAGE_NAME=emotiox-frontend-ssr
CONTAINER_NAME=emotiox-frontend-ssr

# === COLORES PARA LOGGING ===
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

# === FUNCIONES DE VERIFICACIÓN ===
check_dependencies() {
  print_message "Verificando dependencias..."

  if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado"
    exit 1
  fi

  if ! command -v ssh &> /dev/null; then
    print_error "SSH no está disponible"
    exit 1
  fi

  if [ ! -f "$EC2_KEY" ]; then
    print_error "Clave SSH no encontrada en: $EC2_KEY"
    exit 1
  fi

  print_success "Dependencias verificadas"
}

check_ec2_connection() {
  print_message "Verificando conexión a EC2..."

  if ! ssh -i "$EC2_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "echo 'Conexión exitosa'" &> /dev/null; then
    print_error "No se puede conectar a EC2. Verifica:"
    print_error "  - IP: $EC2_HOST"
    print_error "  - Usuario: $EC2_USER"
    print_error "  - Clave SSH: $EC2_KEY"
    exit 1
  fi

  print_success "Conexión a EC2 verificada"
}

# === FUNCIONES DE CONSTRUCCIÓN ===
build_docker_image() {
  print_message "Construyendo imagen Docker..."

  # Navegar al directorio raíz del proyecto
  cd "$(dirname "$0")/.." || exit 1

  # Crear archivo de variables de entorno para producción
  cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://api.emotioxv2.com
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_VERSION=$(date +%Y%m%d-%H%M%S)
EOF

  # Construir imagen
  if docker build -t "$IMAGE_NAME" -f frontend/Dockerfile .; then
    print_success "Imagen Docker construida: $IMAGE_NAME"
  else
    print_error "Error al construir imagen Docker"
    exit 1
  fi
}

# === FUNCIONES DE DESPLIEGUE ===
deploy_to_ec2() {
  print_message "Desplegando a EC2..."

  # Detener y eliminar contenedor existente
  print_message "Deteniendo contenedor existente..."
  ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" "
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
  "

  # Copiar imagen a EC2
  print_message "Copiando imagen a EC2..."
  docker save "$IMAGE_NAME" | bzip2 | ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" 'bunzip2 | docker load'

  # Copiar archivo de variables de entorno
  print_message "Copiando configuración..."
  scp -i "$EC2_KEY" .env.production "$EC2_USER@$EC2_HOST:~/.env.production"

  # Ejecutar nuevo contenedor
  print_message "Iniciando nuevo contenedor..."
  ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" "
    docker run -d \
      --name $CONTAINER_NAME \
      --restart unless-stopped \
      -p 3000:3000 \
      --env-file ~/.env.production \
      $IMAGE_NAME
  "

  print_success "Contenedor desplegado en EC2"
}

# === FUNCIONES DE VERIFICACIÓN POST-DESPLIEGUE ===
verify_deployment() {
  print_message "Verificando despliegue..."

  # Esperar a que el contenedor esté listo
  sleep 10

  # Verificar que el contenedor esté ejecutándose
  if ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" "docker ps | grep $CONTAINER_NAME" &> /dev/null; then
    print_success "Contenedor ejecutándose correctamente"
  else
    print_error "Contenedor no está ejecutándose"
    exit 1
  fi

  # Verificar que la aplicación responda
  if curl -s "http://$EC2_HOST:3000" &> /dev/null; then
    print_success "Aplicación respondiendo en http://$EC2_HOST:3000"
  else
    print_warning "Aplicación no responde inmediatamente (puede estar iniciando)"
  fi
}

# === FUNCIÓN PRINCIPAL ===
main() {
  echo ""
  print_message "🚀 Iniciando actualización del frontend en EC2..."
  echo ""

  check_dependencies
  check_ec2_connection
  build_docker_image
  deploy_to_ec2
  verify_deployment

  echo ""
  print_success "✅ Actualización completada exitosamente!"
  print_message "🌐 URL: http://$EC2_HOST:3000"
  print_message "📊 Logs: ssh -i $EC2_KEY $EC2_USER@$EC2_HOST 'docker logs -f $CONTAINER_NAME'"
  echo ""
}

# Ejecutar script
main
