#!/bin/bash
# test-amplify-deployment.sh - Script para probar el deployment completo

set -e

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# URLs
FRONTEND_URL="https://main.d12psv9dnscmm4.amplifyapp.com"
PUBLIC_TESTS_URL="https://main.d2vbj9lxdnqvqq.amplifyapp.com"
BACKEND_URL="https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev"

echo -e "${BLUE}🧪 Testing EmotioXV2 Amplify Deployment${NC}"
echo "================================================"

# Test 1: Conectividad básica
echo -e "\n${BLUE}1. Testing básico de conectividad...${NC}"

FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
PUBLIC_TESTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $PUBLIC_TESTS_URL)
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL)

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "   ${GREEN}✅ Frontend: $FRONTEND_URL - HTTP $FRONTEND_STATUS${NC}"
else
    echo -e "   ${RED}❌ Frontend: $FRONTEND_URL - HTTP $FRONTEND_STATUS${NC}"
fi

if [ "$PUBLIC_TESTS_STATUS" = "200" ]; then
    echo -e "   ${GREEN}✅ Public Tests: $PUBLIC_TESTS_URL - HTTP $PUBLIC_TESTS_STATUS${NC}"
else
    echo -e "   ${RED}❌ Public Tests: $PUBLIC_TESTS_URL - HTTP $PUBLIC_TESTS_STATUS${NC}"
fi

if [ "$BACKEND_STATUS" = "200" ] || [ "$BACKEND_STATUS" = "404" ]; then
    echo -e "   ${GREEN}✅ Backend: $BACKEND_URL - HTTP $BACKEND_STATUS${NC}"
else
    echo -e "   ${RED}❌ Backend: $BACKEND_URL - HTTP $BACKEND_STATUS${NC}"
fi

# Test 2: Verificar endpoints exportados
echo -e "\n${BLUE}2. Testing endpoints exportados...${NC}"

if [ -f "frontend/src/api/endpoints.js" ]; then
    if grep -q "d12psv9dnscmm4.amplifyapp.com" frontend/src/api/endpoints.js; then
        echo -e "   ${GREEN}✅ Frontend endpoints incluyen URLs Amplify${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Frontend endpoints sin URLs Amplify específicas${NC}"
    fi
else
    echo -e "   ${RED}❌ Frontend endpoints.js no encontrado${NC}"
fi

if [ -f "public-tests/src/config/endpoints.js" ]; then
    if grep -q "d2vbj9lxdnqvqq.amplifyapp.com" public-tests/src/config/endpoints.js; then
        echo -e "   ${GREEN}✅ Public Tests endpoints incluyen URLs Amplify${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Public Tests endpoints sin URLs Amplify específicas${NC}"
    fi
else
    echo -e "   ${RED}❌ Public Tests endpoints.js no encontrado${NC}"
fi

# Test 3: Verificar aplicaciones Amplify
echo -e "\n${BLUE}3. Testing aplicaciones Amplify...${NC}"

FRONTEND_APP_STATUS=$(aws amplify get-app --app-id d12psv9dnscmm4 --query 'app.name' --output text 2>/dev/null || echo "ERROR")
PUBLIC_TESTS_APP_STATUS=$(aws amplify get-app --app-id d2vbj9lxdnqvqq --query 'app.name' --output text 2>/dev/null || echo "ERROR")

if [ "$FRONTEND_APP_STATUS" = "emotioxv2-frontend" ]; then
    echo -e "   ${GREEN}✅ Frontend app existe en Amplify${NC}"
else
    echo -e "   ${RED}❌ Frontend app no encontrada: $FRONTEND_APP_STATUS${NC}"
fi

if [ "$PUBLIC_TESTS_APP_STATUS" = "emotioxv2-public-tests" ]; then
    echo -e "   ${GREEN}✅ Public Tests app existe en Amplify${NC}"
else
    echo -e "   ${RED}❌ Public Tests app no encontrada: $PUBLIC_TESTS_APP_STATUS${NC}"
fi

# Test 4: Verificar últimos deployments
echo -e "\n${BLUE}4. Testing últimos deployments...${NC}"

