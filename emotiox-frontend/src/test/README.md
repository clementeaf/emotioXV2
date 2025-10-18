# 🧪 Testing Framework - EmotioX Frontend

## 📋 **DESCRIPCIÓN**

Sistema completo de testing implementado con **Vitest** + **React Testing Library** para garantizar la calidad y confiabilidad del código.

## 🚀 **CARACTERÍSTICAS IMPLEMENTADAS**

### ✅ **Framework de Testing:**
- **Vitest** - Testing framework moderno y rápido
- **React Testing Library** - Testing de componentes React
- **Jest DOM** - Matchers adicionales para DOM
- **User Event** - Simulación de interacciones de usuario
- **Coverage** - Análisis de cobertura de código

### ✅ **Configuración Avanzada:**
- **Setup automático** con mocks globales
- **Aliases de importación** configurados
- **Coverage thresholds** establecidos (80%)
- **Environment mocks** (localStorage, sessionStorage, etc.)

### ✅ **Utilidades Personalizadas:**
- **Custom render** con providers automáticos
- **Mock factories** para datos de prueba
- **Custom matchers** para assertions mejoradas
- **Test utilities** reutilizables

## 🎯 **SCRIPTS DISPONIBLES**

```bash
# Ejecutar tests en modo watch
npm run test

# Ejecutar tests una vez
npm run test:run

# Ejecutar tests con UI
npm run test:ui

# Ejecutar tests con coverage
npm run test:coverage

# Ejecutar tests en modo watch
npm run test:watch
```

## 📁 **ESTRUCTURA DE TESTING**

```
src/test/
├── setup.ts              # Configuración global de tests
├── utils.tsx             # Utilidades de testing personalizadas
├── index.ts              # Exportaciones centralizadas
└── README.md             # Documentación

src/components/__tests__/
├── Button.test.tsx       # Tests del componente Button
├── Input.test.tsx        # Tests del componente Input
└── ...

src/pages/__tests__/
├── Login.test.tsx        # Tests de la página Login
└── ...

src/stores/__tests__/
├── authStore.test.ts     # Tests del store de autenticación
└── ...
```

## 🔧 **CONFIGURACIÓN**

### **vitest.config.ts:**
- Environment: jsdom
- Setup files automáticos
- Coverage con v8 provider
- Aliases de importación
- Thresholds de cobertura

### **setup.ts:**
- Mocks globales (localStorage, sessionStorage)
- Cleanup automático
- Console mocking
- Browser APIs mocking

## 🧩 **UTILIDADES DISPONIBLES**

### **Custom Render:**
```typescript
import { render, screen } from '../test/utils';

// Render automático con providers
render(<MyComponent />);
```

### **Mock Factories:**
```typescript
import { createMockUser, mockApiResponse } from '../test/utils';

const user = createMockUser();
const response = mockApiResponse(data);
```

### **Custom Matchers:**
```typescript
import { expectToBeInTheDocument } from '../test/utils';

expectToBeInTheDocument(element);
```

## 📊 **COVERAGE ACTUAL**

- **Statements:** 8.45%
- **Branches:** 53.62%
- **Functions:** 44.15%
- **Lines:** 8.45%

### **Componentes con 100% Coverage:**
- ✅ Button.tsx
- ✅ Input.tsx
- ✅ Card.tsx
- ✅ authStore.ts

## 🎯 **BEST PRACTICES**

### **1. Naming Convention:**
- Archivos: `ComponentName.test.tsx`
- Tests: `describe('Component Name', () => {})`
- Cases: `it('should do something', () => {})`

### **2. Test Structure:**
```typescript
describe('Component Name', () => {
  it('renders correctly', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### **3. Mocking:**
- Mock external dependencies
- Use factories for test data
- Clean up after each test

### **4. Assertions:**
- Test behavior, not implementation
- Use accessible queries
- Test user interactions

## 🚀 **PRÓXIMOS PASOS**

### **Alta Prioridad:**
1. **Aumentar coverage** a 80%+
2. **Tests de integración** para rutas
3. **Tests E2E** con Playwright

### **Media Prioridad:**
4. **Visual regression testing**
5. **Performance testing**
6. **Accessibility testing**

## 📚 **RECURSOS**

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [User Event](https://testing-library.com/docs/user-event/intro/)

---

**¡Sistema de testing completamente funcional y listo para desarrollo!** 🚀
