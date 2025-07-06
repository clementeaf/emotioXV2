# 🚀 PLAN DE ACCIÓN: DESPLIEGUE AWS AMPLIFY CI/CD COMPLETO

## 📊 ESTADO ACTUAL ANALIZADO

### ✅ Lo que ya funciona:
- **Backend**: Serverless Framework desplegado en AWS Lambda
- **Exportación de endpoints**: `endpoints-exporter.ts` funcionando
- **CORS**: Configurado para múltiples orígenes
- **GitHub**: Repositorio con workflow básico preparado
- **Estructura**: Monorepo organizado con frontend/ y public-tests/

### 🔧 Lo que necesitamos configurar:
- **2 Apps de Amplify**: Una para frontend, otra para public-tests
- **CI/CD automático**: Trigger con cada commit
- **URLs dinámicas**: Frontend debe usar URL de Amplify de public-tests
- **CORS actualizado**: Incluir nuevos dominios de Amplify

## 🎯 FASE 1: CONFIGURACIÓN AWS AMPLIFY

### 1.1 Crear Aplicación para Frontend
```bash
# Crear app Amplify para frontend
aws amplify create-app \
  --name "emotioxv2-frontend" \
  --repository "https://github.com/clementefalcone/emotioXV2.git" \
  --platform "WEB" \
  --environment-variables "NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,NODE_OPTIONS=--max-old-space-size=4096" \
  --enable-auto-branch-creation \
  --region us-east-1

# Conectar con GitHub (necesitarás token de GitHub)
aws amplify update-app \
  --app-id [FRONTEND_APP_ID] \
  --oauth-token [GITHUB_TOKEN] \
  --region us-east-1

# Crear branch principal
aws amplify create-branch \
  --app-id [FRONTEND_APP_ID] \
  --branch-name main \
  --stage PRODUCTION \
  --framework "Next.js - SSG" \
  --enable-auto-build \
  --build-spec file://amplify.yml \
  --environment-variables "NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1" \
  --region us-east-1
```

### 1.2 Crear Aplicación para Public-Tests
```bash
# Crear app Amplify para public-tests
aws amplify create-app \
  --name "emotioxv2-public-tests" \
  --repository "https://github.com/clementefalcone/emotioXV2.git" \
  --platform "WEB" \
  --environment-variables "NODE_ENV=production,VITE_NODE_ENV=production" \
  --enable-auto-branch-creation \
  --region us-east-1

# Conectar con GitHub
aws amplify update-app \
  --app-id [PUBLIC_TESTS_APP_ID] \
  --oauth-token [GITHUB_TOKEN] \
  --region us-east-1

# Crear branch principal
aws amplify create-branch \
  --app-id [PUBLIC_TESTS_APP_ID] \
  --branch-name main \
  --stage PRODUCTION \
  --framework "React" \
  --enable-auto-build \
  --build-spec file://amplify-public-tests.yml \
  --environment-variables "NODE_ENV=production,VITE_NODE_ENV=production" \
  --region us-east-1
```

## 🎯 FASE 2: CONFIGURACIÓN CI/CD GITHUB

### 2.1 Secrets de GitHub
Agregar en GitHub → Settings → Secrets:
- `AWS_ACCESS_KEY_ID`: Tu Access Key ID
- `AWS_SECRET_ACCESS_KEY`: Tu Secret Access Key  
- `AMPLIFY_FRONTEND_APP_ID`: App ID del frontend
- `AMPLIFY_PUBLIC_TESTS_APP_ID`: App ID de public-tests
- `GITHUB_TOKEN`: Token de acceso personal

### 2.2 Workflow Actualizado
Crear workflow que maneje ambas aplicaciones:

```yaml
name: Deploy to AWS Amplify
on:
  push:
    branches: [ main, develop ]
    paths:
      - 'frontend/**'
      - 'public-tests/**' 
      - 'shared/**'
      - 'backendV2/**'
jobs:
  deploy-frontend:
    if: contains(github.event.head_commit.modified, 'frontend/') || contains(github.event.head_commit.modified, 'shared/')
    runs-on: ubuntu-latest
    steps:
      - name: Deploy Frontend to Amplify
        run: |
          aws amplify start-job \
            --app-id ${{ secrets.AMPLIFY_FRONTEND_APP_ID }} \
            --branch-name main \
            --job-type RELEASE
  
  deploy-public-tests:
    if: contains(github.event.head_commit.modified, 'public-tests/') || contains(github.event.head_commit.modified, 'shared/')
    runs-on: ubuntu-latest  
    steps:
      - name: Deploy Public Tests to Amplify
        run: |
          aws amplify start-job \
            --app-id ${{ secrets.AMPLIFY_PUBLIC_TESTS_APP_ID }} \
            --branch-name main \
            --job-type RELEASE
```

## 🎯 FASE 3: CONFIGURACIÓN DINÁMICA DE URLS