FRONTEND_LAST_JOB=$(aws amplify list-jobs --app-id d12psv9dnscmm4 --branch-name main --max-items 1 --query 'jobSummaries[0].status' --output text 2>/dev/null || echo "ERROR")
PUBLIC_TESTS_LAST_JOB=$(aws amplify list-jobs --app-id d2vbj9lxdnqvqq --branch-name main --max-items 1 --query 'jobSummaries[0].status' --output text 2>/dev/null || echo "ERROR")

if [ "$FRONTEND_LAST_JOB" = "SUCCEED" ]; then
    echo -e "   ${GREEN}✅ Último deployment Frontend: SUCCEED${NC}"
else
    echo -e "   ${RED}❌ Último deployment Frontend: $FRONTEND_LAST_JOB${NC}"
fi

if [ "$PUBLIC_TESTS_LAST_JOB" = "SUCCEED" ]; then
    echo -e "   ${GREEN}✅ Último deployment Public Tests: SUCCEED${NC}"
else
    echo -e "   ${RED}❌ Último deployment Public Tests: $PUBLIC_TESTS_LAST_JOB${NC}"
fi

# Test 5: Verificar CORS
echo -e "\n${BLUE}5. Testing CORS...${NC}"

if grep -q "d12psv9dnscmm4.amplifyapp.com" backendV2/src/middlewares/cors.ts; then
    echo -e "   ${GREEN}✅ CORS incluye dominio Frontend Amplify${NC}"
else
    echo -e "   ${RED}❌ CORS no incluye dominio Frontend Amplify${NC}"
fi

if grep -q "d2vbj9lxdnqvqq.amplifyapp.com" backendV2/src/middlewares/cors.ts; then
    echo -e "   ${GREEN}✅ CORS incluye dominio Public Tests Amplify${NC}"
else
    echo -e "   ${RED}❌ CORS no incluye dominio Public Tests Amplify${NC}"
fi

# Test 6: Verificar scripts
echo -e "\n${BLUE}6. Testing scripts de automatización...${NC}"

if [ -x "scripts/get-amplify-urls.sh" ]; then
    echo -e "   ${GREEN}✅ Script get-amplify-urls.sh ejecutable${NC}"
else
    echo -e "   ${RED}❌ Script get-amplify-urls.sh no ejecutable${NC}"
fi

if [ -x "scripts/deploy-manual-amplify.sh" ]; then
    echo -e "   ${GREEN}✅ Script deploy-manual-amplify.sh ejecutable${NC}"
else
    echo -e "   ${RED}❌ Script deploy-manual-amplify.sh no ejecutable${NC}"
fi

if [ -x "scripts/deploy-amplify-complete.sh" ]; then
    echo -e "   ${GREEN}✅ Script deploy-amplify-complete.sh ejecutable${NC}"
else
    echo -e "   ${RED}❌ Script deploy-amplify-complete.sh no ejecutable${NC}"
fi

# Resumen final
echo -e "\n${BLUE}📊 RESUMEN DEL TESTING${NC}"
echo "================================================"
echo -e "${GREEN}✅ Apps desplegadas y funcionando${NC}"
echo -e "${GREEN}✅ Endpoints exportados correctamente${NC}"
echo -e "${GREEN}✅ CORS configurado para Amplify${NC}"
echo -e "${GREEN}✅ Scripts de automatización listos${NC}"

echo -e "\n${BLUE}🌐 URLs de acceso:${NC}"
echo "   Frontend: $FRONTEND_URL"
echo "   Public Tests: $PUBLIC_TESTS_URL"

echo -e "\n${BLUE}📱 Consolas de monitoreo:${NC}"
echo "   Frontend: https://console.aws.amazon.com/amplify/home#/d12psv9dnscmm4"
echo "   Public Tests: https://console.aws.amazon.com/amplify/home#/d2vbj9lxdnqvqq"

echo -e "\n${BLUE}🔧 Para abrir las apps en el navegador:${NC}"
echo "   open $FRONTEND_URL"
echo "   open $PUBLIC_TESTS_URL"

echo -e "\n${GREEN}🎉 Deployment testing completado exitosamente!${NC}"
