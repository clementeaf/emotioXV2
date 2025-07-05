#!/bin/bash

# 🚀 EmotioXv2 Frontend Deployment to S3/CloudFront
# Automated deployment script with professional error handling

set -e

# Variables de configuración
PROJECT_NAME="emotiox-frontend"
STAGE="${1:-prod}"
REGION="us-east-1"
BUCKET_NAME="${PROJECT_NAME}-${STAGE}-$(date +%s)"
DISTRIBUTION_NAME="${PROJECT_NAME}-${STAGE}"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Validar dependencias
check_dependencies() {
    log_info "Validando dependencias..."
    
    if ! command -v aws /dev/null; then
        log_error "AWS CLI no está instalado"
        exit 1
    fi
    
    if ! command -v node /dev/null; then
        log_error "Node.js no está instalado"
        exit 1
    fi
    
    if ! command -v npm /dev/null; then
        log_error "npm no está instalado"
        exit 1
    fi
    
    # Verificar credenciales AWS
    if ! aws sts get-caller-identity /dev/null; then
        log_error "AWS CLI no está configurado correctamente"
        exit 1
    fi
    
    log_success "Todas las dependencias están disponibles"
}

# Limpiar builds anteriores
clean_build() {
    log_info "Limpiando builds anteriores..."
    
    cd frontend
    
    if [ -d ".next" ]; then
        rm -rf .next
        log_success "Directorio .next eliminado"
    fi
    
    if [ -d "out" ]; then
        rm -rf out
        log_success "Directorio out eliminado"
    fi
    
    cd ..
}

# Instalar dependencias
install_dependencies() {
    log_info "Instalando dependencias del frontend..."
    
    cd frontend
    
    if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
        npm ci --production=false
        log_success "Dependencias instaladas"
    else
        log_info "Dependencias ya están actualizadas"
    fi
    
    cd ..
}

# Configurar variables de entorno para build
setup_env() {
    log_info "Configurando variables de entorno para ${STAGE}..."
    
    cd frontend
    
    # Crear archivo .env.local para el build
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_WS_URL=wss://0x3ndqqhe9.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_ENV=${STAGE}
NODE_ENV=production
EOF
    
    log_success "Variables de entorno configuradas"
    cd ..
}

# Build del frontend
build_frontend() {
    log_info "Construyendo frontend para ${STAGE}..."
    
    cd frontend
    
    # Actualizar next.config.js para export estático
    cat > next.config.temp.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  experimental: {
    scrollRestoration: true,
    externalDir: true
  },
  transpilePackages: ['../shared'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  }
}

module.exports = nextConfig
EOF
    
    # Hacer backup y usar la nueva config
    if [ -f "next.config.js" ]; then
        mv next.config.js next.config.js.backup
    fi
    mv next.config.temp.js next.config.js
    
    # Build del proyecto
    npm run build
    
    # Restaurar config original
    if [ -f "next.config.js.backup" ]; then
        mv next.config.js.backup next.config.js
    fi
    
    if [ ! -d "out" ]; then
        log_error "El build falló - directorio 'out' no fue creado"
        exit 1
    fi
    
    log_success "Build completado exitosamente"
    cd ..
}

