import { ReactNode } from "react";

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
  steps: Step[];
  currentStepIndex: number;
  onNavigateToStep?: (index: number) => void;
}