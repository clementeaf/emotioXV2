#!/bin/bash

# Script de validación para el despliegue de EmotioXV2
# Verifica que todo esté configurado correctamente antes del despliegue

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Variables para tracking de errores
ERRORS=0
WARNINGS=0

# Función para incrementar errores
add_error() {
    ERRORS=$((ERRORS + 1))
    print_error "$1"
}

# Función para incrementar warnings
add_warning() {
    WARNINGS=$((WARNINGS + 1))
    print_warning "$1"
}

echo "🔍 EmotioXV2 Deployment Validation"
echo "=================================="
echo

# 1. Verificar estructura del proyecto
print_status "Checking project structure..."

if [ ! -d "frontend" ]; then
    add_error "Frontend directory not found"
else
    print_success "Frontend directory exists"
fi

if [ ! -f "frontend/package.json" ]; then
    add_error "Frontend package.json not found"
else
    print_success "Frontend package.json found"
fi

if [ ! -f "frontend/next.config.js" ]; then
    add_error "Next.js config not found"
else
    print_success "Next.js config found"
fi

if [ ! -f "amplify.yml" ]; then
    add_warning "amplify.yml not found - will use default Amplify settings"
else
    print_success "amplify.yml configuration found"
fi

# 2. Verificar configuración de GitHub Actions
print_status "Checking GitHub Actions configuration..."

if [ ! -d ".github/workflows" ]; then
    add_error "GitHub workflows directory not found"
else
    print_success "GitHub workflows directory exists"
fi

if [ ! -f ".github/workflows/deploy-amplify.yml" ]; then
    add_error "Amplify deployment workflow not found"
else
    print_success "Amplify deployment workflow found"
fi

# 3. Verificar dependencias de Node.js
print_status "Checking Node.js dependencies..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
    
    # Verificar versión mínima (18+)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        add_warning "Node.js version is $NODE_VERSION, recommended 18+"
    else
        print_success "Node.js version is compatible"
    fi
else
    add_error "Node.js not found"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "NPM found: $NPM_VERSION"
else
    add_error "NPM not found"
fi

# 4. Verificar configuración de AWS CLI
print_status "Checking AWS CLI configuration..."

if command -v aws &> /dev/null; then
    AWS_VERSION=$(aws --version)
    print_success "AWS CLI found: $AWS_VERSION"
    
    # Verificar credenciales
    if aws sts get-caller-identity &> /dev/null; then
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        print_success "AWS credentials configured (Account: $ACCOUNT_ID)"
    else
        add_warning "AWS credentials not configured or invalid"
    fi
else
    add_warning "AWS CLI not found (required for setup script)"
fi

# 5. Verificar archivos de configuración críticos
print_status "Checking critical configuration files..."

# Verificar .env files
if [ -f "frontend/.env.local" ]; then
    print_success "Frontend .env.local found"
else
    add_warning "Frontend .env.local not found"
fi

# Verificar gitignore
if [ -f ".gitignore" ]; then
    if grep -q "node_modules" .gitignore; then
        print_success ".gitignore properly configured"
    else
        add_warning ".gitignore might be missing node_modules entry"
    fi
else
    add_warning ".gitignore not found"
fi

# 6. Verificar scripts de package.json
print_status "Checking package.json scripts..."

cd frontend

if npm run | grep -q "build"; then
    print_success "Build script found"
else
    add_error "Build script not found in package.json"
fi

if npm run | grep -q "lint"; then
    print_success "Lint script found"
else
    add_warning "Lint script not found in package.json"
fi

# 7. Intentar build local
print_status "Testing local build..."

if [ "$ERRORS" -eq 0 ]; then
    print_status "Running npm install..."
    if npm ci &> /dev/null; then
        print_success "Dependencies installed successfully"
        
        print_status "Running lint check..."
        if npm run lint:check >/dev/null; then
            print_success "Linting passed"
        else
            # Check if it's a TypeScript version compatibility issue
            if npm run lint:check 2>&1 | grep -q "SUPPORTED TYPESCRIPT VERSIONS"; then
                add_warning "Linting skipped - TypeScript version compatibility issue (non-blocking)"
            else
                add_warning "Linting failed - check npm run lint:check"
            fi
        fi
        
        print_status "Testing build..."
        if npm run build &> /dev/null; then
            print_success "Build completed successfully"
            
            # Verificar que se generaron archivos de salida
            if [ -d "out" ] && [ "$(ls -A out)" ]; then
                print_success "Build artifacts generated"
            else
                add_warning "Build artifacts not found in 'out' directory"
            fi
        else
            add_error "Build failed - check npm run build"
        fi
    else
        add_error "Failed to install dependencies"
    fi
else
    add_warning "Skipping build test due to previous errors"
fi

cd ..

# 8. Verificar configuración de Amplify
print_status "Checking Amplify configuration..."

if [ -f "amplify.yml" ]; then
    # Verificar que contiene las secciones necesarias
    if grep -q "frontend:" amplify.yml; then
        print_success "Amplify config contains frontend section"
    else
        add_warning "Amplify config missing frontend section"
    fi
    
    if grep -q "artifacts:" amplify.yml; then
        print_success "Amplify config contains artifacts section"
    else
        add_warning "Amplify config missing artifacts section"
    fi
else
    add_warning "amplify.yml not found"
fi

# 9. Verificar configuración de Next.js
print_status "Checking Next.js configuration..."

if [ -f "frontend/next.config.js" ]; then
    if grep -q "output.*export" frontend/next.config.js; then
        print_success "Next.js configured for static export"
    else
        add_warning "Next.js might not be configured for static export"
    fi
    
    if grep -q "unoptimized.*true" frontend/next.config.js; then
        print_success "Images configured for static export"
    else
        add_warning "Images might not be configured for static export"
    fi
else
    add_error "next.config.js not found"
fi

# Resumen final
echo
echo "🎯 Validation Summary"
echo "===================="

if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    print_success "All checks passed! Ready for deployment 🚀"
    echo
    echo "Next steps:"
    echo "1. Run ./scripts/setup-amplify.sh to configure AWS Amplify"
    echo "2. Configure GitHub secrets"
    echo "3. Push your code to trigger deployment"
    exit 0
elif [ "$ERRORS" -eq 0 ]; then
    print_warning "Validation completed with $WARNINGS warning(s)"
    echo
    echo "You can proceed with deployment, but consider addressing the warnings."
    echo
    echo "Next steps:"
    echo "1. Address warnings if possible"
    echo "2. Run ./scripts/setup-amplify.sh to configure AWS Amplify"
    echo "3. Configure GitHub secrets"
    echo "4. Push your code to trigger deployment"
    exit 0
else
    print_error "Validation failed with $ERRORS error(s) and $WARNINGS warning(s)"
    echo
    echo "Please fix the errors before proceeding with deployment."
    echo
    echo "Common fixes:"
    echo "- Ensure Node.js 18+ is installed"
    echo "- Install project dependencies: cd frontend && npm install"
    echo "- Fix linting errors: cd frontend && npm run lint:fix"
    echo "- Ensure all required files are present"
    exit 1
fi