### 3.1 Script para Obtener URLs de Amplify
Crear script que obtenga las URLs de Amplify y las configure:

```bash
#!/bin/bash
# get-amplify-urls.sh

FRONTEND_APP_ID=$1
PUBLIC_TESTS_APP_ID=$2

# Obtener URLs de Amplify
FRONTEND_URL=$(aws amplify get-app --app-id $FRONTEND_APP_ID --query 'app.defaultDomain' --output text)
PUBLIC_TESTS_URL=$(aws amplify get-app --app-id $PUBLIC_TESTS_APP_ID --query 'app.defaultDomain' --output text)

# Crear archivo de configuración
cat > config/amplify-urls.json << EOF
{
  "frontend": "https://$FRONTEND_URL",
  "publicTests": "https://$PUBLIC_TESTS_URL",
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "URLs de Amplify guardadas en config/amplify-urls.json"
```

### 3.2 Configuración Frontend para Navegar a Public-Tests
Actualizar frontend para usar URL dinámica de public-tests:

```typescript
// frontend/src/config/amplify-config.ts
interface AmplifyUrls {
  frontend: string;
  publicTests: string;
  generatedAt: string;
}

// Cargar URLs desde archivo generado o fallback
export async function getPublicTestsUrl(): Promise<string> {
  try {
    // Intentar cargar desde archivo de configuración
    const response = await fetch('/amplify-urls.json');
    const config: AmplifyUrls = await response.json();
    return config.publicTests;
  } catch (error) {
    console.warn('No se pudo cargar configuración de Amplify, usando fallback');
    // Fallback hardcodeado (se actualizará automáticamente)
    return 'https://[PUBLIC-TESTS-DOMAIN].amplifyapp.com';
  }
}

// Función para navegar a public-tests con researchID
export function navigateToPublicTests(researchID: string): void {
  getPublicTestsUrl().then(url => {
    const publicTestsUrl = `${url}/${researchID}`;
    window.open(publicTestsUrl, '_blank');
  });
}
```

## 🎯 FASE 4: ACTUALIZACIÓN CORS BACKEND

### 4.1 Agregar Dominios de Amplify a CORS
Actualizar `backendV2/src/middlewares/cors.ts`:

```typescript
function getAllowedOrigins(): string[] {
  const envOrigins = (process.env.ALLOWED_ORIGIN || '').split(',').map(o => o.trim()).filter(o => o);
  
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:4700', 
    'http://localhost:5173',
    // Dominios de Amplify (se actualizarán automáticamente)
    'https://*.amplifyapp.com',
    // Agregar dominios específicos una vez conocidos
    // 'https://[FRONTEND-BRANCH].[FRONTEND-APP-ID].amplifyapp.com',
    // 'https://[PUBLIC-TESTS-BRANCH].[PUBLIC-TESTS-APP-ID].amplifyapp.com',
    // Mantener existentes
    'https://d2s9nr0bm47yl1.cloudfront.net',
    'https://d2zt8ia21te5mv.cloudfront.net',
    'http://54.90.132.233:3000'
  ];
  
  return [...new Set([...envOrigins, ...defaultOrigins])];
}
```

### 4.2 CORS Dinámico para Amplify
```typescript
export function getCorsHeaders(event: APIGatewayProxyEvent) {
  const requestOrigin = event.headers.origin || event.headers.Origin || '';
  const allowedOrigins = getAllowedOrigins();
  
  // Permitir cualquier subdominio de amplifyapp.com
  const isAmplifyDomain = /\.amplifyapp\.com$/.test(requestOrigin);
  const isPublicTests = /public-tests/.test(requestOrigin);
  
  let accessControlAllowOrigin = '';
  
  if (isAmplifyDomain || isPublicTests) {
    accessControlAllowOrigin = requestOrigin;
    console.log(`CORS: Dominio Amplify/Public-tests permitido: ${requestOrigin}`);
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    accessControlAllowOrigin = requestOrigin;
  } else {
    accessControlAllowOrigin = allowedOrigins[0] || 'http://localhost:4700';
  }
  
  // ... resto del código
}
```

## 🎯 FASE 5: EXPORTACIÓN AUTOMÁTICA DE ENDPOINTS

### 5.1 Actualizar Script de Exportación
Modificar `backendV2/src/utils/endpoints-exporter.ts` para incluir URLs de Amplify:

```typescript
export async function exportEndpointsWithAmplify(outputPaths: string[]): Promise<void> {
  // Obtener endpoints del backend
  const endpoints = readEndpointsFromServerless();
  
  // Obtener URLs de Amplify si están disponibles
  let amplifyUrls = {};
  try {
    const configPath = path.resolve(process.cwd(), '../config/amplify-urls.json');
    if (fs.existsSync(configPath)) {
      amplifyUrls = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (error) {
    console.warn('No se pudieron cargar URLs de Amplify:', error.message);
  }
  
  // Crear contenido del archivo
  const template = `// ARCHIVO GENERADO AUTOMÁTICAMENTE
