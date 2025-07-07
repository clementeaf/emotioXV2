#!/bin/bash

# 🚀 Script automatizado para configurar despliegue S3/CloudFront
# Obtiene configuración de AWS automáticamente y configura GitHub Secrets

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

# Verificar AWS CLI
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI no está instalado"
        exit 1
    fi

    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "No estás autenticado con AWS CLI"
        exit 1
    fi

    log_success "AWS CLI configurado correctamente"
}

# Obtener información del repositorio
get_repo_info() {
    log_info "Obteniendo información del repositorio..."

    REMOTE_URL=$(git remote get-url origin)
    if [[ $REMOTE_URL == *"github.com"* ]]; then
        REPO_PATH=$(echo $REMOTE_URL | sed 's/.*github\.com[:/]//' | sed 's/\.git$//')
        OWNER=$(echo $REPO_PATH | cut -d'/' -f1)
        REPO=$(echo $REPO_PATH | cut -d'/' -f2)
    else
        log_error "No se pudo detectar el repositorio de GitHub"
        exit 1
    fi

    log_success "Repositorio: $OWNER/$REPO"
}

# Obtener configuración de AWS automáticamente
get_aws_config() {
    log_info "Obteniendo configuración de AWS..."

    # Obtener credenciales de AWS
    AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id)
    AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key)
    AWS_DEFAULT_REGION=$(aws configure get region || echo "us-east-1")

    if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        log_error "No se pudieron obtener las credenciales de AWS"
        exit 1
    fi

    log_success "Configuración de AWS obtenida"
    log_info "Región: $AWS_DEFAULT_REGION"
}

# Crear bucket S3 si no existe
create_s3_bucket() {
    log_info "Verificando bucket S3..."

    BUCKET_NAME="emotioxv2-public-tests"

    if ! aws s3 ls s3://$BUCKET_NAME --region $AWS_DEFAULT_REGION &> /dev/null; then
        log_info "Creando bucket S3: $BUCKET_NAME"
        aws s3 mb s3://$BUCKET_NAME --region $AWS_DEFAULT_REGION

        # Deshabilitar bloqueo de acceso público
        log_info "Deshabilitando bloqueo de acceso público..."
        aws s3api put-public-access-block \
            --bucket $BUCKET_NAME \
            --public-access-block-configuration \
            "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
            --region $AWS_DEFAULT_REGION

        # Configurar bucket para hosting web
        aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html --region $AWS_DEFAULT_REGION

        # Configurar bucket policy para acceso público
        cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF
        aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file:///tmp/bucket-policy.json --region $AWS_DEFAULT_REGION
        rm /tmp/bucket-policy.json

        log_success "Bucket S3 creado y configurado"
    else
        log_info "Bucket S3 ya existe, verificando configuración..."

        # Verificar si el bucket tiene la configuración correcta
        PUBLIC_ACCESS_BLOCK=$(aws s3api get-public-access-block --bucket $BUCKET_NAME --region $AWS_DEFAULT_REGION --query 'PublicAccessBlockConfiguration' --output json 2>/dev/null || echo '{}')

        if echo "$PUBLIC_ACCESS_BLOCK" | grep -q '"BlockPublicPolicy": true'; then
            log_info "Deshabilitando bloqueo de acceso público en bucket existente..."
            aws s3api put-public-access-block \
                --bucket $BUCKET_NAME \
                --public-access-block-configuration \
                "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" \
                --region $AWS_DEFAULT_REGION
        fi

        # Verificar bucket policy
        if ! aws s3api get-bucket-policy --bucket $BUCKET_NAME --region $AWS_DEFAULT_REGION &> /dev/null; then
            log_info "Aplicando bucket policy..."
            cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF
            aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file:///tmp/bucket-policy.json --region $AWS_DEFAULT_REGION
            rm /tmp/bucket-policy.json
        fi

        log_success "Bucket S3 configurado correctamente"
    fi
}

# Crear CloudFront distribution si no existe
create_cloudfront_distribution() {
    log_info "Verificando CloudFront distribution..."

    # Buscar distribución existente
    DISTRIBUTION_ID=$(aws cloudfront list-distributions --region $AWS_DEFAULT_REGION --query "DistributionList.Items[?Comment=='Public Tests SPA Distribution'].Id" --output text 2>/dev/null || echo "")

    if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" = "None" ]; then
        log_info "Creando CloudFront distribution..."

        # Crear configuración de CloudFront
        cat > /tmp/cloudfront-config.json << EOF
{
    "CallerReference": "public-tests-spa-config-$(date +%s)",
    "Comment": "Public Tests SPA Distribution",
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-emotioxv2-public-tests",
        "ViewerProtocolPolicy": "redirect-to-https",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    },
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-emotioxv2-public-tests",
                "DomainName": "emotioxv2-public-tests.s3.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 0
            }
        ]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
}
EOF

        # Crear distribución
        DISTRIBUTION_ID=$(aws cloudfront create-distribution --distribution-config file:///tmp/cloudfront-config.json --region $AWS_DEFAULT_REGION --query 'Distribution.Id' --output text)
        rm /tmp/cloudfront-config.json

        log_success "CloudFront distribution creada: $DISTRIBUTION_ID"
    else
        log_success "CloudFront distribution ya existe: $DISTRIBUTION_ID"
    fi
}

