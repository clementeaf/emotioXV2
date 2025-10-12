# ModernSelect Component

Un componente selector moderno y reutilizable con diseño limpio, fondo blanco y fácil implementación.

## Características

✅ **Diseño moderno** - Interfaz limpia con fondo blanco y bordes suaves
✅ **Accesibilidad completa** - Soporte para navegación con teclado y ARIA
✅ **Responsive** - Se adapta a diferentes tamaños de pantalla
✅ **Validación** - Soporte para mensajes de error
✅ **Opciones deshabilitadas** - Control granular de opciones
✅ **Personalizable** - Diferentes tamaños y estilos
✅ **TypeScript** - Completamente tipado

## Uso Básico

```tsx
import { ModernSelect, SelectOption } from '../common/ModernSelect';

const options: SelectOption[] = [
  { value: 'option1', label: 'Opción 1' },
  { value: 'option2', label: 'Opción 2' },
  { value: 'option3', label: 'Opción 3', disabled: true },
];

function MyComponent() {
  const [selectedValue, setSelectedValue] = useState('');

  return (
    <ModernSelect
      options={options}
      value={selectedValue}
      onChange={setSelectedValue}
      placeholder="Selecciona una opción"
      label="Mi Campo"
      required
    />
  );
}
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `options` | `SelectOption[]` | **requerido** | Array de opciones disponibles |
| `value` | `string` | `undefined` | Valor actualmente seleccionado |
| `onChange` | `(value: string) => void` | **requerido** | Callback cuando cambia el valor |
| `placeholder` | `string` | `'Selecciona una opción'` | Texto cuando no hay selección |
| `disabled` | `boolean` | `false` | Deshabilitar el selector |
| `required` | `boolean` | `false` | Campo requerido |
| `error` | `string` | `undefined` | Mensaje de error a mostrar |
| `label` | `string` | `undefined` | Etiqueta del campo |
| `className` | `string` | `''` | Clases CSS adicionales |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño del selector |

## Interface SelectOption

```tsx
interface SelectOption {
  value: string;        // Valor de la opción
  label: string;        // Texto a mostrar
  disabled?: boolean;   // Opción deshabilitada
  className?: string;   // Clases CSS específicas para esta opción
}
```

## Ejemplos de Uso

### 1. Selector con validación

```tsx
<ModernSelect
  options={countryOptions}
  value={selectedCountry}
  onChange={setSelectedCountry}
  label="País de residencia"
  required
  error={!selectedCountry ? 'Este campo es requerido' : ''}
/>
```

### 2. Diferentes tamaños

```tsx
{/* Pequeño */}
<ModernSelect size="sm" options={options} value={value} onChange={setValue} />

{/* Mediano (default) */}
<ModernSelect size="md" options={options} value={value} onChange={setValue} />

{/* Grande */}
<ModernSelect size="lg" options={options} value={value} onChange={setValue} />
```

### 3. Opciones con estilos especiales

```tsx
const ageOptions: SelectOption[] = [
  { value: '18-24', label: '18-24 años' },
  { value: '25-34', label: '25-34 años' },
  { value: '65+', label: '65+ años', className: 'text-red-500' }, // Opción descalificante
];
```

### 4. Integración en Demographics

```tsx
// En DemographicFormUI.tsx
const selectOptions: SelectOption[] = q.options.map((opt: string) => ({
  value: opt,
  label: opt,
  className: q.disqualifyingOptions?.includes(opt) ? 'text-red-500' : undefined
}));

return (
  <ModernSelect
    options={selectOptions}
    value={formValues[q.key] || ''}
    onChange={(value) => onInputChange(q.key, value)}
    label={q.key.charAt(0).toUpperCase() + q.key.slice(1)}
    required={q.required}
    placeholder="Selecciona una opción"
  />
);
```

## Navegación con Teclado

- **Enter/Space**: Abrir/cerrar dropdown o seleccionar opción
- **Arrow Down**: Navegar hacia abajo en las opciones
- **Arrow Up**: Navegar hacia arriba en las opciones  
- **Escape**: Cerrar dropdown
- **Tab**: Navegar entre campos

## Personalización

El componente usa Tailwind CSS. Puedes personalizarlo:

1. **Via className prop**: Añadir clases adicionales al contenedor
2. **Via SelectOption.className**: Estilos específicos por opción
3. **Modificando el componente**: Para cambios más profundos

## Accesibilidad

- ✅ ARIA labels y roles apropiados
- ✅ Navegación completa con teclado
- ✅ Estados de focus visibles
- ✅ Lectores de pantalla compatibles
- ✅ Indicadores de required y error

## Comparación con Select Legacy

| Característica | Select Legacy | ModernSelect |
|---------------|---------------|--------------|
| Diseño | ❌ HTML nativo básico | ✅ Moderno y limpio |
| Accesibilidad | ⚠️ Limitada | ✅ Completa |
| Personalización | ❌ Muy limitada | ✅ Altamente customizable |
| Navegación teclado | ⚠️ Básica | ✅ Avanzada |
| Estados visuales | ❌ Limitados | ✅ Rico feedback visual |
| TypeScript | ❌ No tipado | ✅ Completamente tipado |

## Migración desde Select Legacy

```tsx
// ANTES (Legacy)
<select value={value} onChange={(e) => onChange(e.target.value)}>
  <option value="">Selecciona una opción</option>
  {options.map(opt => (
    <option key={opt} value={opt}>{opt}</option>
  ))}
</select>

// DESPUÉS (ModernSelect)
<ModernSelect
  options={options.map(opt => ({ value: opt, label: opt }))}
  value={value}
  onChange={onChange}
  placeholder="Selecciona una opción"
/>
```

## Estado Actual

✅ **Implementado en**: `DemographicFormUI.tsx`
✅ **Compilación**: Sin errores
✅ **Linting**: Sin errores  
✅ **TypeScript**: Completamente tipado
✅ **Ejemplos**: Disponibles en `ModernSelect.example.tsx`