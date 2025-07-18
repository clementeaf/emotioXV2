#!/bin/bash

# 🔧 EmotioXV2 - Fix Urgente para Public-Tests
# Corrige el ID de CloudFront incorrecto en scripts de deployment

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de logging
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# IDs correcto e incorrecto
WRONG_ID="E2X8HCFI5FM1EC"
CORRECT_ID="E2X8HCFI5FM1EC"

main() {
    echo ""
    log_info "🔧 Corrigiendo ID de CloudFront incorrecto en scripts de public-tests..."
    echo ""

    # Buscar archivos con ID incorrecto
    find_and_fix_files

    # Verificar configuración actual
    verify_cloudfront_config

    # Test del script corregido
    test_deployment_script

    echo ""
    log_success "✅ Fix urgente completado!"
    echo ""
}

find_and_fix_files() {
    log_info "Buscando archivos con ID incorrecto..."

    # Buscar archivos que contengan el ID incorrecto
    files_with_wrong_id=$(grep -r "$WRONG_ID" scripts/ || true)
    
    if [ -z "$files_with_wrong_id" ]; then
        log_warning "No se encontraron archivos con ID incorrecto"
        return
    fi

    echo ""
    log_info "📁 Archivos que requieren corrección:"
    echo "$files_with_wrong_id"
    echo ""

    # Corregir cada archivo encontrado
    while IFS= read -r line; do
        file=$(echo "$line" | cut -d: -f1)
        if [ -f "$file" ]; then
            log_info "Corrigiendo: $file"
            
            # Crear backup
            cp "$file" "$file.backup-$(date +%Y%m%d-%H%M%S)"
            
            # Reemplazar ID incorrecto por correcto
            sed -i.tmp "s/$WRONG_ID/$CORRECT_ID/g" "$file"
            rm "$file.tmp"
            
            log_success "✓ $file corregido"
        fi
    done <<< "$(grep -l "$WRONG_ID" scripts/* 2>/dev/null || true)"
}

verify_cloudfront_config() {
    log_info "Verificando configuración de CloudFront..."

    # Verificar que el ID correcto existe y está activo
    status=$(aws cloudfront get-distribution --id "$CORRECT_ID" --query "Distribution.Status" --output text 2>/dev/null || echo "ERROR")
    
    if [ "$status" = "ERROR" ]; then
        log_error "❌ No se puede acceder a la distribución $CORRECT_ID"
        exit 1
    elif [ "$status" = "Deployed" ]; then
        log_success "✅ CloudFront Distribution $CORRECT_ID está activa"
    else
        log_warning "⚠️ CloudFront Distribution $CORRECT_ID está en estado: $status"
    fi

    # Verificar URL de public-tests
    log_info "Verificando URL de public-tests..."
    url_status=$(curl -s -o /dev/null -w "%{http_code}" "https://d2zt8ia21te5mv.cloudfront.net/" || echo "ERROR")
    
    if [ "$url_status" = "200" ]; then
        log_success "✅ Public-tests responde correctamente (200)"
    else
        log_warning "⚠️ Public-tests responde con status: $url_status"
    fi
}

test_deployment_script() {
    log_info "Verificando script de deployment corregido..."

    deploy_script="scripts/deploy/deploy-public-tests.sh"
    
    if [ -f "$deploy_script" ]; then
        # Verificar que el script ahora tiene el ID correcto
        if grep -q "$CORRECT_ID" "$deploy_script"; then
            log_success "✅ Script de deployment tiene el ID correcto"
        else
            log_error "❌ Script de deployment aún tiene problemas"
            return 1
        fi

        # Verificar sintaxis del script
        if bash -n "$deploy_script"; then
            log_success "✅ Sintaxis del script es válida"
        else
            log_error "❌ Script tiene errores de sintaxis"
            return 1
        fi
    else
        log_warning "⚠️ Script de deployment no encontrado"
    fi
}

show_summary() {
    echo ""
    log_info "📋 Resumen de correcciones aplicadas:"
    echo ""
    echo "🔧 **ID Corregido:**"
    echo "  Antes: $WRONG_ID (❌ Frontend)"
    echo "  Ahora: $CORRECT_ID (✅ Public-tests)"
    echo ""
    echo "📁 **Archivos corregidos:**"
    ls -la scripts/*.backup-* 2>/dev/null | wc -l | xargs echo "  Backups creados:"
    echo ""
    echo "🌐 **URLs verificadas:**"
    echo "  Public-tests: https://d2zt8ia21te5mv.cloudfront.net/"
    echo "  CloudFront ID: $CORRECT_ID"
    echo ""
    echo "✅ **Próximos pasos:**"
    echo "  1. Test deployment: ./scripts/deploy/deploy-public-tests.sh"
    echo "  2. Considerar migración a Amplify para mejor CI/CD"
    echo ""
}

# Ejecutar función principal
main
show_summary
