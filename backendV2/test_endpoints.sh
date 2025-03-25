#!/bin/bash

# URLs base
BASE_URL="http://localhost:3000/dev"
AUTH_URL="$BASE_URL/auth"

# Colores para terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Pruebas de API de EmotioXV2${NC}"
echo "=================================="

# 1. Verificar que el servidor está funcionando
echo -e "\n${BLUE}1. Verificar estado del servidor${NC}"
curl -s "$BASE_URL/health" | json_pp

# 2. Ver la página de inicio
echo -e "\n${BLUE}2. Verificar página de inicio${NC}"
curl -s "$BASE_URL" | json_pp

# 3. Registrar un nuevo usuario
echo -e "\n${BLUE}3. Registrar un nuevo usuario${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$AUTH_URL/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@test.com",
    "name": "Usuario Test",
    "password": "password123",
    "role": "user"
  }')
echo "$REGISTER_RESPONSE" | json_pp

# 4. Iniciar sesión
echo -e "\n${BLUE}4. Iniciar sesión${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@test.com",
    "password": "password123"
  }')
echo "$LOGIN_RESPONSE" | json_pp

# Extraer token para usar en las siguientes solicitudes
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}Token obtenido: ${TOKEN:0:20}...${NC}"

# 5. Obtener perfil con el token
echo -e "\n${BLUE}5. Obtener perfil${NC}"
curl -s -X GET "$AUTH_URL/me" \
  -H "Authorization: Bearer $TOKEN" | json_pp

# 6. Actualizar perfil
echo -e "\n${BLUE}6. Actualizar perfil${NC}"
curl -s -X PUT "$AUTH_URL/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Usuario Actualizado",
    "preferences": {
      "theme": "dark",
      "language": "es"
    }
  }' | json_pp

# 7. Cerrar sesión
echo -e "\n${BLUE}7. Cerrar sesión${NC}"
curl -s -X POST "$AUTH_URL/logout" \
  -H "Authorization: Bearer $TOKEN" | json_pp

echo -e "\n${GREEN}Pruebas completadas${NC}" 