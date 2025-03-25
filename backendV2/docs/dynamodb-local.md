# Configuración y Uso de DynamoDB Local

## Introducción

DynamoDB Local es una versión descargable de Amazon DynamoDB que permite desarrollar y probar aplicaciones utilizando una base de datos DynamoDB en el entorno local, sin acceder al servicio web de DynamoDB. Esta guía explica cómo configurar y utilizar DynamoDB Local en el proyecto EmotioXV2.

## Instalación y Configuración

### Prerrequisitos

- Node.js instalado (v14.x o superior)
- Java Runtime Environment (JRE) versión 8.x o superior
- Serverless Framework instalado globalmente (`npm install -g serverless`)

### Instalación del Plugin

En el proyecto EmotioXV2, utilizamos el plugin `serverless-dynamodb-local` para integrar DynamoDB Local con el Serverless Framework:

```bash
cd backendV2
npm install --save-dev serverless-dynamodb-local
```

### Configuración en serverless.yml

El archivo `serverless.yml` ya contiene la configuración necesaria para DynamoDB Local:

```yaml
plugins:
  - serverless-offline
  - serverless-dynamodb-local
  - serverless-plugin-typescript

custom:
  tableName: 'emotioXV2-table-${self:provider.stage}'
  userTableName: 'emotioxv2-users-${self:provider.stage}'
  dynamodb:
    stages:
      - dev
    start:
      port: 8000
      inMemory: true
      migrate: true
      seed: true
    seed:
      domain:
        sources:
          - table: ${self:custom.userTableName}
            sources: [./migrations/users.json]
          - table: ${self:custom.tableName}
            sources: [./migrations/research.json]
```

### Migraciones y Semillas de Datos

Las migraciones se definen en el directorio `migrations/`. Existen dos archivos principales:

1. **`migrations/users.json`**: Define la estructura de la tabla de usuarios y datos iniciales.
2. **`migrations/research.json`**: Define la estructura de la tabla de investigaciones y datos iniciales.

#### Ejemplo de archivo de migración para la tabla de investigaciones:

```json
{
  "Table": {
    "TableName": "emotioXV2-table-dev",
    "KeySchema": [
      {
        "AttributeName": "id",
        "KeyType": "HASH"
      }
    ],
    "AttributeDefinitions": [
      {
        "AttributeName": "id",
        "AttributeType": "S"
      },
      {
        "AttributeName": "userId",
        "AttributeType": "S"
      }
    ],
    "GlobalSecondaryIndexes": [
      {
        "IndexName": "UserIdIndex",
        "KeySchema": [
          {
            "AttributeName": "userId",
            "KeyType": "HASH"
          }
        ],
        "Projection": {
          "ProjectionType": "ALL"
        },
        "ProvisionedThroughput": {
          "ReadCapacityUnits": 5,
          "WriteCapacityUnits": 5
        }
      }
    ],
    "ProvisionedThroughput": {
      "ReadCapacityUnits": 5,
      "WriteCapacityUnits": 5
    }
  }
}
```

## Comandos para Iniciar y Utilizar DynamoDB Local

### Instalación de DynamoDB Local

La primera vez que se utiliza, es necesario instalar DynamoDB Local:

```bash
cd backendV2
serverless dynamodb install
```

### Iniciar DynamoDB Local

Para iniciar DynamoDB Local:

```bash
cd backendV2
serverless dynamodb start
```

Este comando iniciará DynamoDB Local en el puerto 8000 (o el puerto configurado en `serverless.yml`).

### Iniciar la Aplicación con DynamoDB Local

Para iniciar toda la aplicación con DynamoDB Local:

```bash
cd backendV2
serverless offline start
```

Este comando inicia tanto el servidor de API como DynamoDB Local.

## Trabajando con DynamoDB Local

### Verificación de Tablas

Para verificar que las tablas se han creado correctamente, puede utilizar AWS CLI configurado para apuntar a su instancia local:

```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000
```

### Consulta de Datos

Para consultar datos de una tabla específica:

```bash
aws dynamodb scan --table-name emotioXV2-table-dev --endpoint-url http://localhost:8000
```

