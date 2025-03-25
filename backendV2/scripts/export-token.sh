#!/bin/bash

# Directorio donde se guarda el token
TOKEN_DIR="$HOME/.emotioxv2"
TOKEN_FILE="$TOKEN_DIR/token.txt"

# Verificar si el archivo existe
if [ -f "$TOKEN_FILE" ]; then
  TOKEN=$(cat "$TOKEN_FILE")
  
  # Exportar el token
  export TOKEN="$TOKEN"
  
  # Imprimir mensaje de confirmación
  echo "Token exportado como variable \$TOKEN"
  echo "Para usarlo en otro shell, ejecuta:"
  echo "export TOKEN=\"$TOKEN\""
else
  echo "No se encontró un token guardado. Ejecuta primero ./scripts/login.sh"
  exit 1
fi 