# Configurar GitHub Secrets
setup_github_secrets() {
    log_info "Configurando GitHub Secrets..."

    # Verificar GitHub CLI
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) no está instalado"
        exit 1
    fi

    if ! gh auth status &> /dev/null; then
        log_error "No estás autenticado con GitHub CLI"
        exit 1
    fi

    # Configurar secrets
    gh secret set AWS_ACCESS_KEY_ID --body "$AWS_ACCESS_KEY_ID" --repo "$OWNER/$REPO"
    gh secret set AWS_SECRET_ACCESS_KEY --body "$AWS_SECRET_ACCESS_KEY" --repo "$OWNER/$REPO"
    gh secret set AWS_DEFAULT_REGION --body "$AWS_DEFAULT_REGION" --repo "$OWNER/$REPO"
    gh secret set PUBLIC_TESTS_S3_BUCKET --body "emotioxv2-public-tests" --repo "$OWNER/$REPO"
    gh secret set PUBLIC_TESTS_CLOUDFRONT_DISTRIBUTION_ID --body "$DISTRIBUTION_ID" --repo "$OWNER/$REPO"

    # URLs de ejemplo (se pueden actualizar después)
    CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id $DISTRIBUTION_ID --region $AWS_DEFAULT_REGION --query 'Distribution.DomainName' --output text)
    PUBLIC_TESTS_URL="https://$CLOUDFRONT_DOMAIN"

    gh secret set VITE_PUBLIC_TESTS_URL --body "$PUBLIC_TESTS_URL" --repo "$OWNER/$REPO"
    gh secret set NEXT_PUBLIC_PUBLIC_TESTS_URL --body "$PUBLIC_TESTS_URL" --repo "$OWNER/$REPO"

    # API URL (se puede actualizar después)
    gh secret set VITE_API_BASE_URL --body "https://api.emotioxv2.com" --repo "$OWNER/$REPO"

    log_success "GitHub Secrets configurados"
}

# Actualizar script de despliegue
update_deploy_script() {
    log_info "Actualizando script de despliegue..."

    # Actualizar variables en el script
    sed -i.bak "s/BUCKET=\"emotioxv2-public-tests-bucket\"/BUCKET=\"emotioxv2-public-tests\"/" scripts/deploy/deploy-public-tests.sh
    sed -i.bak "s/DISTRIBUTION_ID=\"E2X8HCFI5FM1EC\"/DISTRIBUTION_ID=\"$DISTRIBUTION_ID\"/" scripts/deploy/deploy-public-tests.sh
    sed -i.bak "s/REGION=\"us-east-1\"/REGION=\"$AWS_DEFAULT_REGION\"/" scripts/deploy/deploy-public-tests.sh

    # Hacer el script ejecutable
    chmod +x scripts/deploy/deploy-public-tests.sh

    log_success "Script de despliegue actualizado"
}

# Probar despliegue
test_deployment() {
    log_info "Probando despliegue..."

    # Build del proyecto
    cd public-tests
    npm ci
    npm run build
    cd ..

    # Despliegue de prueba
    ./scripts/deploy/deploy-public-tests.sh

    log_success "Despliegue de prueba completado"
}

# Mostrar resumen
show_summary() {
    log_info "Resumen de configuración:"
    echo "=================================="
    echo "🔑 AWS Configuration:"
    echo "  - Access Key ID: ${AWS_ACCESS_KEY_ID:0:10}..."
    echo "  - Region: $AWS_DEFAULT_REGION"
    echo ""
    echo "🪣 S3 Bucket:"
    echo "  - Name: emotioxv2-public-tests"
    echo "  - URL: https://emotioxv2-public-tests.s3.$AWS_DEFAULT_REGION.amazonaws.com"
    echo ""
    echo "🌐 CloudFront Distribution:"
    echo "  - ID: $DISTRIBUTION_ID"
    echo "  - Domain: $CLOUDFRONT_DOMAIN"
    echo "  - URL: https://$CLOUDFRONT_DOMAIN"
    echo ""
    echo "🔧 GitHub Secrets configurados:"
    echo "  - AWS_ACCESS_KEY_ID"
    echo "  - AWS_SECRET_ACCESS_KEY"
    echo "  - AWS_DEFAULT_REGION"
    echo "  - PUBLIC_TESTS_S3_BUCKET"
    echo "  - PUBLIC_TESTS_CLOUDFRONT_DISTRIBUTION_ID"
    echo "  - VITE_PUBLIC_TESTS_URL"
    echo "  - NEXT_PUBLIC_PUBLIC_TESTS_URL"
    echo "  - VITE_API_BASE_URL"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Haz push a main para activar el workflow automático"
    echo "2. Monitorea el despliegue en GitHub Actions"
    echo "3. Actualiza VITE_API_BASE_URL con tu API real"
    echo "4. Configura un dominio personalizado si es necesario"
}

# Función principal
main() {
    echo "🚀 Configuración Automatizada de S3/CloudFront"
    echo "=============================================="

    check_aws_cli
    get_repo_info
    get_aws_config
    create_s3_bucket
    create_cloudfront_distribution
    setup_github_secrets
    update_deploy_script
    test_deployment
    show_summary

    log_success "¡Configuración completada exitosamente!"
}

# Ejecutar función principal
main "$@"