// Generado: ${new Date().toISOString()}

export const API_ENDPOINTS = {
  http: "${endpoints.http}",
  ws: "${endpoints.websocket}",
  stage: "${endpoints.stage || 'dev'}"
};

export const AMPLIFY_URLS = ${JSON.stringify(amplifyUrls, null, 2)};

// Función para navegar a public-tests
export function getPublicTestsUrl() {
  return AMPLIFY_URLS.publicTests || 'http://localhost:4700';
}

export function navigateToPublicTests(researchID) {
  const url = \`\${getPublicTestsUrl()}/\${researchID}\`;
  window.open(url, '_blank');
}

export default API_ENDPOINTS;
`;

  // Escribir a ambos directorios
  for (const outputPath of outputPaths) {
    fs.writeFileSync(outputPath, template);
    console.log(`Endpoints + Amplify URLs exportados a: ${outputPath}`);
  }
}
```

## 🎯 FASE 6: AUTOMATIZACIÓN COMPLETA

### 6.1 Script Master de Despliegue
```bash
#!/bin/bash
# scripts/deploy-amplify-complete.sh

echo "🚀 Iniciando despliegue completo a AWS Amplify..."

# 1. Obtener IDs de aplicaciones
FRONTEND_APP_ID=$(aws amplify list-apps --query 'apps[?name==`emotioxv2-frontend`].appId' --output text)
PUBLIC_TESTS_APP_ID=$(aws amplify list-apps --query 'apps[?name==`emotioxv2-public-tests`].appId' --output text)

if [ -z "$FRONTEND_APP_ID" ] || [ -z "$PUBLIC_TESTS_APP_ID" ]; then
  echo "❌ Error: No se encontraron las aplicaciones de Amplify"
  exit 1
fi

echo "📱 Frontend App ID: $FRONTEND_APP_ID"
echo "📱 Public Tests App ID: $PUBLIC_TESTS_APP_ID"

# 2. Obtener URLs de Amplify
echo "🔍 Obteniendo URLs de Amplify..."
./scripts/get-amplify-urls.sh $FRONTEND_APP_ID $PUBLIC_TESTS_APP_ID

# 3. Exportar endpoints + URLs de Amplify
echo "📤 Exportando endpoints y URLs..."
cd backendV2
npm run export-endpoints

# 4. Commit y push de cambios
echo "📦 Commiteando cambios..."
cd ..
git add frontend/src/api/endpoints.js public-tests/src/config/endpoints.js config/amplify-urls.json
git commit -m "chore: actualizar endpoints y URLs de Amplify [skip ci]"
git push origin main

# 5. Trigger deployments
echo "🚀 Iniciando despliegues..."
aws amplify start-job --app-id $FRONTEND_APP_ID --branch-name main --job-type RELEASE
aws amplify start-job --app-id $PUBLIC_TESTS_APP_ID --branch-name main --job-type RELEASE

echo "✅ Despliegue completo iniciado!"
echo "🌐 Monitorea el progreso en:"
echo "   Frontend: https://console.aws.amazon.com/amplify/home#/$FRONTEND_APP_ID"
echo "   Public Tests: https://console.aws.amazon.com/amplify/home#/$PUBLIC_TESTS_APP_ID"
```

## 🎯 EJECUCIÓN DEL PLAN

### ✅ CHECKLIST DE IMPLEMENTACIÓN

1. **[ ] Configurar aplicaciones Amplify**
   - [ ] Crear app para frontend
   - [ ] Crear app para public-tests
   - [ ] Configurar branches y builds

2. **[ ] Configurar GitHub**
   - [ ] Agregar secrets necesarios
   - [ ] Actualizar workflow
   - [ ] Probar CI/CD

3. **[ ] Configurar URLs dinámicas**
   - [ ] Script para obtener URLs
   - [ ] Configuración en frontend
   - [ ] Exportación automática

4. **[ ] Actualizar CORS**
   - [ ] Agregar dominios Amplify
   - [ ] Redesplegar backend
   - [ ] Probar conectividad

5. **[ ] Automatización**
   - [ ] Script master
   - [ ] Documentación
   - [ ] Pruebas E2E

## 🚨 PRERREQUISITOS

1. **AWS CLI configurado** con permisos para Amplify
2. **GitHub Token** con permisos de repo
3. **URLs del repositorio** GitHub correctas
4. **Backend desplegado** y funcionando

## 📊 RESULTADO ESPERADO

Al completar este plan tendrás:

✅ **2 aplicaciones Amplify** funcionando independientemente
✅ **CI/CD automático** con cada commit
✅ **URLs dinámicas** entre aplicaciones  
✅ **CORS configurado** para todos los dominios
✅ **Exportación automática** de endpoints
✅ **Navegación funcional** de frontend a public-tests

¿Estás listo para comenzar con la implementación? 🚀
