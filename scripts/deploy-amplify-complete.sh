#!/bin/bash
# deploy-amplify-complete.sh - Script maestro para despliegue completo a AWS Amplify

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones auxiliares
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

log "🚀 Iniciando despliegue completo a AWS Amplify..."

# 1. Verificar que AWS CLI esté configurado
if ! aws sts get-caller-identity &>/dev/null; then
    error "AWS CLI no está configurado o no tiene acceso"
    exit 1
fi

success "AWS CLI configurado correctamente"

# 2. IDs de aplicaciones Amplify (hardcodeados por ahora)
FRONTEND_APP_ID="d12psv9dnscmm4"
PUBLIC_TESTS_APP_ID="d2vbj9lxdnqvqq"

log "📱 Frontend App ID: $FRONTEND_APP_ID"
log "📱 Public Tests App ID: $PUBLIC_TESTS_APP_ID"

# 3. Verificar que las aplicaciones existan
log "🔍 Verificando aplicaciones Amplify..."

if ! aws amplify get-app --app-id $FRONTEND_APP_ID &>/dev/null; then
    error "Frontend app $FRONTEND_APP_ID no encontrada"
    exit 1
fi

if ! aws amplify get-app --app-id $PUBLIC_TESTS_APP_ID &>/dev/null; then
    error "Public Tests app $PUBLIC_TESTS_APP_ID no encontrada"
    exit 1
fi

success "Aplicaciones Amplify verificadas"

# 4. Obtener y actualizar URLs de Amplify
log "🔍 Actualizando URLs de Amplify..."
chmod +x scripts/get-amplify-urls.sh
./scripts/get-amplify-urls.sh

# 5. Actualizar y desplegar backend si es necesario
log "🔄 Verificando cambios en backend..."
if git diff --quiet HEAD~1..HEAD -- backendV2/ || [ "$1" == "--force-backend" ]; then
    log "📤 Exportando endpoints actualizados..."
    cd backendV2
    
    # Verificar si tenemos dependencias instaladas
    if [ ! -d "node_modules" ]; then
        log "📦 Instalando dependencias del backend..."
        npm install
    fi
    
    # Exportar endpoints
    npm run export-endpoints
    npx ts-node src/utils/endpoints-exporter.ts ../public-tests/src/config/endpoints.js
    
    # Redesplegar backend
    if [ "$1" == "--redeploy-backend" ]; then
        log "🚀 Redesplegando backend..."
        npm run deploy
    fi
    
    cd ..
    success "Endpoints actualizados"
else
    warning "No hay cambios en backend, saltando actualización"
fi

# 6. Crear branches en Amplify si no existen
log "🌿 Verificando branches en Amplify..."

# Frontend branch
if ! aws amplify get-branch --app-id $FRONTEND_APP_ID --branch-name main &>/dev/null; then
    log "🆕 Creando branch main para frontend..."
    aws amplify create-branch \
        --app-id $FRONTEND_APP_ID \
        --branch-name main \
        --stage PRODUCTION \
        --framework "Next.js - SSG" \
        --enable-auto-build \
        --build-spec file://amplify.yml \
        --environment-variables NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1 \
        --region us-east-1
    success "Branch main creado para frontend"
else
    success "Branch main ya existe para frontend"
fi

# Public Tests branch
if ! aws amplify get-branch --app-id $PUBLIC_TESTS_APP_ID --branch-name main &>/dev/null; then
    log "🆕 Creando branch main para public-tests..."
    aws amplify create-branch \
        --app-id $PUBLIC_TESTS_APP_ID \
        --branch-name main \
        --stage PRODUCTION \
        --framework "React" \
        --enable-auto-build \
        --build-spec file://amplify-public-tests.yml \
        --environment-variables NODE_ENV=production,VITE_NODE_ENV=production \
        --region us-east-1
    success "Branch main creado para public-tests"
else
    success "Branch main ya existe para public-tests"
fi

