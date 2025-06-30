#!/bin/bash

# === CONFIGURACIÓN EC2 ===
EC2_USER=ec2-user
EC2_HOST=54.90.132.233
EC2_KEY=~/.ssh/tu-llave-ec2.pem
CONTAINER_NAME=emotiox-frontend-ssr

# === COLORES ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
  local status=$1
  local message=$2

  case $status in
    "OK")
      echo -e "${GREEN}✅ $message${NC}"
      ;;
    "WARNING")
      echo -e "${YELLOW}⚠️  $message${NC}"
      ;;
    "ERROR")
      echo -e "${RED}❌ $message${NC}"
      ;;
    "INFO")
      echo -e "${BLUE}ℹ️  $message${NC}"
      ;;
  esac
}

# === FUNCIONES DE MONITOREO ===
check_ec2_connection() {
  print_status "INFO" "Verificando conexión a EC2..."

  if ssh -i "$EC2_KEY" -o ConnectTimeout=5 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "echo 'OK'" &> /dev/null; then
    print_status "OK" "Conexión a EC2 establecida"
    return 0
  else
    print_status "ERROR" "No se puede conectar a EC2"
    return 1
  fi
}

check_docker_status() {
  print_status "INFO" "Verificando estado de Docker..."

  local docker_status=$(ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" "sudo systemctl is-active docker" 2>/dev/null)

  if [ "$docker_status" = "active" ]; then
    print_status "OK" "Docker está ejecutándose"
    return 0
  else
    print_status "ERROR" "Docker no está ejecutándose"
    return 1
  fi
}

check_container_status() {
  print_status "INFO" "Verificando estado del contenedor..."

  local container_info=$(ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" "docker ps --filter name=$CONTAINER_NAME --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" 2>/dev/null)

  if echo "$container_info" | grep -q "$CONTAINER_NAME"; then
    print_status "OK" "Contenedor $CONTAINER_NAME está ejecutándose"
    echo "$container_info" | grep "$CONTAINER_NAME"
    return 0
  else
    print_status "ERROR" "Contenedor $CONTAINER_NAME no está ejecutándose"
    return 1
  fi
}

check_application_health() {
  print_status "INFO" "Verificando salud de la aplicación..."

  local response_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$EC2_HOST:3000" 2>/dev/null)

  if [ "$response_code" = "200" ]; then
    print_status "OK" "Aplicación respondiendo correctamente (HTTP $response_code)"
    return 0
  elif [ "$response_code" = "000" ]; then
    print_status "ERROR" "Aplicación no responde (timeout)"
    return 1
  else
    print_status "WARNING" "Aplicación responde con código HTTP $response_code"
    return 1
  fi
}

check_container_logs() {
  print_status "INFO" "Últimas líneas de logs del contenedor:"

  ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" "docker logs --tail 10 $CONTAINER_NAME" 2>/dev/null || {
    print_status "ERROR" "No se pueden obtener logs del contenedor"
  }
}

check_system_resources() {
  print_status "INFO" "Verificando recursos del sistema..."

  local resources=$(ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" "
    echo 'CPU Usage:'
    top -bn1 | grep 'Cpu(s)' | awk '{print \$2}' | cut -d'%' -f1

    echo 'Memory Usage:'
    free -m | awk 'NR==2{printf \"%.1f%%\", \$3*100/\$2}'

    echo 'Disk Usage:'
    df -h / | awk 'NR==2{print \$5}'

    echo 'Docker Images:'
    docker images | grep emotiox
  " 2>/dev/null)

  echo "$resources"
}

# === FUNCIÓN PRINCIPAL ===
main() {
  echo ""
  print_status "INFO" "🔍 Monitoreando EmotioXV2 Frontend en EC2..."
  echo ""

  local all_ok=true

  # Verificar conexión
  if ! check_ec2_connection; then
    all_ok=false
    echo ""
    exit 1
  fi

  # Verificar Docker
  if ! check_docker_status; then
    all_ok=false
  fi

  # Verificar contenedor
  if ! check_container_status; then
    all_ok=false
  fi

  # Verificar aplicación
  if ! check_application_health; then
    all_ok=false
  fi

  echo ""
  print_status "INFO" "📊 Información del sistema:"
  check_system_resources

  echo ""
  print_status "INFO" "📋 Logs recientes:"
  check_container_logs

  echo ""
  if [ "$all_ok" = true ]; then
    print_status "OK" "🎉 Todo está funcionando correctamente!"
    print_status "INFO" "🌐 URL: http://$EC2_HOST:3000"
  else
    print_status "WARNING" "⚠️  Se detectaron problemas. Revisa los logs arriba."
  fi

  echo ""
}

# Ejecutar script
main
