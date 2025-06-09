import React, { HTMLAttributes, ButtonHTMLAttributes } from 'react';

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
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string | null;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
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
  openMobileSidebar: () => void;
}

export interface SidebarProps {
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
}

export interface ProgressSidebarProps {
  steps: any[]; // ExpandedStep desde flow.types
  currentStepIndex: number;
  onNavigateToStep?: (index: number) => void;
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
  timestamp: number;
  x: number;
  y: number;
  fixation: boolean;
  duration: number;
}

export interface EyeTrackingTaskProps {
  question: any; // ExpandedStep type
  onComplete: (data: unknown) => void;
  isAnswered?: boolean;
}

// Component Props Interfaces
export interface WelcomeScreenProps {
  title: string;
  message: string;
  onContinue: () => void;
}

export interface ErrorDisplayProps {
  title?: string;
  message: string | null;
}

export interface LoadingIndicatorProps {
  message?: string;
}

// Choice/Option Interfaces - Updated version
export interface ChoiceOption {
  id: string;
  value?: string;
  label: string;
  disabled?: boolean;
}

export interface BasicEmoji {
  emoji: string;
  label: string;
}

// Radio Button Group
export interface RadioButtonGroupProps {
  name: string;
  options: ChoiceOption[];
  selectedValue: string | undefined;
  onChange: (selectedId: string) => void;
  disabled?: boolean;
  className?: string;
  optionClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
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
  onLoginSuccess: (participant: Participant) => void;
  researchId?: string;
}

// Card Component Interfaces
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

// Button Component Interface
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

// API Step Interface
export interface Step {
  id: string;
  type: string;
  name: string;
  config: any;
  order: number;
} 