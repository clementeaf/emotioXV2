import { ReactNode } from "react";
import { ExpandedStep } from '../../types/flow';

export interface AppLayoutProps {
  children: ReactNode;
}

export interface HeaderProps {
  openMobileSidebar: () => void;
}

export interface Step {
  id: string;
  name: string;
}

export interface ProgressSidebarProps {
  steps: ExpandedStep[];
  currentStepIndex: number;
  onNavigateToStep?: (index: number) => void;
}