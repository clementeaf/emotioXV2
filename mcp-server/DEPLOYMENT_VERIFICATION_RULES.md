# 🔍 Reglas de Verificación de Deployments S3/CloudFront

## 📋 Objetivo

Verificar si los deployments de S3/CloudFront están actualizados con los cambios más recientes en git, considerando los GitHub Actions.

## 🎯 Reglas de Uso

### 1. Verificación de Sincronización (`check_deployment_sync`)

**Propósito:** Verificar si los deployments están sincronizados con los últimos commits.

**Reglas:**
- ✅ **Actualizado**: El último commit coincide con el último deployment
- ⚠️ **Desactualizado**: El último commit es más reciente que el último deployment
- ✅ **Deployment más reciente**: El deployment es más reciente que el último commit (caso raro)

**Uso:**
```
"Verifica si los deployments están sincronizados"
"check_deployment_sync para frontend"
"¿Están actualizados los deployments?"
```

### 2. Verificación de Estado S3/CloudFront (`verify_s3_cloudfront_status`)

**Propósito:** Verificar el estado de S3/CloudFront y comparar con los últimos commits.

**Reglas:**
- Verifica el último run de deployment
- Verifica que `index.html` existe en S3
- Verifica que el secret de CloudFront está configurado

**Uso:**
```
"Verifica el estado de S3/CloudFront para frontend"
"verify_s3_cloudfront_status para public-tests"
"¿Está configurado CloudFront para frontend?"
```

### 3. Comparación de Commits con Deployments (`compare_commits_with_deployments`)

**Propósito:** Comparar los últimos commits con los últimos deployments para identificar commits pendientes.

**Reglas:**
- Compara los últimos 5 commits con los últimos 5 deployments
- Identifica commits que no han sido desplegados
- Muestra el estado del último deployment

**Uso:**
```
"Compara los commits con los deployments"
"¿Hay commits pendientes de deploy?"
"compare_commits_with_deployments para public-tests"
```

## 📊 Criterios de Actualización

### ✅ Deployment Actualizado

Un deployment se considera **actualizado** cuando:
1. El último commit coincide con el commit del último deployment exitoso
2. El último deployment fue exitoso (`conclusion: success`)
3. No hay commits pendientes de deploy

### ⚠️ Deployment Desactualizado

Un deployment se considera **desactualizado** cuando:
1. El último commit es más reciente que el commit del último deployment
2. Hay commits pendientes de deploy
3. El último deployment falló (`conclusion: failure`)

### 🔄 Deployment en Progreso

Un deployment se considera **en progreso** cuando:
1. El último run está en estado `in_progress`
2. El commit del run coincide con el último commit
3. No hay errores en el run

## 🛠️ Herramientas Disponibles

### 1. `check_deployment_sync`
- Compara el último commit con el último deployment
- Calcula la diferencia de tiempo
- Indica si está actualizado o desactualizado

### 2. `verify_s3_cloudfront_status`
- Verifica el último run de deployment
- Verifica que `index.html` existe en S3
- Verifica que el secret de CloudFront está configurado

### 3. `compare_commits_with_deployments`
- Compara los últimos 5 commits con los últimos 5 deployments
- Identifica commits pendientes de deploy
- Muestra el estado del último deployment

## 📝 Ejemplos de Uso

### Verificar si los deployments están actualizados
```
"Verifica si los deployments están sincronizados"
"check_deployment_sync"
```

### Verificar estado específico de un servicio
```
"Verifica el estado de S3/CloudFront para frontend"
"verify_s3_cloudfront_status para frontend"
```

### Comparar commits con deployments
```
"Compara los commits con los deployments"
"compare_commits_with_deployments"
```

### Verificar todos los servicios
```
"Verifica si todos los deployments están actualizados"
"check_deployment_sync para all"
```

## 🔍 Interpretación de Resultados

### ✅ Actualizado
```
📦 frontend
   Último commit: abc1234 - feat: nueva funcionalidad
   Último deployment: abc1234
   Estado: ✅ Actualizado
```

### ⚠️ Desactualizado
```
📦 frontend
   Último commit: def5678 - fix: corregir bug
   Último deployment: abc1234
   Estado: ⚠️ Desactualizado (2.5 horas de diferencia)
```

### 🔄 En Progreso
```
📦 frontend
   Último commit: def5678 - fix: corregir bug
   Último deployment: def5678
   Estado: ✅ Actualizado
   Run: in_progress - in_progress
```

## 🚨 Acciones Recomendadas

### Si el deployment está desactualizado:
1. Verificar que el workflow de deployment se ejecutó
2. Revisar los logs del último run
3. Verificar que no hay errores en el workflow
4. Si es necesario, ejecutar el deployment manualmente

### Si el deployment falló:
1. Revisar los logs del run fallido
2. Verificar la configuración de AWS
3. Verificar que los secrets están configurados
4. Corregir los errores y volver a intentar

### Si hay commits pendientes:
1. Verificar que los cambios afectan al servicio
2. Verificar que el workflow se ejecutó para esos commits
3. Si es necesario, ejecutar el deployment manualmente

## 📋 Checklist de Verificación

Antes de considerar un deployment como actualizado, verificar:

- [ ] El último commit coincide con el commit del último deployment
- [ ] El último deployment fue exitoso
- [ ] No hay commits pendientes de deploy
- [ ] El archivo `index.html` existe en S3
- [ ] El secret de CloudFront está configurado
- [ ] El último run no tiene errores

## 🔧 Requisitos

Para usar estas herramientas, necesitas:
- Git configurado
- GitHub CLI (`gh`) instalado y autenticado
- AWS CLI instalado (opcional, para verificación de S3)
- Acceso a los secrets de GitHub (para verificación de CloudFront)

## 📝 Notas

- Las verificaciones se basan en los commits y runs de GitHub Actions
- No se verifica directamente el contenido de S3/CloudFront (requiere AWS CLI)
- Los secrets de CloudFront se verifican a través de GitHub CLI
- La comparación de commits se hace con los últimos 5 commits y deployments

