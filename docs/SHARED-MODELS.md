# Modelos Compartidos en EmotioX

Este documento explica cómo utilizar y mantener los modelos compartidos entre el frontend y el backend.

## Estructura

El proyecto utiliza una arquitectura de monorepo con workspaces de npm, con tres paquetes principales:

- `frontend`: Aplicación Next.js
- `backend`: Servicios serverless basados en AWS
- `shared`: Modelos y tipos compartidos entre frontend y backend

## Uso de los modelos compartidos

### Importación en frontend y backend

Para importar los modelos compartidos, utilice:

```typescript
import { ResearchType, ResearchBasicData /* otros tipos */ } from '@emotiox/shared';
```

### Ventajas

- **Consistencia de tipos**: Garantiza que las estructuras de datos sean idénticas en frontend y backend
- **Mantenibilidad**: Actualizar un modelo en un solo lugar lo actualiza en toda la aplicación
- **Validación**: Comparte lógica de validación entre cliente y servidor

## Cómo agregar nuevos modelos

1. Cree o actualice los archivos de interfaz en `shared/interfaces/`
2. Exporte las interfaces en `shared/src/index.ts`
3. Compile el paquete shared: `npm run build:shared`
4. Actualice las dependencias: `npm install`

## Cómo usar los modelos en el desarrollo

Antes de ejecutar el frontend o el backend, asegúrese de compilar los modelos compartidos:

```bash
npm run build:shared
```

O utilice los scripts configurados:

```bash
npm run frontend:dev  # Compila shared y ejecuta el frontend
npm run backend:dev   # Compila shared y ejecuta el backend
```

## Resolución de problemas

### Si los tipos no se actualizan

1. Verifique que el modelo esté correctamente exportado en `shared/src/index.ts`
2. Ejecute `npm run build:shared`
3. Reinicie el servidor de desarrollo

### Errores de compilación 

Si hay errores de importación después de agregar nuevos modelos:

1. Verifique si hay conflictos de nombres entre diferentes archivos
2. Utilice importaciones y exportaciones nombradas para resolver conflictos
3. Siga el patrón establecido en `shared/src/index.ts`

## Buenas prácticas

- No importe directamente desde `shared/interfaces/*` - siempre use `@emotiox/shared`
- Mantenga los modelos agrupados por dominio en archivos separados
- Documente todas las interfaces con comentarios JSDoc
- Evite definiciones duplicadas de tipos similares
- Considere usar Zod para la validación de datos cuando sea apropiado 