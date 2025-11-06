#!/bin/bash

# Script para crear CloudFront distribution para el frontend de EmotioXV2
# Bucket: emotioxv2-frontend-041238861016

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

BUCKET="emotioxv2-frontend-041238861016"
REGION="us-east-1"
CONFIG_FILE="config/aws/frontend-cloudfront-config.json"

log_info "🚀 Creando CloudFront distribution para frontend..."
log_info "📦 Bucket S3: $BUCKET"
log_info "🌍 Región: $REGION"

# Verificar que el bucket existe
log_info "🔍 Verificando que el bucket S3 existe..."
if ! aws s3 ls "s3://$BUCKET" --region $REGION >/dev/null 2>&1; then
    log_error "❌ El bucket $BUCKET no existe"
    exit 1
fi
log_success "✅ Bucket S3 verificado"

# Verificar que el archivo de configuración existe
if [ ! -f "$CONFIG_FILE" ]; then
    log_error "❌ Archivo de configuración no encontrado: $CONFIG_FILE"
    exit 1
fi

# Generar CallerReference único
CALLER_REF="emotioxv2-frontend-$(date +%s)"
log_info "📝 CallerReference: $CALLER_REF"

# Crear archivo temporal con CallerReference actualizado
TEMP_CONFIG=$(mktemp)
sed "s/\"CallerReference\": \".*\"/\"CallerReference\": \"$CALLER_REF\"/" "$CONFIG_FILE" > "$TEMP_CONFIG"

# Crear la distribución
log_info "🔄 Creando distribución de CloudFront..."
DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution \
    --distribution-config "file://$TEMP_CONFIG" \
    --region $REGION 2>&1)

if [ $? -ne 0 ]; then
    log_error "❌ Error al crear distribución de CloudFront:"
    echo "$DISTRIBUTION_OUTPUT"
    rm -f "$TEMP_CONFIG"
    exit 1
fi

# Extraer el ID de la distribución
DISTRIBUTION_ID=$(echo "$DISTRIBUTION_OUTPUT" | jq -r '.Distribution.Id // empty')
DOMAIN_NAME=$(echo "$DISTRIBUTION_OUTPUT" | jq -r '.Distribution.DomainName // empty')

if [ -z "$DISTRIBUTION_ID" ] || [ -z "$DOMAIN_NAME" ]; then
    log_error "❌ No se pudo extraer el ID o dominio de la distribución"
    echo "$DISTRIBUTION_OUTPUT"
    rm -f "$TEMP_CONFIG"
    exit 1
fi

rm -f "$TEMP_CONFIG"

log_success "✅ CloudFront distribution creada exitosamente"
echo ""
echo "📊 Información de la distribución:"
echo "   Distribution ID: $DISTRIBUTION_ID"
echo "   Domain Name: $DOMAIN_NAME"
echo "   URL: https://$DOMAIN_NAME"
echo ""

log_info "⏱️  Nota: La distribución puede tardar 5-15 minutos en estar completamente activa."
log_info "   Puedes verificar el estado con:"
echo "   aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status' --output text"
echo ""

log_info "🔧 Próximos pasos:"
echo "   1. Configurar el secret en GitHub:"
echo "      gh secret set FRONTEND_CLOUDFRONT_DISTRIBUTION_ID --body \"$DISTRIBUTION_ID\""
echo ""
echo "   2. Esperar a que la distribución esté activa (Status: Deployed)"
echo ""
echo "   3. El workflow automático comenzará a invalidar CloudFront en cada deploy"
echo ""

log_success "🎉 ¡Configuración completada!"

