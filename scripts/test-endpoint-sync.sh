#!/bin/bash

# 🧪 SCRIPT DE PRUEBA DE SINCRONIZACIÓN DE ENDPOINTS
# Verifica que la sincronización automática de endpoints funcione correctamente

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuración
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backendV2"

# Función principal
main() {
    echo ""
    log_info "🧪 Iniciando pruebas de sincronización de endpoints..."
    echo ""

    # Verificar estructura de archivos
    verify_file_structure

    # Probar script de sincronización
    test_sync_script

    # Verificar archivos generados
    verify_generated_files

    # Mostrar estado actual
    show_current_status

    echo ""
    log_success "✅ Pruebas de sincronización completadas!"
    echo ""
}

# Verificar estructura de archivos
verify_file_structure() {
    log_info "📁 Verificando estructura de archivos..."

    local files_to_check=(
        "$BACKEND_DIR/scripts/post-deploy-sync.sh"
        "$PROJECT_ROOT/frontend/src/api/dynamic-endpoints.ts"
        "$PROJECT_ROOT/public-tests/src/config/dynamic-endpoints.ts"
        "$PROJECT_ROOT/config/endpoints"
    )

    local all_exist=true

    for file in "${files_to_check[@]}"; do
        if [[ -e "$file" ]]; then
            log_success "✅ $file"
        else
            log_error "❌ $file - NO ENCONTRADO"
            all_exist=false
        fi
    done

    if [[ "$all_exist" == "true" ]]; then
        log_success "Estructura de archivos verificada"
    else
        log_error "Algunos archivos requeridos no existen"
        exit 1
    fi
}

# Probar script de sincronización
test_sync_script() {
    log_info "🔧 Probando script de sincronización..."

    # Verificar que el script sea ejecutable
    if [[ ! -x "$BACKEND_DIR/scripts/post-deploy-sync.sh" ]]; then
        log_error "Script de sincronización no es ejecutable"
        exit 1
    fi

    log_success "Script de sincronización es ejecutable"

    # Simular endpoints para prueba
    export HTTP_ENDPOINT="https://test123.execute-api.us-east-1.amazonaws.com/dev"
    export WS_ENDPOINT="wss://test456.execute-api.us-east-1.amazonaws.com/dev"
    export STAGE="test"

    log_info "Ejecutando script de sincronización en modo de prueba..."

    # Crear un backup de los archivos actuales
    backup_current_files

    # Ejecutar el script
    cd "$BACKEND_DIR"
    if ./scripts/post-deploy-sync.sh; then
        log_success "Script de sincronización ejecutado correctamente"
    else
        log_error "Error al ejecutar script de sincronización"
        restore_backup_files
        exit 1
    fi

    # Restaurar archivos
    restore_backup_files
}

# Crear backup de archivos actuales
backup_current_files() {
    log_info "📦 Creando backup de archivos actuales..."

    local backup_dir="/tmp/endpoint-sync-backup-$(date +%s)"
    mkdir -p "$backup_dir"

    # Backup de archivos de endpoints
    if [[ -f "$PROJECT_ROOT/frontend/src/api/dynamic-endpoints.ts" ]]; then
        cp "$PROJECT_ROOT/frontend/src/api/dynamic-endpoints.ts" "$backup_dir/frontend-dynamic-endpoints.ts"
    fi

    if [[ -f "$PROJECT_ROOT/public-tests/src/config/dynamic-endpoints.ts" ]]; then
        cp "$PROJECT_ROOT/public-tests/src/config/dynamic-endpoints.ts" "$backup_dir/public-tests-dynamic-endpoints.ts"
    fi

    if [[ -f "$PROJECT_ROOT/config/endpoints/centralized-config.ts" ]]; then
        cp "$PROJECT_ROOT/config/endpoints/centralized-config.ts" "$backup_dir/centralized-config.ts"
    fi

    export BACKUP_DIR="$backup_dir"
    log_success "Backup creado en: $backup_dir"
}

