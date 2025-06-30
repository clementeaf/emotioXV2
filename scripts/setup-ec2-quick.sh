#!/bin/bash
set -e

# === CONFIGURACIÓN EC2 ===
EC2_USER=ec2-user
EC2_HOST=54.90.132.233
EC2_KEY=~/.ssh/tu-llave-ec2.pem

# === COLORES ===
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

# === VERIFICACIÓN DE CONEXIÓN ===
check_connection() {
  print_message "Verificando conexión a EC2..."

  if ! ssh -i "$EC2_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "echo 'OK'" &> /dev/null; then
    print_error "No se puede conectar a EC2"
    print_error "Verifica: IP=$EC2_HOST, Usuario=$EC2_USER, Clave=$EC2_KEY"
    exit 1
  fi

  print_success "Conexión verificada"
}

# === INSTALACIÓN DE DOCKER ===
install_docker() {
  print_message "Instalando Docker en EC2..."

  ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" "
    # Actualizar sistema
    sudo yum update -y

    # Instalar Docker
    sudo yum install -y docker

    # Iniciar y habilitar Docker
    sudo systemctl start docker
    sudo systemctl enable docker

    # Agregar usuario al grupo docker
    sudo usermod -a -G docker $EC2_USER

    # Verificar instalación
    docker --version
  "

  print_success "Docker instalado"
}

# === CONFIGURACIÓN DE PUERTOS ===
configure_firewall() {
  print_message "Configurando firewall..."

  ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" "
    # Abrir puerto 3000
    sudo firewall-cmd --permanent --add-port=3000/tcp
    sudo firewall-cmd --reload

    # Verificar puertos abiertos
    sudo firewall-cmd --list-ports
  "

  print_success "Firewall configurado"
}

# === CREAR DIRECTORIOS ===
create_directories() {
  print_message "Creando directorios de trabajo..."

  ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" "
    mkdir -p ~/emotiox-frontend
    mkdir -p ~/logs
    mkdir -p ~/backups
  "

  print_success "Directorios creados"
}

# === CONFIGURAR VARIABLES DE ENTORNO ===
setup_environment() {
  print_message "Configurando variables de entorno..."

  ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" "
    cat > ~/.env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://api.emotioxv2.com
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_VERSION=1.0.0
EOF
  "

  print_success "Variables de entorno configuradas"
}

# === CREAR SCRIPT DE DESPLIEGUE LOCAL ===
create_deploy_script() {
  print_message "Creando script de despliegue local..."

  ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" "
    cat > ~/deploy-frontend.sh << 'EOF'
#!/bin/bash
set -e

CONTAINER_NAME=emotiox-frontend-ssr
IMAGE_NAME=emotiox-frontend-ssr

echo '[1/4] Deteniendo contenedor existente...'
docker stop \$CONTAINER_NAME 2>/dev/null || true
docker rm \$CONTAINER_NAME 2>/dev/null || true

echo '[2/4] Cargando nueva imagen...'
docker load < ~/emotiox-frontend/image.tar

echo '[3/4] Iniciando nuevo contenedor...'
docker run -d \\
  --name \$CONTAINER_NAME \\
  --restart unless-stopped \\
  -p 3000:3000 \\
  --env-file ~/.env.production \\
  \$IMAGE_NAME

echo '[4/4] Verificando despliegue...'
sleep 5
docker ps | grep \$CONTAINER_NAME
echo '✅ Despliegue completado en http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000'
EOF

    chmod +x ~/deploy-frontend.sh
  "

  print_success "Script de despliegue creado"
}

# === FUNCIÓN PRINCIPAL ===
main() {
  echo ""
  print_message "🔧 Configurando EC2 para EmotioXV2 Frontend..."
  echo ""

  check_connection
  install_docker
  configure_firewall
  create_directories
  setup_environment
  create_deploy_script

  echo ""
  print_success "✅ Configuración de EC2 completada!"
  print_message "🌐 IP: $EC2_HOST"
  print_message "👤 Usuario: $EC2_USER"
  print_message "📁 Directorio: ~/emotiox-frontend"
  print_message "🚀 Script de despliegue: ~/deploy-frontend.sh"
  echo ""
  print_message "Próximo paso: Ejecutar scripts/update-frontend-ec2.sh"
  echo ""
}

# Ejecutar script
main
