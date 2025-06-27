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
REGIONS=("us-east-1" "us-west-2" "eu-west-1")

# Variables de entorno (compatible con bash estándar)
NEXT_PUBLIC_API_URL="https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
NEXT_PUBLIC_API_BASE_URL="https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
NEXT_PUBLIC_WS_URL="wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
NEXT_PUBLIC_PUBLIC_TESTS_URL="https://main.dgsabzeqh9eea.amplifyapp.com"

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

# Función para encontrar la región correcta
find_app_region() {
    echo -e "${YELLOW}🔍 Buscando la app en diferentes regiones...${NC}"

    for region in "${REGIONS[@]}"; do
        echo -e "${YELLOW}  Probando región: $region${NC}"
        if aws amplify get-app --app-id $APP_ID --region $region &> /dev/null; then
            echo -e "${GREEN}✅ App encontrada en región: $region${NC}"
            REGION=$region
            return 0
        fi
    done

    echo -e "${RED}❌ App $APP_ID no encontrada en ninguna región${NC}"
    echo "Verifica el APP_ID en team-provider-info.json"
    exit 1
}

# Función para configurar variables de entorno
configure_env_vars() {
    echo -e "${YELLOW}⚙️  Configurando variables de entorno...${NC}"

    # Crear archivo temporal con todas las variables
    cat > /tmp/amplify-env-vars.json << EOF
{
    "environmentVariables": {
        "NEXT_PUBLIC_API_URL": "$NEXT_PUBLIC_API_URL",
        "NEXT_PUBLIC_API_BASE_URL": "$NEXT_PUBLIC_API_BASE_URL",
        "NEXT_PUBLIC_WS_URL": "$NEXT_PUBLIC_WS_URL",
        "NEXT_PUBLIC_PUBLIC_TESTS_URL": "$NEXT_PUBLIC_PUBLIC_TESTS_URL"
    }
}
EOF

    # Actualizar la app con las variables
    aws amplify update-app \
        --app-id $APP_ID \
        --region $REGION \
        --cli-input-json file:///tmp/amplify-env-vars.json

    echo -e "${GREEN}✅ Variables de entorno configuradas${NC}"
}

# Función para reiniciar el build
restart_build() {
    echo -e "${YELLOW}🔄 Reiniciando build...${NC}"

    aws amplify start-job \
        --app-id $APP_ID \
        --branch-name $BRANCH_NAME \
        --job-type RELEASE \
        --region $REGION

    echo -e "${GREEN}✅ Build reiniciado${NC}"
}

# Función para mostrar el estado final
show_status() {
    echo -e "${BLUE}📊 Estado final:${NC}"
    echo "=================================================="

    # Obtener URL de la app
    APP_URL=$(aws amplify get-app --app-id $APP_ID --region $REGION --query 'app.defaultDomain' --output text)
    echo -e "${GREEN}🌐 URL de la app: https://$APP_URL${NC}"
    echo -e "${GREEN}📍 Región: $REGION${NC}"

    # Mostrar variables configuradas
    echo -e "${GREEN}📋 Variables configuradas:${NC}"
    echo "  NEXT_PUBLIC_API_URL = $NEXT_PUBLIC_API_URL"
    echo "  NEXT_PUBLIC_API_BASE_URL = $NEXT_PUBLIC_API_BASE_URL"
    echo "  NEXT_PUBLIC_WS_URL = $NEXT_PUBLIC_WS_URL"
    echo "  NEXT_PUBLIC_PUBLIC_TESTS_URL = $NEXT_PUBLIC_PUBLIC_TESTS_URL"

    echo ""
    echo -e "${GREEN}✅ Configuración completada exitosamente!${NC}"
    echo -e "${YELLOW}⏳ El build puede tomar unos minutos en completarse${NC}"
}

# Función principal
main() {
    check_dependencies
    check_aws_config
    find_app_region
    configure_env_vars
    restart_build
    show_status

    # Limpiar archivo temporal
    rm -f /tmp/amplify-env-vars.json
}

# Ejecutar script
main "$@"
