# Configuración Automatizada de API en Amplify

## 🎯 Objetivo
Integrar automáticamente el backend Lambda con Amplify para que las URLs se generen automáticamente.

## 📋 Pasos para Configurar API en Amplify

### Paso 1: Ejecutar comando
```bash
cd frontend
amplify add api
```

### Paso 2: Respuestas Recomendadas

#### 1. **Service Type**
```
? Please select from one of the below mentioned services:
  ❯ REST  ← Seleccionar esta opción
    GraphQL
```

#### 2. **Resource Name**
```
? Provide a friendly name for your resource to be used as a label for this category in the project:
  emotioXV2-api  ← Escribir esto
```

#### 3. **API Path**
```
? Provide a path (e.g., /items):
  /api  ← Escribir esto
```

#### 4. **Lambda Source**
```
? Choose a Lambda source:
  ❯ Create a new Lambda function  ← Seleccionar esta opción
    Use a function in this project
    Provide a Lambda function ARN
```

#### 5. **Lambda Function Name**
```
? Provide a friendly name for your resource to be used as a label for this category in the project:
  emotioXV2-lambda  ← Escribir esto
```

#### 6. **Runtime**
```
? Choose the runtime that you want to use:
  ❯ NodeJS  ← Seleccionar esta opción
    Python
    Java
    Go
    .NET Core
    Ruby
```

#### 7. **Function Template**
```
? Choose the function template that you want to use:
  ❯ Hello World  ← Seleccionar esta opción
    CRUD function for DynamoDB (Integration with API Gateway)
    Serverless ExpressJS function (Integration with API Gateway)
    Lambda Trigger
```

#### 8. **Advanced Settings**
```
? Do you want to configure advanced settings?
  ❯ No  ← Seleccionar esta opción
    Yes
```

#### 9. **Edit Function**
```
? Do you want to edit the local lambda function now?
  ❯ No  ← Seleccionar esta opción
    Yes
```

#### 10. **API Access**
```
? Restrict API access?
  ❯ No  ← Seleccionar esta opción
    Yes
```

## 🚀 Después de la Configuración

### Paso 3: Push de la Configuración
```bash
amplify push
```

### Paso 4: Variables Automáticas
Amplify generará automáticamente las variables de entorno:
- `API_EMOTIOXV2API_GRAPHQLAPIENDPOINTOUTPUT`
- `API_EMOTIOXV2API_GRAPHQLAPIIDOUTPUT`

### Paso 5: Actualizar Código
Las URLs se generarán automáticamente y estarán disponibles en:
```javascript
const apiUrl = process.env.API_EMOTIOXV2API_GRAPHQLAPIENDPOINTOUTPUT;
```

## ✅ Beneficios
- ✅ **URLs automáticas** - No más configuración manual
- ✅ **Integración nativa** - Amplify + Lambda
- ✅ **Variables automáticas** - Se configuran solas
- ✅ **Deploy automático** - Con cada push

## 🔄 Alternativa: Integrar Backend Existente
Si prefieres usar tu backend Lambda existente:
1. Usa "Provide a Lambda function ARN"
2. Proporciona el ARN de tu función Lambda
3. Amplify se conectará automáticamente
