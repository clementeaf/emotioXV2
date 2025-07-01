#!/bin/bash
set -e

# Configuración
EC2_USER=ec2-user
EC2_HOST=54.90.132.233
EC2_KEY=~/.ssh/tu-llave-ec2.pem
CONTAINER_NAME=emotiox-frontend-ssr

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_section() {
  echo -e "${BLUE}\n========== $1 ==========${NC}"
}

print_success() {
  echo -e "${GREEN}[OK] $1${NC}"
}

print_error() {
  echo -e "${RED}[ERROR] $1${NC}"
}

# 1. Comparar .env.production
print_section ".env.production"
scp -i "$EC2_KEY" $EC2_USER@$EC2_HOST:~/.env.production ./env.production.ec2 &>/dev/null
if diff .env.production ./env.production.ec2 &>/dev/null; then
  print_success ".env.production es idéntico en local y EC2"
else
  print_error ".env.production DIFERENTE entre local y EC2"
  diff .env.production ./env.production.ec2 || true
fi

# 2. Comparar hash de imagen Docker
print_section "Hash de imagen Docker"
LOCAL_HASH=$(docker images --digests | grep emotiox-frontend-ssr | head -1 | awk '{print $3}')
REMOTE_HASH=$(ssh -i "$EC2_KEY" $EC2_USER@$EC2_HOST "docker images --digests | grep emotiox-frontend-ssr | head -1 | awk '{print \$3}'")
if [ "$LOCAL_HASH" == "$REMOTE_HASH" ] && [ -n "$LOCAL_HASH" ]; then
  print_success "Hash de imagen Docker es idéntico: $LOCAL_HASH"
else
  print_error "Hash de imagen Docker DIFERENTE: local=$LOCAL_HASH, ec2=$REMOTE_HASH"
fi

# 3. Probar endpoint de salud
print_section "Endpoint de salud (local)"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/health || print_error "No responde en local"

print_section "Endpoint de salud (EC2)"
ssh -i "$EC2_KEY" $EC2_USER@$EC2_HOST "curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/health" || print_error "No responde en EC2"

# 4. Logs recientes en EC2
print_section "Logs recientes en EC2 ($CONTAINER_NAME)"
ssh -i "$EC2_KEY" $EC2_USER@$EC2_HOST "docker logs --tail 30 $CONTAINER_NAME" || print_error "No se pudo obtener logs del contenedor en EC2"

echo -e "${BLUE}\n========== VALIDACIÓN COMPLETA ==========${NC}"
