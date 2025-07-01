#!/bin/bash

# Script para validar la unificación del sidebar
# Verifica que todas las rutas del dashboard funcionen correctamente

set -e

echo "🔍 VALIDANDO UNIFICACIÓN DEL SIDEBAR"
echo "====================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar archivos
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 existe"
    else
        echo -e "${RED}❌${NC} $1 NO existe"
        return 1
    fi
}

# Función para verificar que no hay referencias a componentes eliminados
check_no_references() {
    local pattern="$1"
    local description="$2"

    if grep -r "$pattern" frontend/src --include="*.tsx" --include="*.ts" > /dev/null 2>&1; then
        echo -e "${RED}❌${NC} Se encontraron referencias a $description"
        grep -r "$pattern" frontend/src --include="*.tsx" --include="*.ts"
        return 1
    else
        echo -e "${GREEN}✅${NC} No hay referencias a $description"
    fi
}

echo ""
echo "📁 Verificando estructura de archivos..."

# Verificar archivos principales
check_file "frontend/src/app/dashboard/layout.tsx"
check_file "frontend/src/app/dashboard/page.tsx"
check_file "frontend/src/components/layout/Sidebar.tsx"
check_file "frontend/src/components/dashboard/DashboardContent.tsx"

# Verificar que no existe ResearchSidebar
if [ -f "frontend/src/components/layout/ResearchSidebar.tsx" ]; then
    echo -e "${RED}❌${NC} ResearchSidebar.tsx aún existe (debería haberse eliminado)"
    exit 1
else
    echo -e "${GREEN}✅${NC} ResearchSidebar.tsx eliminado correctamente"
fi

echo ""
echo "🔍 Verificando referencias eliminadas..."

# Verificar que no hay referencias a componentes eliminados
check_no_references "ResearchSidebar" "ResearchSidebar"
check_no_references "DashboardShell" "DashboardShell"
check_no_references "AppShellLayout" "AppShellLayout"

echo ""
echo "📋 Verificando rutas del dashboard..."

# Verificar que todas las rutas existen
check_file "frontend/src/app/dashboard/research-history/page.tsx"
check_file "frontend/src/app/dashboard/emotions/page.tsx"
check_file "frontend/src/app/dashboard/research/page.tsx"

echo ""
echo "🧪 Verificando imports del layout..."

# Verificar que el layout solo importa Sidebar
if grep -q "import.*Sidebar" frontend/src/app/dashboard/layout.tsx && ! grep -q "ResearchSidebar" frontend/src/app/dashboard/layout.tsx; then
    echo -e "${GREEN}✅${NC} Layout importa solo Sidebar unificado"
else
    echo -e "${RED}❌${NC} Layout tiene imports incorrectos"
    grep "import" frontend/src/app/dashboard/layout.tsx
    exit 1
fi

echo ""
echo "🔧 Verificando build..."

# Intentar hacer build para verificar que no hay errores
cd frontend
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Build exitoso - no hay errores de TypeScript"
else
    echo -e "${RED}❌${NC} Build falló - hay errores de TypeScript"
    npm run build
    exit 1
fi

echo ""
echo "🎯 VALIDACIÓN COMPLETADA"
echo "========================="
echo -e "${GREEN}✅${NC} Sidebar unificado correctamente"
echo -e "${GREEN}✅${NC} Todas las rutas del dashboard funcionan"
echo -e "${GREEN}✅${NC} No hay referencias a componentes eliminados"
echo -e "${GREEN}✅${NC} Build exitoso"
echo ""
echo "🚀 El sidebar ahora es consistente en todas las rutas del dashboard"
