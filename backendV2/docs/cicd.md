# CI/CD para EmotioXV2 Backend

Este documento describe el flujo de Integración Continua (CI) y Despliegue Continuo (CD) implementado para el backend de EmotioXV2.

## Resumen

El sistema de CI/CD utiliza GitHub Actions para automatizar el proceso de pruebas, validación, despliegue y exportación de endpoints. Esto garantiza que:

1. Los cambios sean validados antes de fusionarlos en ramas principales
2. El despliegue a AWS sea automático y consistente
3. Los endpoints de la API sean exportados automáticamente para ser consumidos por el frontend

## Flujos de Trabajo

### 1. Integración Continua (CI)

**Archivo**: `.github/workflows/ci.yml`

**Disparadores**:
- Pull Requests hacia `main` o `develop`
- Cambios en archivos de `backendV2/**`

**Tareas**:
- Validación del código
- Ejecución de pruebas
- Comprobación de tipos TypeScript
- Validación del archivo serverless.yml

Este flujo asegura que solo el código correcto y funcional llegue a las ramas principales.

### 2. Despliegue Continuo (CD)

**Archivo**: `.github/workflows/cd.yml`

**Disparadores**:
- Push a `main` (despliegue a producción)
- Push a `develop` (despliegue a desarrollo)
- Activación manual con selección de entorno

**Tareas**:
- Despliegue del backend a AWS usando Serverless Framework
- Exportación de endpoints para el frontend
- Creación automática de un PR con los archivos de configuración actualizados
- Notificaciones de éxito o fallo en Slack

## Configuración

### Secretos de GitHub

Es necesario configurar los siguientes secretos en las configuraciones del repositorio en GitHub:

| Secreto | Descripción | Obligatorio |
|---------|-------------|-------------|
| `AWS_ACCESS_KEY_ID` | ID de clave de acceso de AWS | Sí |
| `AWS_SECRET_ACCESS_KEY` | Clave secreta de acceso de AWS | Sí |
| `AWS_REGION` | Región de AWS para el despliegue | No (por defecto: `us-east-1`) |
| `JWT_SECRET` | Clave secreta para JWT | Sí |
| `SLACK_WEBHOOK` | URL del webhook para notificaciones en Slack | No |

### Variables de Entorno

El flujo de trabajo utiliza las siguientes variables de entorno:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `STAGE` | Entorno de despliegue | `dev` (para `develop`), `prod` (para `main`) |
| `REGION` | Región de AWS | Valor de `AWS_REGION` o `us-east-1` |

## Ciclo de Desarrollo

### Flujo de Trabajo Recomendado

1. **Desarrollo local**:
   - Desarrolla y prueba localmente usando `serverless offline`
   - Verifica que las pruebas pasen con `npm test`

2. **Creación de rama y PR**:
   - Crea una rama feature desde `develop`
   - Implementa tus cambios y crea un Pull Request
   - El flujo de CI se ejecutará automáticamente

3. **Revisión y Fusión**:
   - Los revisores aprueban el PR si el CI pasa y el código es correcto
   - Fusionar el PR en `develop` activa el despliegue automático al entorno de desarrollo

4. **Despliegue a Producción**:
   - Crear un PR desde `develop` a `main`
   - Después de la aprobación y fusión, se despliega automáticamente a producción

### Despliegue Manual

Si necesitas desplegar manualmente a un entorno específico:

1. Ve a la pestaña "Actions" en GitHub
2. Selecciona el flujo de trabajo "CD - EmotioXV2 Backend"
3. Haz clic en "Run workflow"
4. Selecciona la rama y el entorno objetivo
5. Haz clic en "Run workflow"

## Archivos Generados

El proceso de CD genera los siguientes archivos:

- **`outputs.json`**: Salidas del stack de CloudFormation
- **`endpoints.json`**: Endpoints generados por Serverless Framework
- **`frontend/src/config/api-endpoints.js`**: Configuración para JavaScript
- **`frontend/src/config/api-endpoints.ts`**: Configuración para TypeScript

Estos archivos se suben como artefactos y también se crean automáticamente en un nuevo PR para actualizar la configuración del frontend.

## Resolución de Problemas

### El despliegue falla

Verifica los logs en GitHub Actions para identificar el problema. Causas comunes:

- Permisos de AWS insuficientes
- Problemas con la configuración de serverless.yml
- Errores en las pruebas o validaciones

### Los endpoints no se actualizan en el frontend

- Verifica que el PR automático se haya creado correctamente
- Comprueba que el PR haya sido fusionado
- Verifica los archivos en `frontend/src/config/`

### Falla la creación del PR automático

- Verifica que el token de GitHub tenga permisos suficientes
- Comprueba si hay conflictos en los archivos

## Referencias

- [Documentación de GitHub Actions](https://docs.github.com/es/actions)
- [Documentación de Serverless Framework](https://www.serverless.com/framework/docs/)
- [Guía de AWS para CI/CD](https://aws.amazon.com/es/devops/continuous-integration/)
- [Script de exportación de endpoints](../scripts/export-endpoints.js) 