#!/bin/bash
# deploy-manual-amplify.sh - Script para despliegue manual a Amplify

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# IDs de aplicaciones
FRONTEND_APP_ID="d12psv9dnscmm4"
PUBLIC_TESTS_APP_ID="d2vbj9lxdnqvqq"

log "🚀 Iniciando despliegue manual a AWS Amplify..."

# Función para build y deploy de frontend
deploy_frontend() {
    log "🏗️  Building frontend..."
    cd frontend
    
    # Instalar dependencias si es necesario
    if [ ! -d "node_modules" ]; then
        log "📦 Instalando dependencias del frontend..."
        npm install
    fi
    
    # Build
    log "🔨 Construyendo frontend..."
    npm run build
    
    # Comprimir artifacts
    log "📦 Comprimiendo artifacts..."
    cd out
    zip -r ../frontend-build.zip .
    cd ..
    
    # Crear deployment
    log "🚀 Creando deployment en Amplify..."
    DEPLOYMENT_RESPONSE=$(aws amplify create-deployment \
        --app-id $FRONTEND_APP_ID \
        --branch-name main \
        --output json)
    
    JOB_ID=$(echo $DEPLOYMENT_RESPONSE | jq -r '.jobId')
    UPLOAD_URL=$(echo $DEPLOYMENT_RESPONSE | jq -r '.zipUploadUrl')
    
    log "📤 Subiendo artifacts (Job ID: $JOB_ID)..."
    curl -X PUT "$UPLOAD_URL" \
        -H "Content-Type: application/zip" \
        --data-binary @frontend-build.zip
    
    # Iniciar deployment
    log "▶️  Iniciando deployment..."
    aws amplify start-deployment \
        --app-id $FRONTEND_APP_ID \
        --branch-name main \
        --job-id $JOB_ID
    
    success "Frontend deployment iniciado (Job ID: $JOB_ID)"
    
    # Cleanup
    rm frontend-build.zip
    cd ..
    
    echo $JOB_ID
}

# Función para build y deploy de public-tests
deploy_public_tests() {
    log "🏗️  Building public-tests..."
    cd public-tests
    
    # Instalar dependencias si es necesario
    if [ ! -d "node_modules" ]; then
        log "📦 Instalando dependencias de public-tests..."
        npm install
    fi
    
    # Build
    log "🔨 Construyendo public-tests..."
    npm run build
    
    # Comprimir artifacts
    log "📦 Comprimiendo artifacts..."
    cd dist
    zip -r ../public-tests-build.zip .
    cd ..
    
    # Crear deployment
    log "🚀 Creando deployment en Amplify..."
    DEPLOYMENT_RESPONSE=$(aws amplify create-deployment \
        --app-id $PUBLIC_TESTS_APP_ID \
        --branch-name main \
        --output json)
    
    JOB_ID=$(echo $DEPLOYMENT_RESPONSE | jq -r '.jobId')
    UPLOAD_URL=$(echo $DEPLOYMENT_RESPONSE | jq -r '.zipUploadUrl')
    
    log "📤 Subiendo artifacts (Job ID: $JOB_ID)..."
    curl -X PUT "$UPLOAD_URL" \
        -H "Content-Type: application/zip" \
        --data-binary @public-tests-build.zip
    
    # Iniciar deployment
    log "▶️  Iniciando deployment..."
    aws amplify start-deployment \
        --app-id $PUBLIC_TESTS_APP_ID \
        --branch-name main \
        --job-id $JOB_ID
    
    success "Public-tests deployment iniciado (Job ID: $JOB_ID)"
    
    # Cleanup
    rm public-tests-build.zip
    cd ..
    
    echo $JOB_ID
}

# Verificar que jq esté instalado
if ! command -v jq &> /dev/null; then
    error "jq no está instalado. Instalando..."
    if command -v brew &> /dev/null; then
        brew install jq
    else
        error "Por favor instala jq manualmente"
        exit 1
    fi
fi

# Ejecutar despliegues
if [ "$1" == "frontend" ] || [ "$1" == "both" ] || [ -z "$1" ]; then
    FRONTEND_JOB_ID=$(deploy_frontend)
fi

if [ "$1" == "public-tests" ] || [ "$1" == "both" ] || [ -z "$1" ]; then
    PUBLIC_TESTS_JOB_ID=$(deploy_public_tests)
fi

# Mostrar información
log "📊 Información de despliegue:"
echo ""
echo "🌐 URLs de acceso:"
echo "   Frontend: https://d12psv9dnscmm4.amplifyapp.com"
echo "   Public Tests: https://d2vbj9lxdnqvqq.amplifyapp.com"
echo ""
echo "📱 Consolas de monitoreo:"
echo "   Frontend: https://console.aws.amazon.com/amplify/home#/$FRONTEND_APP_ID"
echo "   Public Tests: https://console.aws.amazon.com/amplify/home#/$PUBLIC_TESTS_APP_ID"
echo ""

if [ ! -z "$FRONTEND_JOB_ID" ]; then
    echo "🔧 Frontend Job ID: $FRONTEND_JOB_ID"
fi

if [ ! -z "$PUBLIC_TESTS_JOB_ID" ]; then
    echo "🔧 Public Tests Job ID: $PUBLIC_TESTS_JOB_ID"
fi

success "🎯 Despliegue(s) manual(es) iniciado(s) exitosamente!"

# Opcional: Monitorear
if [ "$2" == "--monitor" ]; then
    log "👁️  Monitoreando deployments..."
    while true; do
        if [ ! -z "$FRONTEND_JOB_ID" ]; then
            FRONTEND_STATUS=$(aws amplify get-job --app-id $FRONTEND_APP_ID --branch-name main --job-id $FRONTEND_JOB_ID --query 'job.summary.status' --output text 2>/dev/null || echo "UNKNOWN")
        else
            FRONTEND_STATUS="SKIPPED"
        fi
        
        if [ ! -z "$PUBLIC_TESTS_JOB_ID" ]; then
            PUBLIC_TESTS_STATUS=$(aws amplify get-job --app-id $PUBLIC_TESTS_APP_ID --branch-name main --job-id $PUBLIC_TESTS_JOB_ID --query 'job.summary.status' --output text 2>/dev/null || echo "UNKNOWN")
        else
            PUBLIC_TESTS_STATUS="SKIPPED"
        fi
        
        echo -ne "\r🔄 Frontend: $FRONTEND_STATUS | Public Tests: $PUBLIC_TESTS_STATUS"
        
        # Check if both completed successfully
        FRONTEND_DONE=$([ "$FRONTEND_STATUS" == "SUCCEED" ] || [ "$FRONTEND_STATUS" == "SKIPPED" ] && echo "true" || echo "false")
        PUBLIC_TESTS_DONE=$([ "$PUBLIC_TESTS_STATUS" == "SUCCEED" ] || [ "$PUBLIC_TESTS_STATUS" == "SKIPPED" ] && echo "true" || echo "false")
        
        if [ "$FRONTEND_DONE" == "true" ] && [ "$PUBLIC_TESTS_DONE" == "true" ]; then
            echo ""
            success "🎉 Todos los despliegues completados exitosamente!"
            break
        elif [ "$FRONTEND_STATUS" == "FAILED" ] || [ "$PUBLIC_TESTS_STATUS" == "FAILED" ]; then
            echo ""
            error "💥 Al menos un despliegue falló. Revisa las consolas de AWS."
            exit 1
        fi
        
        sleep 10
    done
fi
