#!/bin/bash

# Variables
EMAIL="usuario.api@test.com"
PASSWORD="password123"
AUTH_URL="http://localhost:3000/dev/auth/login"

# Directorio para guardar el token
TOKEN_DIR="$HOME/.emotioxv2"
TOKEN_FILE="$TOKEN_DIR/token.txt"

# Crear directorio si no existe
mkdir -p "$TOKEN_DIR"

# Iniciar sesión y obtener token
echo "Iniciando sesión con $EMAIL..."
response=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" $AUTH_URL)

# Extraer token con jq
token=$(echo $response | jq -r '.token')

if [ "$token" != "null" ]; then
  # Guardar token en archivo
  echo $token > "$TOKEN_FILE"
  echo "Token guardado en $TOKEN_FILE"
  echo "Sesión iniciada correctamente como $EMAIL"
  
  # Mostrar comando para exportar token
  echo "Para usar el token en tus comandos, ejecuta:"
  echo "export TOKEN=\"$token\""
else
  echo "Error al iniciar sesión:"
  echo $response
fi 