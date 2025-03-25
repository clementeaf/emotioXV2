# Documentación de EmotioXV2 API

## Introducción

Bienvenido a la documentación de la API de EmotioXV2. Este repositorio de documentación proporciona información detallada sobre la API, sus modelos de datos, configuraciones y guías para desarrolladores.

## Contenido

### Referencia de la API

- [API Reference](./api-reference.md) - Documentación completa de endpoints de la API, parámetros, respuestas y ejemplos.

### Modelos de Datos

- [Modelo de Investigación (Research)](./research-model.md) - Estructura, validaciones y operaciones del modelo de investigación.

### Guías de Configuración

- [DynamoDB Local](./dynamodb-local.md) - Configuración y uso de DynamoDB Local para desarrollo.

## Entorno de Desarrollo

La API de EmotioXV2 está desarrollada utilizando las siguientes tecnologías:

- **Node.js** - Entorno de ejecución
- **TypeScript** - Lenguaje de programación
- **Serverless Framework** - Framework para la implementación de aplicaciones serverless
- **DynamoDB** - Base de datos NoSQL
- **JWT** - Autenticación basada en tokens

## Flujo de Trabajo Recomendado

Para trabajar con la API de EmotioXV2, recomendamos el siguiente flujo de trabajo:

1. **Configuración del entorno local**:
   - Instale los prerrequisitos (Node.js, Java para DynamoDB Local)
   - Configure DynamoDB Local siguiendo la [guía de configuración](./dynamodb-local.md)

2. **Desarrollo**:
   - Inicie el servicio en modo local con `serverless offline start`
   - Utilice los [scripts de utilidad](../scripts/README.md) para facilitar el desarrollo

3. **Pruebas**:
   - Utilice [Postman](https://www.postman.com/) o [curl](https://curl.se/) para probar los endpoints
   - Consulte los ejemplos en la [referencia de la API](./api-reference.md)

4. **Depuración**:
   - Verifique los logs del servidor para identificar errores
   - Utilice herramientas como el AWS CLI para interactuar directamente con DynamoDB Local

## Estructura de Archivos

La estructura de archivos principal del proyecto es la siguiente:

```
backendV2/
├── migrations/         # Migraciones para DynamoDB Local
├── scripts/            # Scripts de utilidad para desarrollo
├── src/
│   ├── controllers/    # Controladores de la API
│   ├── models/         # Modelos de datos
│   ├── services/       # Servicios de negocio
│   ├── utils/          # Utilidades comunes
│   └── index.ts        # Punto de entrada de la aplicación
├── docs/               # Documentación (estás aquí)
├── serverless.yml      # Configuración del Serverless Framework
└── package.json        # Dependencias y scripts
```

## Convenciones de Código

El proyecto sigue las siguientes convenciones:

- **Arquitectura**: Modelo-Vista-Controlador (MVC)
- **Nomenclatura**: camelCase para variables y funciones, PascalCase para clases e interfaces
- **Formato**: Configuración de ESLint y Prettier
- **Documentación**: JSDoc para documentación de código

## Preguntas Frecuentes

### ¿Cómo iniciar el proyecto en modo desarrollo?

```bash
cd backendV2
npm install
serverless dynamodb install (solo la primera vez)
serverless offline start
```

### ¿Cómo obtener un token de autenticación para pruebas?

Utilice los scripts de utilidad:

```bash
source backendV2/scripts/login.sh
source backendV2/scripts/export-token.sh
```

### ¿Cómo crear una nueva investigación?

Consulte los ejemplos en la [referencia de la API](./api-reference.md#crear-una-nueva-investigación).

## Contribuir a la Documentación

Si desea contribuir a esta documentación:

1. Añada nuevos archivos Markdown en el directorio `docs/`
2. Actualice este README para incluir referencias a los nuevos documentos
3. Mantenga un formato coherente con la documentación existente

## Contacto

Para cualquier pregunta o comentario sobre la API o su documentación, póngase en contacto con el equipo de desarrollo. 