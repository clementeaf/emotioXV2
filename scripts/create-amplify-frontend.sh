#!/bin/bash
set -e

# =============================
# CONFIGURACIÓN DEL USUARIO
# =============================
APP_NAME="EmotioXV2-Frontend"
REPO_URL="https://github.com/USUARIO/REPO.git"   # <--- CAMBIA ESTO
BRANCH_NAME="main"                               # <--- CAMBIA SI USAS OTRO BRANCH
IAM_ROLE_ARN="arn:aws:iam::123456789012:role/AmplifyEmotioXV2Role" # <--- CAMBIA ESTO
GITHUB_TOKEN="ghp_xxx"                          # <--- CAMBIA ESTO O EXPORTA COMO ENV
AMPLIFY_YML_PATH="../amplify.yml"               # <--- Ajusta si tu buildspec está en otro lado

# =============================
# VARIABLES DE ENTORNO (opcional)
# =============================
# Puedes crear un archivo env.json o usar el flag --environment-variables
# Ejemplo de env.json:
# {
#   "NEXT_PUBLIC_API_URL": "https://api.tu-backend.com"
# }
# ENV_VARS_FILE="env.json" # Descomenta si usas archivo

# =============================
# CREAR APP EN AMPLIFY
# =============================
APP_ID=$(aws amplify create-app \
  --name "$APP_NAME" \
  --description "Frontend Next.js de EmotioXV2" \
  --repository "$REPO_URL" \
  --access-token "$GITHUB_TOKEN" \
  --iam-service-role-arn "$IAM_ROLE_ARN" \
  --output text \
  --query 'app.appId')

if [ -z "$APP_ID" ]; then
  echo "[ERROR] No se pudo crear la app en Amplify. Revisa los parámetros."
  exit 1
fi

echo "[OK] App creada en Amplify con ID: $APP_ID"

# =============================
# CREAR BRANCH PRINCIPAL
# =============================
aws amplify create-branch \
  --app-id "$APP_ID" \
  --branch-name "$BRANCH_NAME" \
  --output text

echo "[OK] Branch '$BRANCH_NAME' creado"

# =============================
# (Opcional) SUBIR AMPLIFY.YML SI NO ESTÁ EN EL REPO
# =============================
# aws amplify update-app --app-id $APP_ID --build-spec file://$AMPLIFY_YML_PATH

# =============================
# (Opcional) CONFIGURAR VARIABLES DE ENTORNO
# =============================
# aws amplify update-app --app-id $APP_ID --environment-variables file://$ENV_VARS_FILE

# =============================
# (Opcional) LANZAR PRIMER BUILD (Amplify lo hace automáticamente)
# =============================
# aws amplify start-job --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-type RELEASE

# =============================
# CHECKLIST FINAL
# =============================
echo "\nChecklist de despliegue reproducible:"
echo "[✅] App creada en Amplify ($APP_NAME)"
echo "[✅] Repo conectado: $REPO_URL"
echo "[✅] Branch creado: $BRANCH_NAME"
echo "[✅] IAM Role asignado: $IAM_ROLE_ARN"
echo "[⚠️] Revisa variables de entorno y buildspec si es necesario"
echo "[✅] Build lanzado automáticamente por Amplify"
echo "\nRevisa el panel de Amplify para ver el progreso del build."
