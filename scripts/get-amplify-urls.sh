#!/bin/bash
# get-amplify-urls.sh - Script para obtener y configurar URLs de Amplify

set -e

# IDs de las aplicaciones Amplify
FRONTEND_APP_ID="d12psv9dnscmm4"
PUBLIC_TESTS_APP_ID="d2vbj9lxdnqvqq"

echo "🔍 Obteniendo URLs de Amplify..."

# Obtener URLs de Amplify
FRONTEND_URL=$(aws amplify get-app --app-id $FRONTEND_APP_ID --query 'app.defaultDomain' --output text 2>/dev/null || echo "d12psv9dnscmm4.amplifyapp.com")
PUBLIC_TESTS_URL=$(aws amplify get-app --app-id $PUBLIC_TESTS_APP_ID --query 'app.defaultDomain' --output text 2>/dev/null || echo "d2vbj9lxdnqvqq.amplifyapp.com")

echo "📱 Frontend URL: https://$FRONTEND_URL"
echo "📱 Public Tests URL: https://$PUBLIC_TESTS_URL"

# Crear directorio config si no existe
mkdir -p config

# Crear archivo de configuración de URLs de Amplify
cat > config/amplify-urls.json << EOF
{
  "frontend": "https://$FRONTEND_URL",
  "publicTests": "https://$PUBLIC_TESTS_URL",
  "frontendAppId": "$FRONTEND_APP_ID",
  "publicTestsAppId": "$PUBLIC_TESTS_APP_ID",
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "✅ URLs de Amplify guardadas en config/amplify-urls.json"

# Crear también un archivo con las variables de entorno para fácil acceso
cat > config/amplify-env.sh << EOF
#!/bin/bash
# Variables de entorno para las aplicaciones Amplify
export AMPLIFY_FRONTEND_APP_ID="$FRONTEND_APP_ID"
export AMPLIFY_PUBLIC_TESTS_APP_ID="$PUBLIC_TESTS_APP_ID"
export AMPLIFY_FRONTEND_URL="https://$FRONTEND_URL"
export AMPLIFY_PUBLIC_TESTS_URL="https://$PUBLIC_TESTS_URL"
EOF

chmod +x config/amplify-env.sh

echo "✅ Variables de entorno guardadas en config/amplify-env.sh"

# Mostrar información para GitHub Secrets
echo ""
echo "🔐 Configurar estos secrets en GitHub:"
echo "AMPLIFY_FRONTEND_APP_ID=$FRONTEND_APP_ID"
echo "AMPLIFY_PUBLIC_TESTS_APP_ID=$PUBLIC_TESTS_APP_ID"
echo ""
echo "🌐 URLs públicas:"
echo "Frontend: https://$FRONTEND_URL"
echo "Public Tests: https://$PUBLIC_TESTS_URL"
