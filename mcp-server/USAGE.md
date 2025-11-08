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