# Restaurar archivos desde backup
restore_backup_files() {
    if [[ -n "$BACKUP_DIR" && -d "$BACKUP_DIR" ]]; then
        log_info "🔄 Restaurando archivos desde backup..."

        if [[ -f "$BACKUP_DIR/frontend-dynamic-endpoints.ts" ]]; then
            cp "$BACKUP_DIR/frontend-dynamic-endpoints.ts" "$PROJECT_ROOT/frontend/src/api/dynamic-endpoints.ts"
        fi

        if [[ -f "$BACKUP_DIR/public-tests-dynamic-endpoints.ts" ]]; then
            cp "$BACKUP_DIR/public-tests-dynamic-endpoints.ts" "$PROJECT_ROOT/public-tests/src/config/dynamic-endpoints.ts"
        fi

        if [[ -f "$BACKUP_DIR/centralized-config.ts" ]]; then
            cp "$BACKUP_DIR/centralized-config.ts" "$PROJECT_ROOT/config/endpoints/centralized-config.ts"
        fi

        # Limpiar backup
        rm -rf "$BACKUP_DIR"
        log_success "Archivos restaurados desde backup"
    fi
}

# Verificar archivos generados
verify_generated_files() {
    log_info "🔍 Verificando archivos generados..."

    local files_to_verify=(
        "$PROJECT_ROOT/frontend/src/api/dynamic-endpoints.ts"
        "$PROJECT_ROOT/public-tests/src/config/dynamic-endpoints.ts"
        "$PROJECT_ROOT/config/endpoints/centralized-config.ts"
        "$PROJECT_ROOT/config/endpoints/sync-status.json"
    )

    for file in "${files_to_verify[@]}"; do
        if [[ -f "$file" ]]; then
            local file_size=$(wc -c < "$file")
            if [[ "$file_size" -gt 0 ]]; then
                log_success "✅ $file (${file_size} bytes)"
            else
                log_warning "⚠️  $file - ARCHIVO VACÍO"
            fi
        else
            log_warning "⚠️  $file - NO ENCONTRADO"
        fi
    done
}

# Mostrar estado actual
show_current_status() {
    log_info "📊 Estado actual de la sincronización:"
    echo ""

    # Verificar endpoints en frontend
    if [[ -f "$PROJECT_ROOT/frontend/src/api/dynamic-endpoints.ts" ]]; then
        local frontend_endpoint=$(grep -o 'http: "[^"]*"' "$PROJECT_ROOT/frontend/src/api/dynamic-endpoints.ts" | cut -d'"' -f2 || echo "No encontrado")
        echo "  🖥️  Frontend: $frontend_endpoint"
    fi

    # Verificar endpoints en public-tests
    if [[ -f "$PROJECT_ROOT/public-tests/src/config/dynamic-endpoints.ts" ]]; then
        local public_tests_endpoint=$(grep -o 'http: "[^"]*"' "$PROJECT_ROOT/public-tests/src/config/dynamic-endpoints.ts" | cut -d'"' -f2 || echo "No encontrado")
        echo "  📱 Public Tests: $public_tests_endpoint"
    fi

    # Verificar configuración centralizada
    if [[ -f "$PROJECT_ROOT/config/endpoints/centralized-config.ts" ]]; then
        local central_endpoint=$(grep -o 'http: "[^"]*"' "$PROJECT_ROOT/config/endpoints/centralized-config.ts" | cut -d'"' -f2 || echo "No encontrado")
        echo "  🔄 Central Config: $central_endpoint"
    fi

    # Verificar estado de sincronización
    if [[ -f "$PROJECT_ROOT/config/endpoints/sync-status.json" ]]; then
        if command -v jq &> /dev/null; then
            local last_sync=$(jq -r '.lastSync // "No disponible"' "$PROJECT_ROOT/config/endpoints/sync-status.json" 2>/dev/null)
            local sync_stage=$(jq -r '.stage // "No disponible"' "$PROJECT_ROOT/config/endpoints/sync-status.json" 2>/dev/null)
            echo "  📅 Última sincronización: $last_sync"
            echo "  🏷️  Stage: $sync_stage"
        fi
    fi

    echo ""
    log_info "💡 Para ejecutar deploy con sincronización automática:"
    echo "   cd backendV2 && npm run deploy:dev"
    echo "   cd backendV2 && npm run deploy:prod"
    echo ""
    log_info "🔧 Para sincronización manual:"
    echo "   cd backendV2 && npm run postdeploy:dev"
    echo "   cd backendV2 && npm run postdeploy:prod"
}

# Ejecutar función principal
main "$@"
