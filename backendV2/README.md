# EmotioXV2 Backend

Este es el backend para la aplicación EmotioXV2, una plataforma para investigación y análisis de emociones.

## Estructura del Proyecto

```
backendV2/
│
├── src/                      # Código fuente
│   ├── controllers/          # Controladores para manejar solicitudes HTTP
│   ├── models/               # Definiciones de tipos e interfaces
│   ├── services/             # Servicios para la lógica de negocio
│   └── index.ts              # Punto de entrada principal
│
├── dist/                     # Código compilado (generado)
├── node_modules/             # Dependencias (generado)
├── .gitignore                # Archivos ignorados por git
├── package.json              # Dependencias y scripts
├── package-lock.json         # Versiones exactas de dependencias
├── tsconfig.json             # Configuración de TypeScript
└── README.md                 # Este archivo
```

## Características Principales

- Autenticación de usuarios con JWT
- CRUD completo para investigaciones, emociones y pantallas de bienvenida
- Soporte para WebSockets para comunicación en tiempo real
- Paginación de resultados
- Manejo estandarizado de errores

## Tecnologías

- TypeScript
- Node.js
- AWS Lambda
- AWS API Gateway (REST y WebSocket)
- AWS DynamoDB (simulado)

## Instalación

1. Instalar dependencias:

```bash
npm install
```

2. Compilar el proyecto:

```bash
npm run build
```

## Desarrollo

Para iniciar el proyecto en modo de desarrollo:

```bash
npm run dev
```

## API

### Autenticación

- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar nuevo usuario

### Investigaciones

- `GET /research` - Obtener todas las investigaciones
- `GET /research/{id}` - Obtener una investigación específica
- `POST /research` - Crear una investigación
- `PUT /research/{id}` - Actualizar una investigación
- `DELETE /research/{id}` - Eliminar una investigación
- `POST /research/{id}/publish` - Publicar una investigación

### Emociones

- `GET /emotions` - Obtener todas las emociones del usuario
- `GET /emotions/{id}` - Obtener una emoción específica
- `POST /emotions` - Crear una emoción
- `PUT /emotions/{id}` - Actualizar una emoción
- `DELETE /emotions/{id}` - Eliminar una emoción
- `GET /emotions/search` - Buscar emociones

### Pantallas de Bienvenida

- `POST /welcome-screens` - Crear una pantalla de bienvenida
- `GET /welcome-screens/{id}` - Obtener una pantalla de bienvenida por su ID
- `GET /welcome-screens/research/{researchId}` - Obtener la pantalla asociada a una investigación
- `PUT /welcome-screens/{id}` - Actualizar una pantalla de bienvenida
- `DELETE /welcome-screens/{id}` - Eliminar una pantalla de bienvenida

Todas las rutas requieren autenticación mediante un token JWT en el header `Authorization`.

## WebSocket

Eventos soportados:

- `CONNECT` - Conexión nueva
- `DISCONNECT` - Desconexión
- `MESSAGE` - Mensaje genérico
- `EMOTION_SUBMITTED` - Emoción enviada
- `RESEARCH_STATUS_CHANGED` - Estado de investigación cambiado
- `PARTICIPANT_JOINED` - Participante se unió
- `PARTICIPANT_LEFT` - Participante salió

## CI/CD

Se ha implementado un flujo de CI/CD utilizando GitHub Actions para automatizar el proceso de pruebas, validación, despliegue y exportación de endpoints.

### Flujos de Trabajo

1. **Integración Continua (CI)**: Ejecuta pruebas y validaciones en cada pull request.
2. **Despliegue Continuo (CD)**: Despliega la aplicación a AWS y exporta los endpoints cuando se fusiona código en las ramas principales.

### Documentación

Para obtener información detallada sobre el sistema de CI/CD, incluyendo configuración, flujo de trabajo y resolución de problemas, consulta:

- [Documentación de CI/CD](docs/cicd.md)

### Despliegue Manual

Para realizar un despliegue manual y generar los archivos de configuración de endpoints:

```bash
# Desplegar al entorno de desarrollo
./scripts/deploy-and-export.sh

# Desplegar a un entorno específico
./scripts/deploy-and-export.sh prod us-west-1
```

### Archivos Generados

El proceso de CD genera los siguientes archivos:

- `outputs.json`: Salidas del stack de CloudFormation
- `endpoints.json`: Endpoints generados por Serverless Framework
- `frontend/src/config/api-endpoints.js`: Configuración para JavaScript
- `frontend/src/config/api-endpoints.ts`: Configuración para TypeScript

## Documentación Adicional

Para información más detallada sobre componentes específicos del sistema, consulta:

- [Sistema de Autenticación](docs/authentication.md) - Detalles sobre el sistema de JWT y autenticación
- [Pantallas de Bienvenida](docs/welcome-screens.md) - Documentación completa de la API de welcome-screens
- [Documentación de CI/CD](docs/cicd.md) - Información sobre el proceso de integración continua

## Licencia

MIT 