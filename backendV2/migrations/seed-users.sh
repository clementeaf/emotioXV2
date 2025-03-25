#!/bin/bash

# Obtener el directorio del script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Leer los usuarios del archivo JSON
USERS=$(cat "$DIR/seed-users.json")

# Iterar a través del array JSON
for i in $(seq 0 $(($(echo $USERS | jq length) - 1))); do
  # Extraer cada usuario
  USER=$(echo $USERS | jq .[$i])
  
  # Insertar el usuario en DynamoDB
  aws dynamodb put-item \
    --table-name emotioxv2-users-table-dev \
    --item "$USER" \
    --endpoint-url http://localhost:8000
  
  echo "Usuario $(echo $USER | jq -r .email.S) insertado."
done

echo "Datos de usuarios insertados correctamente." 