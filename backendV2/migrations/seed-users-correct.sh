#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
USERS=$(cat "$DIR/seed-users-correct.json")
for i in $(seq 0 $(($(echo $USERS | jq length) - 1))); do
  USER=$(echo $USERS | jq .[$i])
  aws dynamodb put-item --table-name emotioxv2-users-dev --item "$USER" --endpoint-url http://localhost:8000
  echo "Usuario $(echo $USER | jq -r .email.S) insertado."
done
echo "Datos de usuarios insertados correctamente."
