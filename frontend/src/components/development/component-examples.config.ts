import React from 'react';

// Tipos para los handlers
export interface ComponentHandlers {
  handleChange: (field: string, value: any) => void;
  handleSubmit: () => void;
  handlePreview: () => void;
  handleDelete: () => void;
}

// Tipo para la configuración de ejemplos
export interface ComponentExampleConfig {
  title: string;
  props: Record<string, any>;
  children: (formData: any, handlers: ComponentHandlers) => React.ReactNode;
}

// Configuración de ejemplos para cada componente
export const COMPONENT_EXAMPLES: Record<string, ComponentExampleConfig> = {
  FormCard: {
    title: "FormCard - Contenedor de Formulario",
    props: { title: "FormCard - Contenedor de Formulario" },
    children: (formData: any, handlers: ComponentHandlers) => React.createElement('div', { className: "space-y-6" },
      React.createElement('p', null, "FormCard example with form controls"),
      React.createElement('p', null, `Title: ${formData.title}`),
      React.createElement('p', null, `Enabled: ${formData.isEnabled}`)
    )
  },
  ActionButton: {
    title: "ActionButton - Variantes",
    props: {},
    children: (formData: any, handlers: ComponentHandlers) => React.createElement('div', { className: "space-y-4" },
      React.createElement('p', null, "ActionButton variants example"),
      React.createElement('p', null, "Primary, Secondary, Danger, Success buttons")
    )
  },
  LoadingSkeleton: {
    title: "LoadingSkeleton - Tipos",
    props: {},
    children: () => React.createElement('div', { className: "space-y-6" },
      React.createElement('p', null, "LoadingSkeleton types example"),
      React.createElement('p', null, "Form, Card, Dashboard skeletons")
    )
  },
  OptimisticFormWrapper: {
    title: "OptimisticFormWrapper - Formulario Optimista",
    props: {},
    children: (formData: any, handlers: ComponentHandlers) => React.createElement('div', { className: "space-y-4" },
      React.createElement('p', null, "OptimisticFormWrapper example"),
      React.createElement('p', null, "Form with optimistic updates")
    )
  },
  OptimisticButton: {
    title: "OptimisticButton - Botón Optimista",
    props: {},
    children: (formData: any, handlers: ComponentHandlers) => React.createElement('div', { className: "space-y-4" },
      React.createElement('p', null, "OptimisticButton example"),
      React.createElement('p', null, "Button with optimistic feedback")
    )
  },
  ConfigCard: {
    title: "ConfigCard - Card de Configuración",
    props: {},
    children: () => React.createElement('div', { className: "p-4 bg-gray-50 rounded-lg" },
      React.createElement('h3', { className: "text-lg font-semibold mb-2" }, "Ejemplo ConfigCard"),
      React.createElement('p', { className: "text-gray-600" }, "Descripción del card"),
      React.createElement('p', { className: "mt-4" }, "Contenido del ConfigCard")
    )
  },
  DevModeInfo: {
    title: "DevModeInfo - Información de Desarrollo",
    props: {},
    children: () => React.createElement('div', null,
      React.createElement('p', null, "DevModeInfo component example")
    )
  },
  ErrorBoundary: {
    title: "ErrorBoundary - Manejo de Errores",
    props: {},
    children: () => React.createElement('div', null,
      React.createElement('p', { className: "text-gray-600 mb-4" }, "ErrorBoundary se muestra cuando hay errores en componentes hijos."),
      React.createElement('p', null, "Contenido protegido por ErrorBoundary")
    )
  },
  ProgressiveLoader: {
    title: "ProgressiveLoader - Loader Progresivo",
    props: {},
    children: () => React.createElement('div', { className: "p-4 bg-green-50 rounded-lg" },
      React.createElement('h3', { className: "text-lg font-semibold text-green-800" }, "Contenido Cargado"),
      React.createElement('p', { className: "text-green-600" }, "Este contenido se muestra cuando isLoading es false")
    )
  },
  SimulatedDataBanner: {
    title: "SimulatedDataBanner - Banner de Datos Simulados",
    props: {},
    children: () => React.createElement('div', null,
      React.createElement('p', null, "SimulatedDataBanner component example")
    )
  }
} as const;