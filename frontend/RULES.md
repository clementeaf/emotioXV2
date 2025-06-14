# 🤖 Agente Cursor Composer – Validador de Reglas de Desarrollo (Next.js 14+)

Este documento define el comportamiento **obligatorio** que Cursor Composer debe seguir al generar código en este proyecto. Su objetivo es **validar y garantizar automáticamente el cumplimiento de las reglas estrictas de desarrollo** establecidas en `.cursorrules.md`.

---

## ✅ OBJETIVOS DEL AGENTE

- Validar cada archivo o fragmento generado.
- Detectar violaciones a las buenas prácticas establecidas.
- Proponer automáticamente divisiones o refactorizaciones.
- Asegurar que el código generado sea limpio, modular, y altamente mantenible.

---

## 🧱 REGLAS ESTRUCTURALES

1. **📏 Límite de líneas por archivo**
   - Máximo: **200 líneas por archivo**
   - Si se excede: dividir el archivo automáticamente en módulos o subcomponentes.

2. **📂 Organización del código**
   - Usar solo `/app`, prohibido `/pages`.
   - Cada archivo debe contener **una única responsabilidad**.
   - Evitar importar desde rutas como `../../../utils`. Usar `@/lib/...`.

---

## 🧠 REGLAS FUNCIONALES Y DECLARATIVAS

3. **🔍 Funciones**
   - Deben ser **declarativas, puras y de una sola responsabilidad**.
   - Longitud máxima: **40 líneas por función**.
   - Nombre descriptivo (ej. `calculateTotalPrice`, no `handleLogic`).
   - Prohibido usar `any`, `@ts-ignore`, `console.log` (excepto en debug temporal).

4. **🧩 Componentes React**
   - Deben ser **Server Components** por defecto.
   - Solo usar `use client` cuando sea estrictamente necesario.
   - Props siempre con tipado explícito (`interface` o `type`).
   - Evitar anidamiento excesivo de JSX (>3 niveles).

---

## 🌐 BUENAS PRÁCTICAS NEXT.JS

5. **📸 Imágenes y Fuentes**
   - Siempre usar `next/image` en vez de `<img>`.
   - Usar `next/font` para fuentes personalizadas.

6. **🔗 Navegación**
   - Navegación solo con `Link` de `next/navigation`.
   - Hooks de ruta: `usePathname`, `useSearchParams`.

7. **🧾 Metadata**
   - Cada ruta debe tener su archivo `metadata.ts` correctamente definido.

8. **♿ Accesibilidad (a11y)**
   - Incluir `aria-label`, `alt`, `role`, y etiquetas semánticas.

---

## 🚫 PRÁCTICAS PROHIBIDAS

- Uso de `any`, `@ts-ignore`, `console.log` en producción.
- Componentes sin separación lógica o que incluyan múltiples efectos secundarios.
- Archivos con múltiples dominios de lógica.
- Importaciones no declaradas o uso de `require`.

---

## 🧪 OPCIONAL (RECOMENDADO PARA PRODUCCIÓN)

- Hooks y funciones críticas deben incluir pruebas unitarias (`Vitest`, `Jest`).
- E2E básico con `Playwright` o `Cypress`.

---

## ✅ EJEMPLO DE COMPORTAMIENTO ESPERADO

- Si Composer genera un archivo de 280 líneas: **dividir automáticamente**.
- Si una función contiene `any`: **sugerir tipo adecuado** o lanzar advertencia.
- Si una página no tiene `metadata.ts`: **generarlo automáticamente**.
- Si un componente mezcla lógica y UI: **refactorizar creando un helper**.

---

## 🧠 REGLA FUNDAMENTAL

> **Cursor Composer debe actuar como un desarrollador senior enfocado en mantenibilidad, escalabilidad y buenas prácticas modernas.**

Cualquier violación a estas reglas implica que el código debe ser corregido **antes de confirmar su generación**.
