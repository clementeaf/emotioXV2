# 🚀 Guía de Uso del Servidor MCP EmotioXV2

## 📋 Ejemplos de Uso

### Git Operations

#### 1. Ver estado de Git
```
"Revisa el estado de git"
"¿Qué archivos están modificados?"
"git_status"
```

#### 2. Hacer commit
```
"Haz commit de estos cambios con el mensaje 'feat: agregar nueva funcionalidad'"
"git_commit con mensaje 'fix: corregir bug'"
```

#### 3. Hacer push
```
"Sube los cambios al remoto"
"git_push a la rama main"
```

#### 4. Commit y push en una sola operación
```
"Haz commit y push con el mensaje 'feat: nueva feature'"
"git_commit_and_push con mensaje 'fix: bug fix'"
```

### GitHub Actions

#### 5. Listar últimos runs
```
"Lista los últimos runs de GitHub Actions"
"¿Cuáles son los últimos 5 runs?"
"github_actions_list_runs con límite 10"
```

#### 6. Ver detalles de un run
```
"Muéstrame los detalles del run 19194317489"
"¿Cuál es el estado del run 19194317489?"
```

#### 7. Ver logs de un run
```
"Muéstrame los logs del run 19194317489"
"¿Qué pasó en el run 19194317489?"
```

#### 8. Listar workflows
```
"Lista todos los workflows disponibles"
"¿Qué workflows hay configurados?"
```

### Deployments

#### 9. Ver estado de deployments
```
"¿Cuál es el estado de los deployments?"
"Verifica el estado del deployment de frontend"
"deployment_status para public-tests"
```

#### 10. Resumen completo
```
"Dame un resumen completo del estado del proyecto"
"¿Cómo está todo? deployment_summary"
"Muéstrame el estado general"
```

#### 11. Verificar sincronización de deployments
```
"Verifica si los deployments están sincronizados"
"check_deployment_sync para frontend"
"¿Están actualizados los deployments?"
```

#### 12. Verificar estado S3/CloudFront
```
"Verifica el estado de S3/CloudFront para frontend"
"verify_s3_cloudfront_status para public-tests"
"¿Está configurado CloudFront para frontend?"
```

#### 13. Comparar commits con deployments
```
"Compara los commits con los deployments"
"compare_commits_with_deployments"
"¿Hay commits pendientes de deploy?"
```

### DynamoDB

#### 14. Listar tablas de DynamoDB
```
"Lista todas las tablas de DynamoDB"
"dynamodb_list_tables para dev"
"¿Qué tablas de DynamoDB hay?"
```

#### 15. Obtener item de DynamoDB
```
"Obtén el item con id '123' de la tabla 'researches-dev'"
"dynamodb_get_item con tableName: 'researches-dev' y key: {id: '123'}"
```

#### 16. Crear/actualizar item en DynamoDB
```
"Crea un item en la tabla 'researches-dev'"
"dynamodb_put_item con tableName: 'researches-dev' y item: {id: '123', name: 'Test'}"
```

#### 17. Consultar tabla de DynamoDB
```
"Consulta la tabla 'researches-dev' por researchId"
"dynamodb_query con tableName: 'researches-dev', keyConditionExpression: 'researchId = :id', expressionAttributeValues: {':id': '123'}"
```

#### 18. Escanear tabla de DynamoDB
```
"Escanea la tabla 'researches-dev'"
"dynamodb_scan con tableName: 'researches-dev'"
```

#### 19. Eliminar item de DynamoDB
```
"Elimina el item con id '123' de la tabla 'researches-dev'"
"dynamodb_delete_item con tableName: 'researches-dev' y key: {id: '123'}"
```

### S3

#### 20. Listar buckets de S3
```
"Lista todos los buckets de S3"
"s3_list_buckets"
```

#### 21. Listar objetos en bucket
```
"Lista los objetos en el bucket 'emotioxv2-uploads-dev'"
"s3_list_objects con bucket: 'emotioxv2-uploads-dev'"
```

