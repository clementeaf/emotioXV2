import React from 'react';
import { FormCard } from '@/components/common/FormCard';
import { FormToggle } from '@/components/common/FormToggle';
import { FormInput } from '@/components/common/FormInput';
import { FormTextarea } from '@/components/common/FormTextarea';
import { ActionButton } from '@/components/common/ActionButton';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { OptimisticFormWrapper } from '@/components/common/OptimisticFormWrapper';
import { OptimisticButton } from '@/components/common/OptimisticButton';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ConfigCard } from '@/components/common/ConfigCard';
import { DevModeInfo } from '@/components/common/DevModeInfo';
import { ProgressiveLoader } from '@/components/common/ProgressiveLoader';
import { SimulatedDataBanner } from '@/components/common/SimulatedDataBanner';

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
    children: (formData: any, handlers: ComponentHandlers) => (
      <div className="space-y-6">
        <FormToggle
          label="Habilitar funcionalidad"
          description="Esta funcionalidad está habilitada y se mostrará en la aplicación"
          checked={formData.isEnabled}
          onChange={(checked) => handlers.handleChange('isEnabled', checked)}
        />
        <FormInput
          label="Título"
          value={formData.title}
          onChange={(value) => handlers.handleChange('title', value)}
          placeholder="Ingresa el título"
        />
        <FormTextarea
          label="Mensaje"
          value={formData.message}
          onChange={(value) => handlers.handleChange('message', value)}
          placeholder="Ingresa el mensaje"
          rows={4}
        />
        <FormInput
          label="Texto del botón"
          value={formData.buttonText}
          onChange={(value) => handlers.handleChange('buttonText', value)}
          placeholder="Ingresa el texto del botón"
        />
      </div>
    )
  },
  ActionButton: {
    title: "ActionButton - Variantes",
    props: {},
    children: (formData: any, handlers: ComponentHandlers) => (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <ActionButton variant="primary" onClick={handlers.handleSubmit}>
            Primary (Negro)
          </ActionButton>
          <ActionButton variant="secondary" onClick={handlers.handlePreview}>
            Secondary (Blanco)
          </ActionButton>
          <ActionButton variant="danger" onClick={handlers.handleDelete} icon="🗑️">
            Danger (Rojo)
          </ActionButton>
          <ActionButton variant="success" onClick={() => console.log('Success')}>
            Success (Verde)
          </ActionButton>
        </div>
        <div className="flex flex-wrap gap-4">
          <ActionButton variant="primary" onClick={handlers.handleSubmit}>
            Normal
          </ActionButton>
          <ActionButton variant="primary" onClick={handlers.handleSubmit} loading>
            Loading
          </ActionButton>
          <ActionButton variant="primary" onClick={handlers.handleSubmit} disabled>
            Disabled
          </ActionButton>
        </div>
      </div>
    )
  },
  LoadingSkeleton: {
    title: "LoadingSkeleton - Tipos",
    props: {},
    children: () => (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Form Skeleton</h3>
          <LoadingSkeleton type="form" count={3} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Card Skeleton</h3>
          <LoadingSkeleton type="card" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Dashboard Skeleton</h3>
          <LoadingSkeleton type="dashboard" />
        </div>
      </div>
    )
  },
  OptimisticFormWrapper: {
    title: "OptimisticFormWrapper - Formulario Optimista",
    props: {},
    children: (formData: any, handlers: ComponentHandlers) => (
      <OptimisticFormWrapper
        onSubmit={async () => handlers.handleSubmit()}
        submitButtonText="Guardar con Optimismo"
        loadingText="Guardando..."
        successText="✓ Guardado"
        skeletonType="form"
        skeletonCount={4}
      >
        <div className="space-y-4">
          <FormInput
            label="Campo 1"
            value=""
            onChange={() => {}}
            placeholder="Campo de prueba"
          />
          <FormTextarea
            label="Campo 2"
            value=""
            onChange={() => {}}
            placeholder="Textarea de prueba"
          />
        </div>
      </OptimisticFormWrapper>
    )
  },
  OptimisticButton: {
    title: "OptimisticButton - Botón Optimista",
    props: {},
    children: (formData: any, handlers: ComponentHandlers) => (
      <div className="space-y-4">
        <OptimisticButton onClick={handlers.handleSubmit}>
          Botón Optimista
        </OptimisticButton>
        <OptimisticButton onClick={handlers.handleSubmit} variant="danger">
          Botón Danger
        </OptimisticButton>
        <OptimisticButton onClick={handlers.handleSubmit} variant="success">
          Botón Success
        </OptimisticButton>
      </div>
    )
  },
  ConfigCard: {
    title: "ConfigCard - Card de Configuración",
    props: {},
    children: () => (
      <ConfigCard>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Ejemplo ConfigCard</h3>
          <p className="text-gray-600">Descripción del card</p>
          <p className="mt-4">Contenido del ConfigCard</p>
        </div>
      </ConfigCard>
    )
  },
  DevModeInfo: {
    title: "DevModeInfo - Información de Desarrollo",
    props: {},
    children: () => <DevModeInfo />
  },
  ErrorBoundary: {
    title: "ErrorBoundary - Manejo de Errores",
    props: {},
    children: () => (
      <>
        <p className="text-gray-600 mb-4">ErrorBoundary se muestra cuando hay errores en componentes hijos.</p>
        <ErrorBoundary>
          <div>
            <p>Contenido protegido por ErrorBoundary</p>
          </div>
        </ErrorBoundary>
      </>
    )
  },
  ProgressiveLoader: {
    title: "ProgressiveLoader - Loader Progresivo",
    props: {},
    children: () => (
      <ProgressiveLoader isLoading={false}>
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Contenido Cargado</h3>
          <p className="text-green-600">Este contenido se muestra cuando isLoading es false</p>
        </div>
      </ProgressiveLoader>
    )
  },
  SimulatedDataBanner: {
    title: "SimulatedDataBanner - Banner de Datos Simulados",
    props: {},
    children: () => <SimulatedDataBanner />
  },
  FormToggle: {
    title: "FormToggle - Switch/Toggle",
    props: {},
    children: (formData: any, handlers: ComponentHandlers) => (
      <div className="space-y-4">
        <FormToggle
          label="Habilitar funcionalidad"
          description="Esta funcionalidad está habilitada y se mostrará en la aplicación"
          checked={formData.isEnabled}
          onChange={(checked) => handlers.handleChange('isEnabled', checked)}
        />
        <FormToggle
          label="Segunda opción"
          description="Esta es una segunda opción de toggle"
          checked={false}
          onChange={() => {}}
        />
      </div>
    )
  },
  FormInput: {
    title: "FormInput - Campo de Texto",
    props: {},
    children: (formData: any, handlers: ComponentHandlers) => (
      <div className="space-y-4">
        <FormInput
          label="Título"
          value={formData.title}
          onChange={(value) => handlers.handleChange('title', value)}
          placeholder="Ingresa el título"
        />
        <FormInput
          label="Campo de prueba"
          value=""
          onChange={() => {}}
          placeholder="Campo de ejemplo"
        />
      </div>
    )
  },
  FormTextarea: {
    title: "FormTextarea - Área de Texto",
    props: {},
    children: (formData: any, handlers: ComponentHandlers) => (
      <div className="space-y-4">
        <FormTextarea
          label="Mensaje"
          value={formData.message}
          onChange={(value) => handlers.handleChange('message', value)}
          placeholder="Ingresa el mensaje"
          rows={4}
        />
        <FormTextarea
          label="Descripción"
          value=""
          onChange={() => {}}
          placeholder="Campo de descripción"
          rows={3}
        />
      </div>
    )
  }
} as const;