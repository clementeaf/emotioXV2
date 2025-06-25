# 📝 Plan de Refactorización: `SmartVOCForm`

## 🎯 **Objetivo Principal**

Refactorizar el hook monolítico `useSmartVOCForm.ts` para que siga el patrón de **composición de hooks** utilizado en `CognitiveTaskForm`. El objetivo es mejorar la mantenibilidad, testabilidad y consistencia arquitectónica del formulario SmartVOC.

## 🗺️ **Estrategia General**

Descompondremos el hook `useSmartVOCForm.ts` en tres hooks más pequeños, cada uno con una única responsabilidad:

1.  **`useSmartVOCState.ts`**: Gestionará el estado del formulario (`formData`) y las funciones que lo modifican directamente.
2.  **`useSmartVOCMutations.ts`**: Contendrá toda la lógica de `TanStack Query` (`useQuery` y `useMutation`) para interactuar con la API.
3.  **`useSmartVOCForm.ts` (Refactorizado)**: Actuará como un **orquestador**, importando los otros hooks y componiendo su lógica para entregar las props finales al componente de UI.

---

## ✅ **Checklist de Refactorización Detallado**

### **Fase 1: Preparación y Creación de Archivos**

-   [ ] Crear una nueva carpeta: `frontend/src/components/research/SmartVOC/hooks/`.
-   [ ] Mover el archivo `useSmartVOCForm.ts` a la nueva carpeta `hooks/`.
-   [ ] Crear los siguientes archivos vacíos dentro de la nueva carpeta `hooks/`:
    -   `useSmartVOCState.ts`
    -   `useSmartVOCMutations.ts`

### **Fase 2: Aislar la Gestión de Estado (`useSmartVOCState.ts`)**

-   [ ] **Mover Lógica desde `useSmartVOCForm.ts` a `useSmartVOCState.ts`**:
    -   [ ] Mover la declaración `useState<SmartVOCFormData>`.
    -   [ ] Mover las funciones `updateQuestion`, `updateSettings`, `addQuestion` y `removeQuestion`.
-   [ ] **Definir el Retorno del Hook**:
    -   [ ] El hook `useSmartVOCState` debe retornar:
        -   `formData`
        -   `setFormData`
        -   `updateQuestion`
        -   `updateSettings`
        -   `addQuestion`
        -   `removeQuestion`

### **Fase 3: Aislar las Operaciones de API (`useSmartVOCMutations.ts`)**

-   [ ] **Mover Lógica desde `useSmartVOCForm.ts` a `useSmartVOCMutations.ts`**:
    -   [ ] Mover la consulta `useQuery` para obtener los datos existentes.
    -   [ ] Mover la mutación `useMutation` para guardar (crear/actualizar) los datos.
    -   [ ] Crear una nueva mutación `useMutation` específicamente para la operación de borrado (`handleDelete`).
-   [ ] **Definir la Interfaz y Retorno del Hook**:
    -   [ ] El hook debe aceptar `researchId` y `smartVocId` como parámetros.
    -   [ ] El hook `useSmartVOCMutations` debe retornar:
        -   Datos de la consulta: `smartVocData`, `isLoading`.
        -   Mutación de guardado: `saveMutation`, `isSaving`.
        -   Mutación de borrado: `deleteMutation`, `isDeleting`.

### **Fase 4: Recomponer el Hook Principal (`useSmartVOCForm.ts`)**

-   [ ] **Limpiar `useSmartVOCForm.ts`**:
    -   [ ] Eliminar toda la lógica que se movió a los nuevos hooks (useState, useQuery, useMutation, callbacks de estado).
-   [ ] **Componer los Hooks**:
    -   [ ] Importar y llamar a `useSmartVOCState`.
    -   [ ] Importar y llamar a `useSmartVOCMutations`, pasándole `researchId` y `smartVocId`.
-   [ ] **Manejar Efectos Secundarios**:
    -   [ ] Re-implementar el `useEffect` que actualiza el `formData` cuando `smartVocData` (del hook de mutaciones) cambia. Este `useEffect` debe llamar a `setFormData` (del hook de estado).
-   [ ] **Orquestar las Acciones Principales**:
    -   [ ] Re-implementar `handleSave`, que ahora llamará a la lógica de validación y luego a `saveMutation.mutate`.
    -   [ ] Re-implementar `handleDelete`, que ahora simplemente llamará a `deleteMutation.mutate`.
-   [ ] **Asegurar el Contrato de Salida**:
    -   [ ] Verificar que el objeto final retornado por `useSmartVOCForm` siga siendo el mismo que espera el componente `SmartVOCForm/index.tsx`, para no romper la UI.

### **Fase 5: Lógica de Validación (Bonus, si no existe)**

-   [ ] Crear `useSmartVOCValidation.ts` si se desea un aislamiento completo (similar a CognitiveTask).
-   [ ] Mover la función `validateForm` y la lógica de `ValidationErrors` a este nuevo hook.
-   [ ] Importar y usar `useSmartVOCValidation` en el hook principal `useSmartVOCForm`.

### **Fase 6: Verificación Final**

-   [ ] **Pruebas Funcionales**:
    -   [ ] Verificar que el formulario carga correctamente datos existentes.
    -   [ ] Verificar que se puede crear una nueva configuración.
    -   [ ] Verificar que se puede actualizar una configuración existente.
    -   [ ] Verificar que la validación de errores (ej. nombre de empresa) funciona y muestra el mensaje correcto.
    -   [ ] Verificar que el filtrado de preguntas no editadas sigue funcionando.
    -   [ ] Verificar que se puede eliminar una configuración.
-   [ ] **Limpieza de Código**:
    -   [ ] Eliminar cualquier import no utilizado de todos los archivos modificados.
    -   [ ] Formatear el código con Prettier.

---

Este plan desglosado asegura una transición suave y controlada hacia una arquitectura de código mucho más limpia y robusta.
