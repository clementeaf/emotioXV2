#!/bin/bash

# Script para desplegar la aplicación y exportar los endpoints de la API
# Uso: ./deploy-and-export.sh [stage] [region]
# Ejemplo: ./deploy-and-export.sh dev us-east-1

# Colores para los mensajes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parámetros
STAGE=${1:-dev}
REGION=${2:-us-east-1}

echo -e "${YELLOW}Desplegando la aplicación en el entorno ${STAGE} (${REGION})...${NC}"

# Navegar al directorio del proyecto
cd "$(dirname "$0")/.." || exit

# Desplegar con Serverless Framework
serverless deploy --stage "$STAGE" --region "$REGION" --verbose

# Verificar si el despliegue fue exitoso
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error en el despliegue. Revisa los logs para más detalles.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Despliegue completado exitosamente.${NC}"
echo -e "${YELLOW}Verificando archivos generados por los plugins...${NC}"

# Verificar si se generaron los archivos
if [ -f "outputs.json" ] && [ -f "endpoints.json" ]; then
  echo -e "${GREEN}✅ Archivos outputs.json y endpoints.json generados correctamente.${NC}"
else
  echo -e "${YELLOW}⚠️ No se encontraron los archivos outputs.json y endpoints.json. El script intentará generarlos.${NC}"
fi

echo -e "${YELLOW}Exportando los endpoints de la API al frontend...${NC}"

# Exportar los endpoints
export STAGE="$STAGE"
export REGION="$REGION"
node "$(dirname "$0")/export-endpoints.js"

# Verificar si la exportación fue exitosa
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error al exportar los endpoints. Revisa los logs para más detalles.${NC}"
  exit 1
fi

# Verificar que los archivos fueron generados en el frontend
if [ -f "../frontend/src/config/endpoints.json" ] && [ -f "../frontend/src/config/outputs.json" ]; then
  echo -e "${GREEN}✅ Archivos generados correctamente en el frontend.${NC}"
else
  echo -e "${RED}❌ No se encontraron los archivos de configuración en el frontend.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Proceso completado exitosamente.${NC}"
echo -e "La aplicación ha sido desplegada y los endpoints han sido exportados para su uso en el frontend."
echo -e "API Endpoint: $(grep -o 'https://[^\"]*' ../frontend/src/config/endpoints.json | head -1)" 