# 🔗 ResearchLinks - Enlaces de Retorno

Una aplicación simple para gestionar enlaces de retorno para diferentes tipos de entrevistas en EmotioXV2.

## 🚀 Características

- **3 módulos simples** para diferentes estados de entrevistas
- **Navegación con React Router** entre páginas
- **Diseño responsive** y minimalista
- **Colores diferenciados** por tipo de entrevista

## 🛠️ Tecnologías

- **React 19** con TypeScript
- **Vite** para build y desarrollo
- **React Router** para navegación
- **Tailwind CSS** para estilos

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 🎯 Módulos Disponibles

### 1. Entrevistas Completadas (`/completed`)
- **Color:** Verde
- **Propósito:** Participantes que completaron exitosamente
- **Mensaje:** Confirmación de participación

### 2. Entrevistas Descalificadas (`/disqualified`)
- **Color:** Rojo
- **Propósito:** Participantes que no cumplen criterios
- **Mensaje:** Información sobre descalificación

### 3. Entrevistas Excedidas (`/exceeded`)
- **Color:** Amarillo
- **Propósito:** Participantes que excedieron tiempo límite
- **Mensaje:** Información sobre tiempo excedido

## 🎨 Estructura

```
src/
├── App.tsx              # Componente principal con rutas
├── pages/
│   ├── CompletedPage.tsx    # Página para completadas
│   ├── DisqualifiedPage.tsx # Página para descalificadas
│   └── ExceededPage.tsx     # Página para excedidas
└── index.css            # Estilos con Tailwind
```

## 🔧 Configuración

El proyecto está configurado con:

- TypeScript estricto
- React Router para navegación
- Tailwind CSS para estilos
- Vite para build optimizado

## 📱 Responsive

La aplicación es completamente responsive:

- **Mobile:** 1 columna
- **Desktop:** 3 columnas

## 🚀 Deploy

Para hacer deploy:

```bash
npm run build
```

Los archivos generados están en `dist/` y listos para deploy en cualquier hosting estático.

## 🔗 URLs de Ejemplo

- **Home:** `/`
- **Completadas:** `/completed`
- **Descalificadas:** `/disqualified`
- **Excedidas:** `/exceeded`

## 📊 Uso

Los participantes serán dirigidos automáticamente a estos módulos según su estado en la investigación:

1. **Completadas:** Participantes que terminaron exitosamente
2. **Descalificadas:** Participantes que no cumplen criterios
3. **Excedidas:** Participantes que superaron el tiempo límite

## 🎯 Propósito

Esta aplicación sirve como punto de retorno para participantes de investigaciones de EmotioXV2, proporcionando información clara sobre su estado y participación.