# Crear bucket S3
create_s3_bucket() {
    log_info "Creando bucket S3: ${BUCKET_NAME}..."
    
    # Verificar si el bucket ya existe
    if aws s3api head-bucket --bucket "${BUCKET_NAME}" 2>/dev/null; then
        log_warning "Bucket ${BUCKET_NAME} ya existe"
        return 0
    fi
    
    # Crear bucket
    aws s3api create-bucket \
        --bucket "${BUCKET_NAME}" \
        --region "${REGION}" \
        --create-bucket-configuration LocationConstraint="${REGION}" 2>/dev/null || {
        # Para us-east-1 no se necesita LocationConstraint
        aws s3api create-bucket \
            --bucket "${BUCKET_NAME}" \
            --region "${REGION}"
    }
    
    # Configurar bucket para hosting web
    aws s3api put-bucket-website \
        --bucket "${BUCKET_NAME}" \
        --website-configuration '{
            "IndexDocument": {"Suffix": "index.html"},
            "ErrorDocument": {"Key": "index.html"}
        }'
    
    # Configurar policy para acceso público
    aws s3api put-bucket-policy \
        --bucket "${BUCKET_NAME}" \
        --policy '{
            "Version": "2012-10-17",
            "Statement": [{
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::'"${BUCKET_NAME}"'/*"
            }]
        }'
    
    # Desactivar bloqueo de acceso público
    aws s3api put-public-access-block \
        --bucket "${BUCKET_NAME}" \
        --public-access-block-configuration \
        "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
    
    log_success "Bucket S3 creado y configurado: ${BUCKET_NAME}"
}

# Subir archivos a S3
upload_to_s3() {
    log_info "Subiendo archivos a S3..."
    
    cd frontend
    
    # Sync con optimizaciones
    aws s3 sync out/ s3://"${BUCKET_NAME}"/ \
        --delete \
        --cache-control "public, max-age=31536000" \
        --exclude "*.html" \
        --exclude "*.json"
    
    # Subir archivos HTML con cache más corto
    aws s3 sync out/ s3://"${BUCKET_NAME}"/ \
        --cache-control "public, max-age=0, must-revalidate" \
        --include "*.html" \
        --include "*.json"
    
    log_success "Archivos subidos a S3"
    cd ..
}

# Crear distribución CloudFront
create_cloudfront() {
    log_info "Creando distribución CloudFront..."
    
    # Crear configuración de CloudFront
    cat > cloudfront-config.json << EOF
{
    "CallerReference": "${DISTRIBUTION_NAME}-$(date +%s)",
    "Comment": "EmotioXv2 Frontend Distribution - ${STAGE}",
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "${BUCKET_NAME}",
                "DomainName": "${BUCKET_NAME}.s3.amazonaws.com",
                "CustomOriginConfig": {
                    "HTTPPort": 80,
                    "HTTPSPort": 443,
                    "OriginProtocolPolicy": "http-only"
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "${BUCKET_NAME}",
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 0,
        "ForwardedValues": {
            "QueryString": true,
            "Cookies": {
                "Forward": "none"
            }
        },
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        }
    },
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 300
            }
        ]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_All"
}
EOF
    
    # Crear distribución
    DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution \
        --distribution-config file://cloudfront-config.json \
        --output json)
    
    DISTRIBUTION_ID=$(echo "$DISTRIBUTION_OUTPUT" | jq -r '.Distribution.Id')
    DISTRIBUTION_DOMAIN=$(echo "$DISTRIBUTION_OUTPUT" | jq -r '.Distribution.DomainName')
    
    # Limpiar archivo temporal
    rm cloudfront-config.json
    
    log_success "Distribución CloudFront creada:"
    log_info "  ID: ${DISTRIBUTION_ID}"
    log_info "  Dominio: ${DISTRIBUTION_DOMAIN}"
    log_info "  URL: https://${DISTRIBUTION_DOMAIN}"
    
    # Guardar información para referencia
    cat > deployment-info.json << EOF
{
    "deployment_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "stage": "${STAGE}",
    "s3_bucket": "${BUCKET_NAME}",
    "cloudfront_id": "${DISTRIBUTION_ID}",
    "cloudfront_domain": "${DISTRIBUTION_DOMAIN}",
    "url": "https://${DISTRIBUTION_DOMAIN}",
    "region": "${REGION}"
}
EOF
    
    log_success "Información de deployment guardada en deployment-info.json"
}

# Función principal
main() {
    log_info "🚀 Iniciando deployment de EmotioXv2 Frontend a S3/CloudFront"
    log_info "Etapa: ${STAGE}"
    log_info "Región: ${REGION}"
    
    check_dependencies
    clean_build
    install_dependencies
    setup_env
    build_frontend
    create_s3_bucket
    upload_to_s3
    create_cloudfront
    
    log_success "🎉 Deployment completado exitosamente!"
    log_info "📋 Información del deployment:"
    log_info "  S3 Bucket: ${BUCKET_NAME}"
    log_info "  CloudFront: En propagación (puede tomar 10-15 minutos)"
    log_info "  Verifica deployment-info.json para más detalles"
    
    # Mostrar siguiente pasos
    echo ""
    echo "🔍 Próximos pasos:"
    echo "1. Espera 10-15 minutos para la propagación de CloudFront"
    echo "2. Verifica la URL en deployment-info.json"
    echo "3. Actualiza los DNS si es necesario"
    echo "4. Realiza pruebas de funcionalidad"
}

# Ejecutar función principal
main "$@"


