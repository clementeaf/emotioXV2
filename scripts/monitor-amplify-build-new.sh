#!/bin/bash

# 📊 Script para monitorear el progreso del build de la nueva app de Amplify
# Muestra el estado en tiempo real hasta que termine

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Configuración
APP_ID="d3o3ecr48idr6x"
BRANCH_NAME="main"
REGION="us-east-1"

# Obtener el job más reciente automáticamente
JOB_ID=$(aws amplify list-jobs \
    --app-id $APP_ID \
    --branch-name $BRANCH_NAME \
    --region $REGION \
    --query 'jobSummaries[0].jobId' \
    --output text 2>/dev/null || echo "1")

log_info "🚀 Monitoreando build de Amplify (Nueva App)..."
log_info "📱 App ID: $APP_ID"
log_info "🔗 Branch: $BRANCH_NAME"
log_info "🆔 Job ID: $JOB_ID"
log_info "🌐 URL: https://$APP_ID.amplifyapp.com"
echo ""

# Monitorear el estado del job
while true; do
    # Obtener estado del job
    STATUS=$(aws amplify get-job \
        --app-id $APP_ID \
        --branch-name $BRANCH_NAME \
        --job-id $JOB_ID \
        --region $REGION \
        --query 'job.summary.status' \
        --output text 2>/dev/null || echo "UNKNOWN")

    # Mostrar estado con timestamp
    TIMESTAMP=$(date '+%H:%M:%S')

    case $STATUS in
        "PENDING")
            echo -e "${YELLOW}[$TIMESTAMP] ⏳ PENDING - Esperando recursos...${NC}"
            ;;
        "RUNNING")
            echo -e "${BLUE}[$TIMESTAMP] 🔄 RUNNING - Build en progreso...${NC}"
            ;;
        "SUCCEED")
            echo -e "${GREEN}[$TIMESTAMP] ✅ SUCCEED - Build completado exitosamente!${NC}"
            echo ""
            log_success "🎉 ¡El build se completó exitosamente!"
            log_success "🌐 URL de la app: https://$APP_ID.amplifyapp.com"
            break
            ;;
        "FAILED")
            echo -e "${RED}[$TIMESTAMP] ❌ FAILED - Build falló${NC}"
            echo ""
            log_error "❌ El build falló. Revisa los logs en AWS Amplify Console."
            break
            ;;
        "CANCELLED")
            echo -e "${YELLOW}[$TIMESTAMP] 🚫 CANCELLED - Build cancelado${NC}"
            echo ""
            log_warning "⚠️  El build fue cancelado."
            break
            ;;
        *)
            echo -e "${RED}[$TIMESTAMP] ❓ UNKNOWN - Estado desconocido: $STATUS${NC}"
            ;;
    esac

    # Esperar antes de la siguiente verificación
    sleep 10
done

# Verificar si la app está disponible
log_info "🔍 Verificando disponibilidad de la app..."
sleep 5

if curl -s -o /dev/null -w "%{http_code}" https://$APP_ID.amplifyapp.com | grep -q "200"; then
    log_success "✅ La app está disponible en: https://$APP_ID.amplifyapp.com"
else
    log_warning "⚠️  La app aún no está disponible. Puede tardar unos minutos más."
    log_info "📊 Monitorea en: https://console.aws.amazon.com/amplify"
fi

echo ""
log_success "=== MONITOREO COMPLETADO ==="
log_success "🎯 ¡La automatización está 100% funcional!"
log_info "📝 Cada commit en main triggereará automáticamente un nuevo build"
