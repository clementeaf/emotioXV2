import React, { HTMLAttributes } from 'react';

// Componentes de UI comunes
export interface StarRatingProps {
  initialRating?: number;
  maxRating?: number;
  onChange?: (rating: number) => void;
  editable?: boolean;
  value?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  showText?: boolean;
  className?: string;
}

export interface LoadingScreenProps {
  message?: string;
}

export interface ThankYouScreenProps {
  title?: string;
  message: string;
  onComplete?: () => void;
  showButton?: boolean;
  buttonText?: string;
}

// Formularios y campos
export interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export interface TextAreaFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
}

export interface CheckboxGroupProps {
  options: ChoiceOption[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  name: string;
  disabled?: boolean;
  error?: string;
}

// Using the updated consolidated version below

export interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

// Layouts
export interface AppLayoutProps {
  children: React.ReactNode;
}

export interface HeaderProps {
  title?: string;
}

export interface SidebarProps {
  steps: Step[];
  currentStepIndex: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export interface Step {
  id: string;
  name: string;
  completed?: boolean;
  current?: boolean;
}

// Error y estados
export interface ErrorScreenProps {
  error: string;
  onRetry?: () => void;
}

// API y datos
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Participantes y autenticación
export interface ParticipantRegistration {
  researchId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface LoginFormState {
  researchId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface FormErrors {
  [key: string]: string;
}

// Eye tracking
export interface EyeTrackingDataPoint {
  x: number;
  y: number;
  timestamp: number;
  confidence?: number;
}

export interface EyeTrackingTaskProps {
  onComplete: (data: EyeTrackingDataPoint[]) => void;
  duration?: number;
  instructions?: string;
}

// Component Props Interfaces
export interface WelcomeScreenProps {
  onStart: () => void;
  participantId?: string;
}

export interface ErrorDisplayProps {
  error: string;
}

export interface LoadingIndicatorProps {
  size?: 'small' | 'medium' | 'large';
}

// Choice/Option Interfaces - Updated version
export interface ChoiceOption {
  id?: string;
  value: string;
  label: string;
  disabled?: boolean;
}

export interface BasicEmoji {
  emoji: string;
  label: string;
}

// Radio Button Group
export interface RadioButtonGroupProps {
  options: ChoiceOption[];
  selectedValue?: string;
  onChange: (value: string) => void;
  name: string;
}

// API and Response Interfaces
export interface ResponseData {
  [key: string]: any;
  timestamp?: string;
  questionId?: string;
}

export interface StepDefinition {
  stepId: string;
  stepType: string;
  stepName: string;
  stepConfig: any;
}

export interface DemographicDataPayload {
  participantId: string;
  responses: Record<string, any>;
  moduleType: string;
  completedAt: string;
  metadata?: {
    totalTime?: number;
    deviceInfo?: any;
    [key: string]: any;
  };
}

// Logger Interface
export interface Logger {
  info: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  debug: (message: string, data?: any) => void;
}

// Participant/Login Interfaces
export interface Participant {
  id: string;
  name: string;
  email?: string;
  group?: string;
}

export interface LoginFormProps {
  onLogin: (participant: Participant) => void;
  isLoading?: boolean;
  error?: string;
}

// Card Component Interfaces
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  className?: string;
}

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

// API Step Interface
export interface Step {
  id: string;
  type: string;
  name: string;
  config: any;
  order: number;
} 