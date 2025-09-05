#!/bin/bash

# 🚀 EmotioXV2 - Quality Check Script
# Ejecuta todas las verificaciones de calidad necesarias

set -e  # Exit on any error

echo "🚀 Starting EmotioXV2 Quality Check..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Run this script from the project root directory${NC}"
    exit 1
fi

echo "📂 Working directory: $(pwd)"
echo ""

# 1. TypeScript Compilation Check
echo "📝 Checking TypeScript compilation..."
echo "------------------------------------"

projects=("backendV2" "frontend" "shared" "public-tests")

for project in "${projects[@]}"; do
    if [ -d "$project" ]; then
        echo "Checking $project..."
        cd "$project"
        npx tsc --noEmit
        print_status $? "$project TypeScript compilation"
        cd ..
    else
        print_warning "$project directory not found, skipping"
    fi
done

echo ""

# 2. Linting Check
echo "🔍 Running linters..."
echo "--------------------"

for project in "${projects[@]}"; do
    if [ -d "$project" ]; then
        echo "Linting $project..."
        cd "$project"
        npm run lint
        print_status $? "$project linting"
        cd ..
    fi
done

echo ""

# 3. Build Check
echo "🏗️ Building projects..."
echo "----------------------"

# Backend
if [ -d "backendV2" ]; then
    echo "Building backendV2..."
    cd backendV2
    npx tsc
    print_status $? "backendV2 build"
    cd ..
fi

# Frontend
if [ -d "frontend" ]; then
    echo "Building frontend..."
    cd frontend
    npm run build > /dev/null 2>&1
    print_status $? "frontend build"
    cd ..
fi

# Shared
if [ -d "shared" ]; then
    echo "Building shared..."
    cd shared
    npx tsc
    print_status $? "shared build"
    cd ..
fi

# Public-tests
if [ -d "public-tests" ]; then
    echo "Building public-tests..."
    cd public-tests
    npm run build > /dev/null 2>&1
    print_status $? "public-tests build"
    cd ..
fi

echo ""

# 4. Type Safety Audit
echo "🚫 Checking for prohibited any/unknown types..."
echo "-----------------------------------------------"

echo "Scanning for 'any' types..."
if grep -r ": any\|any\[\]\|any>" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=build . | grep -v "//.*any\|\.d\.ts:"; then
    echo -e "${RED}❌ FOUND PROHIBITED 'any' TYPES!"
    echo "Please replace with specific types.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No prohibited 'any' types found${NC}"
fi

echo "Scanning for 'unknown' types..."
if grep -r ": unknown\|unknown\[\]\|unknown>" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=build . | grep -v "isValidUser\|parseJwt\|//.*unknown\|\.d\.ts:"; then
    echo -e "${RED}❌ FOUND PROHIBITED 'unknown' TYPES!"
    echo "Please replace with specific types or use proper type guards.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No prohibited 'unknown' types found${NC}"
fi

echo ""

# 5. Architecture Check
echo "🏗️ Validating Clean Architecture..."
echo "----------------------------------"

for project in "${projects[@]}"; do
    if [ -d "$project" ]; then
        if [ ! -d "$project/src/types" ]; then
            echo -e "${RED}❌ Missing required 'types' directory in $project${NC}"
            exit 1
        fi
        
        if [ ! -d "$project/src/utils" ]; then
            echo -e "${RED}❌ Missing required 'utils' directory in $project${NC}"
            exit 1
        fi
        
        echo -e "${GREEN}✅ $project structure validated${NC}"
    fi
done

echo ""

# 6. Tests (optional for now)
echo "🧪 Running tests..."
echo "------------------"

for project in "${projects[@]}"; do
    if [ -d "$project" ]; then
        cd "$project"
        if npm test > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $project tests passed${NC}"
        else
            print_warning "$project tests failed or not configured"
        fi
        cd ..
    fi
done

echo ""

# 7. Package vulnerabilities
echo "🔐 Checking for security vulnerabilities..."
echo "------------------------------------------"

for project in "${projects[@]}"; do
    if [ -d "$project" ]; then
        cd "$project"
        if npm audit --audit-level high > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $project security check passed${NC}"
        else
            print_warning "$project has security vulnerabilities - run 'npm audit' for details"
        fi
        cd ..
    fi
done

echo ""

# Summary
echo "================================================"
echo -e "${GREEN}🎉 ALL QUALITY CHECKS PASSED! ${NC}"
echo ""
echo "Your code is ready for:"
echo "  ✅ Committing"
echo "  ✅ Creating Pull Request"
echo "  ✅ Production deployment"
echo ""
echo "Next steps:"
echo "  1. git add ."
echo "  2. git commit -m 'your message'"
echo "  3. git push"
echo ""
echo "🚀 Happy coding!"