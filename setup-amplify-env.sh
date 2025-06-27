#!/bin/bash

# Script automatizado para configurar AWS Amplify con variables de entorno
# Autor: EmotioXV2 Team
# Fecha: $(date)

set -e  # Exit on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
APP_ID="d1718q1uyn5ffx"
BRANCH_NAME="main"
REGION="us-east-1"

# Variables de entorno
declare -A ENV_VARS=(
    ["NEXT_PUBLIC_API_URL"]="https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
    ["NEXT_PUBLIC_API_BASE_URL"]="https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
    ["NEXT_PUBLIC_WS_URL"]="wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
    ["NEXT_PUBLIC_PUBLIC_TESTS_URL"]="https://main.dgsabzeqh9eea.amplifyapp.com"
)

echo -e "${BLUE}🚀 Configurando AWS Amplify para EmotioXV2${NC}"
echo "=================================================="

# Función para verificar dependencias
check_dependencies() {
    echo -e "${YELLOW}📋 Verificando dependencias...${NC}"

    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI no está instalado${NC}"
        echo "Instala AWS CLI: https://aws.amazon.com/cli/"
        exit 1
    fi

    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}⚠️  jq no está instalado. Instalando...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install jq
        else
            echo "Instala jq manualmente: https://stedolan.github.io/jq/"
            exit 1
        fi
    fi

    echo -e "${GREEN}✅ Dependencias verificadas${NC}"
}

# Función para verificar configuración de AWS
check_aws_config() {
    echo -e "${YELLOW}🔐 Verificando configuración de AWS...${NC}"

    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ No se pudo verificar la identidad de AWS${NC}"
        echo "Configura AWS CLI: aws configure"
        exit 1
    fi

    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo -e "${GREEN}✅ AWS configurado (Account: ${ACCOUNT_ID})${NC}"
}

# Función para verificar que la app existe
check_app_exists() {
    echo -e "${YELLOW}🔍 Verificando que la app existe...${NC}"

    if ! aws amplify get-app --app-id $APP_ID --region $REGION &> /dev/null; then
        echo -e "${RED}❌ App $APP_ID no encontrada${NC}"
        echo "Verifica el APP_ID en team-provider-info.json"
        exit 1
    fi

    echo -e "${GREEN}✅ App encontrada${NC}"
}

# Función para configurar variables de entorno
configure_env_vars() {
    echo -e "${YELLOW}⚙️  Configurando variables de entorno...${NC}"

    # Crear archivo temporal con todas las variables
    cat > /tmp/amplify-env-vars.json << EOF
{
    "environmentVariables": {
$(for key in "${!ENV_VARS[@]}"; do
    echo "        \"$key\": \"${ENV_VARS[$key]}\""
done | sed '$ s/,$//')
    }
}
EOF

    # Actualizar la app con las variables
    aws amplify update-app \
        --app-id $APP_ID \
        --region $REGION \
        --cli-input-json file:///tmp/amplify-env-vars.json \
        --output table

    echo -e "${GREEN}✅ Variables de entorno configuradas${NC}"
}

# Función para reiniciar el build
restart_build() {
    echo -e "${YELLOW}🔄 Reiniciando build...${NC}"

    aws amplify start-job \
        --app-id $APP_ID \
        --branch-name $BRANCH_NAME \
        --job-type RELEASE \
        --region $REGION \
        --output table

    echo -e "${GREEN}✅ Build reiniciado${NC}"
}

# Función para mostrar el estado final
show_status() {
    echo -e "${BLUE}📊 Estado final:${NC}"
    echo "=================================================="

    # Obtener URL de la app
    APP_URL=$(aws amplify get-app --app-id $APP_ID --region $REGION --query 'app.defaultDomain' --output text)
    echo -e "${GREEN}🌐 URL de la app: https://$APP_URL${NC}"

    # Mostrar variables configuradas
    echo -e "${GREEN}📋 Variables configuradas:${NC}"
    for key in "${!ENV_VARS[@]}"; do
        echo "  $key = ${ENV_VARS[$key]}"
    done

    echo ""
    echo -e "${GREEN}✅ Configuración completada exitosamente!${NC}"
    echo -e "${YELLOW}⏳ El build puede tomar unos minutos en completarse${NC}"
}

# Función principal
main() {
    check_dependencies
    check_aws_config
    check_app_exists
    configure_env_vars
    restart_build
    show_status

    # Limpiar archivo temporal
    rm -f /tmp/amplify-env-vars.json
}

# Ejecutar script
main "$@"
