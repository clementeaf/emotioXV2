#!/bin/bash

# 🚀 Script para configurar S3 Website Hosting
# Configura los buckets para hosting público de sitios estáticos

set -e

# Configuración
FRONTEND_BUCKET="emotioxv2-frontend"
PUBLIC_TESTS_BUCKET="emotioxv2-public-tests"
REGION="us-east-1"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Función para configurar website hosting en un bucket
configure_website_hosting() {
    local bucket_name=$1
    local index_doc=$2
    
    log_info "🔧 Configurando website hosting para $bucket_name..."
    
    # 1. Habilitar website hosting
    aws s3 website s3://$bucket_name \
        --index-document $index_doc \
        --error-document error.html \
        --region $REGION
    
    log_success "Website hosting habilitado para $bucket_name"
    
    # 2. Crear bucket policy para acceso público
    cat > /tmp/bucket-policy-$bucket_name.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$bucket_name/*"
        }
    ]
}
EOF
    
    # 3. Aplicar bucket policy
    log_info "📋 Aplicando bucket policy pública..."
    aws s3api put-bucket-policy \
        --bucket $bucket_name \
        --policy file:///tmp/bucket-policy-$bucket_name.json \
        --region $REGION
    
    log_success "Bucket policy aplicada para $bucket_name"
    
    # 4. Deshabilitar Block Public Access
    log_info "🔓 Deshabilitando Block Public Access..."
    aws s3api put-public-access-block \
        --bucket $bucket_name \
        --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
        --region $REGION
    
    log_success "Public Access configurado para $bucket_name"
    
    # Limpiar archivos temporales
    rm -f /tmp/bucket-policy-$bucket_name.json
    
    log_success "✅ Website hosting configurado completamente para $bucket_name"
    echo ""
}

# Verificar credenciales AWS
log_info "🔐 Verificando credenciales AWS..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    log_error "❌ Credenciales AWS no configuradas o inválidas"
    exit 1
fi
log_success "Credenciales AWS verificadas"

echo ""
log_info "🚀 Iniciando configuración de S3 Website Hosting..."
echo ""

# Configurar frontend
log_info "📱 CONFIGURANDO FRONTEND..."
configure_website_hosting $FRONTEND_BUCKET "index.html"

# Configurar public-tests
log_info "🧪 CONFIGURANDO PUBLIC-TESTS..."
configure_website_hosting $PUBLIC_TESTS_BUCKET "index.html"

echo ""
log_success "🎉 ¡Configuración completada!"
echo ""
log_info "📋 URLs de acceso:"
log_info "Frontend: http://$FRONTEND_BUCKET.s3-website-$REGION.amazonaws.com"
log_info "Public Tests: http://$PUBLIC_TESTS_BUCKET.s3-website-$REGION.amazonaws.com"
echo ""
log_info "⚠️  Nota: Los sitios estarán disponibles una vez que los archivos sean desplegados"