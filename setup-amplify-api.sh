#!/bin/bash

# Script para configurar automáticamente la API de Amplify
# Integración con backend Lambda existente

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Configurando API de Amplify para EmotioXV2${NC}"
echo "=================================================="

# Navegar al directorio frontend
cd frontend

echo -e "${YELLOW}📋 Configurando API de Amplify...${NC}"

# Crear archivo de configuración para amplify add api
cat > amplify-api-config.txt << 'EOF'
? Please select from one of the below mentioned services:
  ❯ REST
    GraphQL
? Provide a friendly name for your resource to be used as a label for this category in the project:
  emotioXV2-api
? Provide a path (e.g., /items):
  /api
? Choose a Lambda source:
  ❯ Create a new Lambda function
    Use a function in this project
    Provide a Lambda function ARN
? Provide a friendly name for your resource to be used as a label for this category in the project:
  emotioXV2-lambda
? Choose the runtime that you want to use:
  ❯ NodeJS
    Python
    Java
    Go
    .NET Core
    Ruby
? Choose the function template that you want to use:
  ❯ Hello World
    CRUD function for DynamoDB (Integration with API Gateway)
    Serverless ExpressJS function (Integration with API Gateway)
    Lambda Trigger
? Do you want to configure advanced settings?
  ❯ No
    Yes
? Do you want to edit the local lambda function now?
  ❯ No
    Yes
? Restrict API access?
  ❯ No
    Yes
? Who should have access?
  ❯ Authenticated users only
    Authenticated and Guest users
? What kind of access do you want for Authenticated users?
  ❯ create, read, update, delete
    create, read, update
    create, read
    create
    read
? What kind of access do you want for Guest users?
  ❯ create, read, update, delete
    create, read, update
    create, read
    create
    read
? Do you want to add another path?
  ❯ No
    Yes
EOF

echo -e "${GREEN}✅ Archivo de configuración creado${NC}"
echo -e "${YELLOW}📝 Ejecutando: amplify add api${NC}"
echo -e "${YELLOW}💡 Usa las respuestas del archivo amplify-api-config.txt${NC}"

# Mostrar las respuestas recomendadas
echo ""
echo -e "${BLUE}📋 Respuestas recomendadas:${NC}"
echo "=================================================="
echo "1. Service: REST"
echo "2. Friendly name: emotioXV2-api"
echo "3. Path: /api"
echo "4. Lambda source: Create a new Lambda function"
echo "5. Lambda name: emotioXV2-lambda"
echo "6. Runtime: NodeJS"
echo "7. Template: Hello World"
echo "8. Advanced settings: No"
echo "9. Edit function: No"
echo "10. Restrict access: No"
echo ""

echo -e "${GREEN}🚀 Ejecuta: amplify add api${NC}"
echo -e "${YELLOW}Y usa las respuestas de arriba${NC}"
