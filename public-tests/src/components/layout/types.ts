import { ReactNode } from "react";

export interface AppLayoutProps {
  children: ReactNode;
}

export interface HeaderProps {
  openMobileSidebar: () => void;
}