# 7. Commit cambios de configuración (si hay)
if ! git diff --quiet; then
    log "📦 Commiteando cambios de configuración..."
    git add config/ frontend/src/api/endpoints.js public-tests/src/config/endpoints.js
    git commit -m "chore: actualizar configuración Amplify y endpoints [skip ci]" || true
    
    if [ "$1" != "--no-push" ]; then
        log "🔄 Pushing cambios a GitHub..."
        git push origin main
    fi
    success "Cambios commiteados"
fi

# 8. Iniciar despliegues
log "🚀 Iniciando despliegues en Amplify..."

# Frontend
FRONTEND_JOB_ID=$(aws amplify start-job \
    --app-id $FRONTEND_APP_ID \
    --branch-name main \
    --job-type RELEASE \
    --query 'jobSummary.jobId' \
    --output text)

success "Frontend deployment iniciado (Job ID: $FRONTEND_JOB_ID)"

# Public Tests
PUBLIC_TESTS_JOB_ID=$(aws amplify start-job \
    --app-id $PUBLIC_TESTS_APP_ID \
    --branch-name main \
    --job-type RELEASE \
    --query 'jobSummary.jobId' \
    --output text)

success "Public Tests deployment iniciado (Job ID: $PUBLIC_TESTS_JOB_ID)"

# 9. Mostrar información de monitoreo
log "📊 Información de monitoreo:"
echo ""
echo "🌐 URLs de las aplicaciones:"
echo "   Frontend: https://d12psv9dnscmm4.amplifyapp.com"
echo "   Public Tests: https://d2vbj9lxdnqvqq.amplifyapp.com"
echo ""
echo "📱 Consolas de AWS Amplify:"
echo "   Frontend: https://console.aws.amazon.com/amplify/home#/$FRONTEND_APP_ID"
echo "   Public Tests: https://console.aws.amazon.com/amplify/home#/$PUBLIC_TESTS_APP_ID"
echo ""
echo "🔧 Job IDs para monitoreo:"
echo "   Frontend: $FRONTEND_JOB_ID"
echo "   Public Tests: $PUBLIC_TESTS_JOB_ID"
echo ""

# 10. Opcional: Monitorear status
if [ "$1" == "--monitor" ]; then
    log "👁️  Monitoreando estado de despliegues..."
    
    while true; do
        FRONTEND_STATUS=$(aws amplify get-job --app-id $FRONTEND_APP_ID --branch-name main --job-id $FRONTEND_JOB_ID --query 'job.summary.status' --output text 2>/dev/null || echo "UNKNOWN")
        PUBLIC_TESTS_STATUS=$(aws amplify get-job --app-id $PUBLIC_TESTS_APP_ID --branch-name main --job-id $PUBLIC_TESTS_JOB_ID --query 'job.summary.status' --output text 2>/dev/null || echo "UNKNOWN")
        
        echo -ne "\r🔄 Frontend: $FRONTEND_STATUS | Public Tests: $PUBLIC_TESTS_STATUS"
        
        if [[ "$FRONTEND_STATUS" == "SUCCEED" && "$PUBLIC_TESTS_STATUS" == "SUCCEED" ]]; then
            echo ""
            success "🎉 Ambos despliegues completados exitosamente!"
            break
        elif [[ "$FRONTEND_STATUS" == "FAILED" || "$PUBLIC_TESTS_STATUS" == "FAILED" ]]; then
            echo ""
            error "💥 Al menos un despliegue falló. Revisa las consolas de AWS."
            exit 1
        fi
        
        sleep 10
    done
fi

success "🎯 Despliegue completo iniciado exitosamente!"

log "✨ Para monitorear manualmente, ejecuta:"
log "   aws amplify get-job --app-id $FRONTEND_APP_ID --branch-name main --job-id $FRONTEND_JOB_ID"
log "   aws amplify get-job --app-id $PUBLIC_TESTS_APP_ID --branch-name main --job-id $PUBLIC_TESTS_JOB_ID"

echo ""
echo "🔐 No olvides configurar estos secrets en GitHub:"
echo "   AMPLIFY_FRONTEND_APP_ID=$FRONTEND_APP_ID"
echo "   AMPLIFY_PUBLIC_TESTS_APP_ID=$PUBLIC_TESTS_APP_ID"