### Inserción Manual de Datos

Para insertar datos manualmente:

```bash
aws dynamodb put-item \
  --table-name emotioXV2-table-dev \
  --item '{
    "id": {"S": "test-id-1"},
    "name": {"S": "Test Research"},
    "userId": {"S": "user-id-1"},
    "enterprise": {"S": "Test Enterprise"},
    "type": {"S": "eye-tracking"},
    "status": {"S": "draft"},
    "createdAt": {"N": "1684123456789"},
    "updatedAt": {"N": "1684123456789"}
  }' \
  --endpoint-url http://localhost:8000
```

## Código del Cliente DynamoDB en la Aplicación

En el código de la aplicación, la conexión a DynamoDB Local se realiza automáticamente cuando se detecta que está en modo desarrollo:

```typescript
// En el constructor del modelo NewResearchModel
constructor() {
  this.tableName = process.env.TABLE_NAME || 'emotioXV2-table';
  
  let options: any = {};
  
  // Si estamos en entorno de desarrollo o modo offline, usar DynamoDB Local
  if (process.env.IS_OFFLINE || process.env.NODE_ENV === 'development') {
    options = {
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    };
  }
  
  this.dynamoClient = new DynamoDB.DocumentClient(options);
}
```

## Scripts de Utilidad

Para facilitar el desarrollo, se han creado varios scripts:

### login.sh

Este script inicia sesión y recupera un token de autenticación:

```bash
source backendV2/scripts/login.sh
```

### export-token.sh

Este script exporta el token como una variable de entorno:

```bash
source backendV2/scripts/export-token.sh
```

## Solución de Problemas Comunes

### Tabla no encontrada (ResourceNotFoundException)

Si recibe un error "ResourceNotFoundException" al intentar acceder a una tabla:

1. Verifique que DynamoDB Local esté en ejecución
2. Compruebe que las migraciones se hayan aplicado correctamente
3. Verifique que está utilizando el nombre de tabla correcto
4. Reinicie DynamoDB Local y ejecute las migraciones nuevamente

### Errores de Conexión

Si experimenta errores de conexión a DynamoDB Local:

1. Verifique que DynamoDB Local esté en ejecución en el puerto configurado
2. Compruebe que el cliente DynamoDB en su código esté configurado con el endpoint correcto
3. Asegúrese de que no hay otro servicio utilizando el puerto 8000

### Problemas con las Migraciones

Si las migraciones no se aplican correctamente:

1. Elimine el directorio `.dynamodb` en la raíz del proyecto
2. Reinstale DynamoDB Local con `serverless dynamodb install`
3. Inicie DynamoDB Local nuevamente con `serverless dynamodb start`

## Diferencias con DynamoDB en AWS

Tenga en cuenta las siguientes diferencias entre DynamoDB Local y el servicio real de AWS:

1. **Rendimiento**: DynamoDB Local no simula con precisión las latencias del servicio en la nube
2. **Capacidad**: DynamoDB Local no implementa los límites de capacidad de lectura/escritura
3. **Características avanzadas**: Algunas características como TTL, backups y recuperación puntual no están disponibles
4. **Autenticación**: DynamoDB Local no requiere credenciales de AWS
5. **Consistencia**: DynamoDB Local no simula los modelos de consistencia eventual

## Recomendaciones para Desarrollo

1. **Utilice los mismos nombres de tabla** que en producción pero con un sufijo `-dev`
2. **Defina índices secundarios** en las migraciones, incluso si no los utiliza de inmediato
3. **Simule datos realistas** en sus archivos de semilla para probar escenarios más cercanos a la producción
4. **Realice pruebas regularmente** para asegurarse de que todo funciona correctamente con DynamoDB Local
5. **Implemente validación robusta** para detectar problemas temprano

## Referencias Adicionales

- [Documentación oficial de DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [Plugin serverless-dynamodb-local](https://github.com/99x/serverless-dynamodb-local)
- [AWS SDK para JavaScript/TypeScript](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/dynamodb-example-table-read-write.html) 