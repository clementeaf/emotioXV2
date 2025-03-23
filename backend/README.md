# Backend EmotioX

Backend para EmotioX, construido con Serverless Framework y servicios AWS.

## Estructura del Proyecto

```
/backend
├── src/
│   ├── controllers/     # Controladores de la API
│   ├── models/          # Modelos de datos
│   ├── services/        # Servicios de negocio
│   ├── repositories/    # Repositorios para acceso a datos
│   ├── types/           # Definiciones de tipos e interfaces
│   ├── utils/           # Utilidades y helpers
│   └── validations/     # Esquemas de validación
├── scripts/             # Scripts auxiliares de despliegue
├── serverless.yml       # Configuración de Serverless Framework
├── webpack.config.js    # Configuración de empaquetado
├── tsconfig.json        # Configuración de TypeScript
└── package.json         # Dependencias y scripts
```

## Requisitos

- Node.js 14.x o superior
- npm 6.x o superior
- AWS CLI instalado y configurado
- Credenciales de AWS configuradas

## Instalación

```bash
# Instalar dependencias
npm install
```

## Scripts Disponibles

### Desarrollo Local

```bash
# Iniciar servidor de desarrollo local
npm run start:offline

# Invocar función local
npm run local -- --function=nombre-funcion --data='{"key": "value"}'
```

### Verificación

```bash
# Verificar requisitos de instalación
npm run check-requirements

# Ejecutar linter
npm run lint

# Ejecutar tests
npm run test
```

### Despliegue

```bash
# Desplegar en ambiente de desarrollo
npm run deploy:dev

# Desplegar en ambiente de producción
npm run deploy:prod

# Generar paquete sin desplegar
npm run package

# Ver logs de una función
npm run logs -- --function=nombre-funcion --stage=dev

# Eliminar stack
npm run remove
```

### Scripts Auxiliares

```bash
# Limpiar directorios de compilación
npm run clean

# Compilar TypeScript
npm run build

# Corregir endpoints generados
npm run fix-endpoints

# Actualizar configuración del frontend
npm run update-frontend
```

## Flujo de Despliegue

1. **Verificación de requisitos**: Se verifica que Node.js, npm y AWS CLI estén instalados correctamente.
2. **Limpieza**: Se eliminan directorios de compilaciones anteriores.
3. **Compilación**: Se transpila el código TypeScript.
4. **Despliegue**: Se crea o actualiza el stack en AWS CloudFormation.
5. **Post-despliegue**: Se corrigen los endpoints y se actualiza la configuración del frontend.

## Ambiente de Desarrollo

El ambiente de desarrollo utiliza la etapa `dev` y requiere menos recursos. Es ideal para pruebas y desarrollo iterativo.

## Ambiente de Producción

El ambiente de producción utiliza la etapa `prod` y está optimizado para rendimiento y seguridad. Utiliza más recursos para garantizar disponibilidad y escalabilidad.

## Estructura de Tablas DynamoDB

- **UsersTable**: Almacena información de usuarios.
- **ConnectionsTable**: Administra conexiones WebSocket.
- **ResearchTable**: Contiene datos de investigaciones.
- **FormsTable**: Almacena formularios y respuestas.

## Troubleshooting

Si encuentras problemas durante el despliegue:

1. Verifica tus credenciales AWS con `aws sts get-caller-identity`
2. Revisa los logs de despliegue en `.serverless/cloudformation-template-update-stack-events.log`
3. Ejecuta `npm run logs -- --function=nombre-funcion` para ver logs de funciones específicas
4. Asegúrate de tener permisos adecuados en AWS para crear/modificar recursos 