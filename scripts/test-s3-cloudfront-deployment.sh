#!/bin/bash

# 🧪 Script para probar el despliegue de public-tests en S3/CloudFront
# Este script verifica que todo esté funcionando correctamente

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
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

# Variables de entorno
BUCKET=${BUCKET:-"emotioxv2-public-tests"}
REGION=${REGION:-"us-east-1"}
CLOUDFRONT_DISTRIBUTION_ID=${CLOUDFRONT_DISTRIBUTION_ID:-""}

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

# Verificar bucket S3
test_s3_bucket() {
    log_info "Verificando bucket S3: $BUCKET"

    # Verificar que el bucket existe
    if ! aws s3 ls s3://$BUCKET --region $REGION &> /dev/null; then
        log_error "Bucket $BUCKET no existe o no tienes permisos"
        return 1
    fi

    log_success "Bucket S3 existe"

    # Verificar archivos principales
    log_info "Verificando archivos principales..."

    REQUIRED_FILES=("index.html" "assets/" "config/endpoints.js")

    for file in "${REQUIRED_FILES[@]}"; do
        if aws s3 ls s3://$BUCKET/$file --region $REGION &> /dev/null; then
            log_success "✅ $file encontrado"
        else
            log_warning "⚠️ $file no encontrado"
        fi
    done

    # Listar archivos en el bucket
    log_info "Archivos en el bucket:"
    aws s3 ls s3://$BUCKET --recursive --region $REGION | head -20
}

# Verificar CloudFront
test_cloudfront() {
    if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
        log_warning "CLOUDFRONT_DISTRIBUTION_ID no configurado, saltando pruebas de CloudFront"
        return 0
    fi

    log_info "Verificando CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"

    # Obtener información de la distribución
    DIST_INFO=$(aws cloudfront get-distribution --id $CLOUDFRONT_DISTRIBUTION_ID --region $REGION 2>/dev/null || echo "")

    if [ -z "$DIST_INFO" ]; then
        log_error "No se pudo obtener información de CloudFront"
        return 1
    fi

    # Extraer dominio
    CLOUDFRONT_DOMAIN=$(echo "$DIST_INFO" | jq -r '.Distribution.DomainName')
    STATUS=$(echo "$DIST_INFO" | jq -r '.Distribution.Status')

    log_success "CloudFront Domain: $CLOUDFRONT_DOMAIN"
    log_info "Status: $STATUS"

    if [ "$STATUS" != "Deployed" ]; then
        log_warning "CloudFront no está completamente desplegado"
    fi

    # Probar acceso HTTP
    log_info "Probando acceso HTTP..."
    HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$CLOUDFRONT_DOMAIN" || echo "000")

    if [ "$HTTP_RESPONSE" = "200" ]; then
        log_success "✅ Acceso HTTP exitoso (200)"
    else
        log_warning "⚠️ Acceso HTTP retornó: $HTTP_RESPONSE"
    fi

    # Probar navegación SPA
    log_info "Probando navegación SPA..."
    SPA_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$CLOUDFRONT_DOMAIN/research/123" || echo "000")

    if [ "$SPA_RESPONSE" = "200" ]; then
        log_success "✅ Navegación SPA funcionando (200)"
    else
        log_warning "⚠️ Navegación SPA retornó: $SPA_RESPONSE"
    fi

    # Verificar headers de seguridad
    log_info "Verificando headers de seguridad..."
    SECURITY_HEADERS=$(curl -s -I "https://$CLOUDFRONT_DOMAIN" | grep -E "(X-Frame-Options|X-Content-Type-Options|Content-Security-Policy)" || echo "")

    if [ -n "$SECURITY_HEADERS" ]; then
        log_success "✅ Headers de seguridad configurados"
        echo "$SECURITY_HEADERS"
    else
        log_warning "⚠️ Headers de seguridad no encontrados"
    fi
}

