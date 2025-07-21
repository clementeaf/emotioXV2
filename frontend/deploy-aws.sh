#!/bin/bash

# 🚀 Script de Deploy Automatizado para AWS S3/CloudFront - EmotioXV2
# ======================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de logging
print_message() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo -e "${BLUE}================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================================${NC}"
}

# Variables de configuración
BUCKET_NAME="emotioxv2-frontend"
REGION="us-east-1"
API_URL="https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"
WS_URL="wss://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"

print_header "🚀 DEPLOY AUTOMATIZADO A AWS S3/CLOUDFRONT"
print_message "EmotioXV2 Frontend"

echo ""
print_header "📋 VERIFICACIÓN DE PREREQUISITOS"

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI no está instalado"
    print_message "Instalando AWS CLI..."
    brew install awscli
    print_success "AWS CLI instalado"
else
    print_success "AWS CLI ya está instalado"
fi

# Verificar credenciales AWS
print_message "Verificando credenciales AWS..."
if aws sts get-caller-identity &> /dev/null; then
    print_success "Credenciales AWS configuradas"
    aws sts get-caller-identity
else
    print_error "Credenciales AWS no configuradas"
    print_message "Ejecuta: aws configure"
    exit 1
fi

echo ""
print_header "🔧 CONFIGURACIÓN DE S3"

# Crear bucket S3
print_message "Creando bucket S3..."
if aws s3 ls "s3://$BUCKET_NAME" &> /dev/null; then
    print_success "Bucket S3 ya existe"
else
    aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
    print_success "Bucket S3 creado: $BUCKET_NAME"
fi

# Configurar bucket para hosting estático
print_message "Configurando bucket para hosting estático..."
aws s3 website "s3://$BUCKET_NAME" --index-document index.html --error-document error.html
print_success "Bucket configurado para hosting estático"

# Aplicar política de bucket
print_message "Aplicando política de bucket..."
aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file://bucket-policy.json
print_success "Política de bucket aplicada"

echo ""
print_header "🏗️ BUILD DE LA APLICACIÓN"

# Configurar variables de entorno
export NEXT_PUBLIC_API_URL="$API_URL"
export NEXT_PUBLIC_WS_URL="$WS_URL"
export NEXT_PUBLIC_ENV="production"

print_message "Variables de entorno configuradas:"
print_message "NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"
print_message "NEXT_PUBLIC_WS_URL: $NEXT_PUBLIC_WS_URL"

# Instalar dependencias
print_message "Instalando dependencias..."
npm ci
print_success "Dependencias instaladas"

# Build de la aplicación
print_message "Construyendo aplicación..."
npm run build
print_success "Aplicación construida"

echo ""
print_header "📤 DEPLOY A S3"

# Deploy a S3
print_message "Subiendo archivos a S3..."
aws s3 sync out/ "s3://$BUCKET_NAME" --delete
print_success "Archivos subidos a S3"

# Verificar deploy
print_message "Verificando archivos en S3..."
aws s3 ls "s3://$BUCKET_NAME" --recursive | head -10
print_success "Deploy a S3 completado"

echo ""
print_header "🌐 CONFIGURACIÓN DE CLOUDFRONT"

# Verificar si ya existe una distribución CloudFront
print_message "Verificando distribución CloudFront existente..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='EmotioXV2 Frontend'].Id" --output text)

if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    print_success "Distribución CloudFront encontrada: $DISTRIBUTION_ID"

    # Invalidar caché
    print_message "Invalidando caché de CloudFront..."
    aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
    print_success "Caché invalidada"
else
    print_warning "No se encontró distribución CloudFront"
    print_message "Crea una distribución CloudFront manualmente usando cloudfront-config.json"
fi

echo ""
print_header "✅ VERIFICACIÓN FINAL"

# URLs de acceso
S3_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
print_message "URLs de acceso:"
print_message "S3: $S3_URL"

if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    CLOUDFRONT_URL="https://$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query "Distribution.DomainName" --output text)"
    print_message "CloudFront: $CLOUDFRONT_URL"
fi

echo ""
print_header "🎯 PRÓXIMOS PASOS"

print_message "1. Verifica que la aplicación funcione en S3:"
print_message "   curl -I $S3_URL"

if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    print_message "2. Verifica que la aplicación funcione en CloudFront:"
    print_message "   curl -I $CLOUDFRONT_URL"
fi

print_message "3. Configura Lambda@Edge para redireccionamientos API"
print_message "4. Configura Lambda@Edge para headers de seguridad"

echo ""
print_success "🎉 Deploy a AWS S3/CloudFront completado"
print_message "La aplicación está disponible en S3 y CloudFront"