#### 22. Obtener objeto de S3
```
"Obtén el objeto 'config.json' del bucket 'emotioxv2-uploads-dev'"
"s3_get_object con bucket: 'emotioxv2-uploads-dev' y key: 'config.json'"
```

#### 23. Subir objeto a S3
```
"Sube el objeto 'config.json' al bucket 'emotioxv2-uploads-dev'"
"s3_put_object con bucket: 'emotioxv2-uploads-dev', key: 'config.json' y body: '{\"key\": \"value\"}'"
```

#### 24. Eliminar objeto de S3
```
"Elimina el objeto 'config.json' del bucket 'emotioxv2-uploads-dev'"
"s3_delete_object con bucket: 'emotioxv2-uploads-dev' y key: 'config.json'"
```

#### 25. Obtener política de bucket
```
"Obtén la política del bucket 'emotioxv2-uploads-dev'"
"s3_get_bucket_policy con bucket: 'emotioxv2-uploads-dev'"
```

#### 26. Actualizar política de bucket
```
"Actualiza la política del bucket 'emotioxv2-uploads-dev'"
"s3_put_bucket_policy con bucket: 'emotioxv2-uploads-dev' y policy: {...}"
```

#### 27. Obtener configuración CORS de bucket
```
"Obtén la configuración CORS del bucket 'emotioxv2-uploads-dev'"
"s3_get_bucket_cors con bucket: 'emotioxv2-uploads-dev'"
```

#### 28. Actualizar configuración CORS de bucket
```
"Actualiza la configuración CORS del bucket 'emotioxv2-uploads-dev'"
"s3_put_bucket_cors con bucket: 'emotioxv2-uploads-dev' y corsConfig: {...}"
```

## 💡 Consejos de Uso

### Uso Natural
Puedes usar lenguaje natural para pedir las operaciones:
- "Revisa el estado de git"
- "Haz commit y push de estos cambios"
- "Muéstrame el estado de los deployments"

### Uso Directo
También puedes usar los nombres de las herramientas directamente:
- `git_status`
- `git_commit_and_push`
- `deployment_summary`

### Combinaciones
Puedes combinar múltiples operaciones:
- "Revisa git y luego muestra el estado de deployments"
- "Lista los últimos runs y verifica el estado de deployments"

## 🔧 Ejemplos Prácticos

### Flujo de trabajo típico

1. **Revisar cambios antes de commit**
   ```
   "Revisa el estado de git"
   ```

2. **Hacer commit y push**
   ```
   "Haz commit y push con el mensaje 'feat: nueva funcionalidad'"
   ```

3. **Verificar que el deployment se inició**
   ```
   "¿Cuál es el estado de los deployments?"
   ```

4. **Revisar el run de GitHub Actions**
   ```
   "Lista los últimos runs de GitHub Actions"
   ```

5. **Ver logs si hay problemas**
   ```
   "Muéstrame los logs del último run"
   ```

6. **Gestionar DynamoDB y S3**
   ```
   "Lista todas las tablas de DynamoDB"
   "Obtén el item con id '123' de la tabla 'researches-dev'"
   "Lista los objetos en el bucket 'emotioxv2-uploads-dev'"
   "Obtén la política del bucket 'emotioxv2-uploads-dev'"
   ```

## 🎯 Casos de Uso Comunes

### Antes de hacer push
```
"Revisa git, luego haz commit y push con el mensaje 'fix: corregir error'"
```

### Después de hacer push
```
"Verifica el estado de los deployments y lista los últimos runs"
```

### Monitoreo continuo
```
"Dame un resumen completo del estado del proyecto"
```

### Debugging
```
"Muéstrame los logs del run 19194317489"
```

## 📝 Notas

- Todas las operaciones se ejecutan desde el directorio raíz del proyecto
- El servidor MCP necesita que GitHub CLI esté autenticado
- Los comandos de git deben estar disponibles en el PATH
- El servidor se comunica con Cursor a través de stdio