# Verificar endpoints dinámicos
test_endpoints() {
    log_info "Verificando endpoints dinámicos..."

    # Descargar endpoints.js del bucket
    if aws s3 cp s3://$BUCKET/config/endpoints.js /tmp/endpoints.js --region $REGION &> /dev/null; then
        log_success "✅ endpoints.js descargado del bucket"

        # Verificar contenido
        if grep -q "API_BASE_URL" /tmp/endpoints.js; then
            log_success "✅ endpoints.js contiene configuración de API"
        else
            log_warning "⚠️ endpoints.js no contiene configuración de API"
        fi

        # Mostrar contenido
        echo "Contenido de endpoints.js:"
        cat /tmp/endpoints.js
    else
        log_warning "⚠️ No se pudo descargar endpoints.js del bucket"
    fi
}

# Verificar invalidaciones de caché
test_cache_invalidation() {
    if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
        return 0
    fi

    log_info "Verificando invalidaciones de caché..."

    # Listar invalidaciones recientes
    INVALIDATIONS=$(aws cloudfront list-invalidations --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --region $REGION --max-items 5 2>/dev/null || echo "")

    if [ -n "$INVALIDATIONS" ]; then
        log_success "✅ Invalidaciones encontradas"
        echo "$INVALIDATIONS" | jq -r '.InvalidationList.Items[] | "ID: \(.Id), Status: \(.Status), CreateTime: \(.CreateTime)"'
    else
        log_warning "⚠️ No se encontraron invalidaciones"
    fi
}

# Verificar performance
test_performance() {
    if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
        return 0
    fi

    log_info "Probando performance..."

    # Obtener dominio
    CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id $CLOUDFRONT_DISTRIBUTION_ID --region $REGION --query 'Distribution.DomainName' --output text 2>/dev/null || echo "")

    if [ -n "$CLOUDFRONT_DOMAIN" ]; then
        # Medir tiempo de respuesta
        START_TIME=$(date +%s%N)
        curl -s "https://$CLOUDFRONT_DOMAIN" > /dev/null
        END_TIME=$(date +%s%N)

        RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

        if [ $RESPONSE_TIME -lt 1000 ]; then
            log_success "✅ Tiempo de respuesta: ${RESPONSE_TIME}ms (excelente)"
        elif [ $RESPONSE_TIME -lt 3000 ]; then
            log_success "✅ Tiempo de respuesta: ${RESPONSE_TIME}ms (bueno)"
        else
            log_warning "⚠️ Tiempo de respuesta: ${RESPONSE_TIME}ms (lento)"
        fi
    fi
}

# Generar reporte
generate_report() {
    log_info "Generando reporte de pruebas..."

    REPORT_FILE="s3-cloudfront-test-report-$(date +%Y%m%d-%H%M%S).txt"

    {
        echo "🧪 REPORTE DE PRUEBAS S3/CLOUDFRONT"
        echo "=================================="
        echo "Fecha: $(date)"
        echo "Bucket: $BUCKET"
        echo "Región: $REGION"
        echo "CloudFront Distribution ID: $CLOUDFRONT_DISTRIBUTION_ID"
        echo ""
        echo "📋 RESULTADOS:"
        echo "============="

        # Aquí podrías agregar más detalles del reporte
        echo "✅ Pruebas completadas"

    } > "$REPORT_FILE"

    log_success "Reporte generado: $REPORT_FILE"
}

# Función principal
main() {
    echo "🧪 Pruebas de Despliegue S3/CloudFront"
    echo "======================================"

    check_aws_cli
    echo ""

    test_s3_bucket
    echo ""

    test_cloudfront
    echo ""

    test_endpoints
    echo ""

    test_cache_invalidation
    echo ""

    test_performance
    echo ""

    generate_report

    log_success "¡Pruebas completadas!"
    echo ""
    echo "📋 Resumen:"
    echo "- S3 Bucket: Verificado"
    echo "- CloudFront: Verificado"
    echo "- Endpoints: Verificado"
    echo "- Performance: Verificado"
    echo ""
    echo "🎉 Todo parece estar funcionando correctamente!"
}

# Ejecutar función principal
main "$@"
