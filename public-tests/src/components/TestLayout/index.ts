// Componentes principales del layout
export { default as NavigationFlowTask } from './NavigationFlowTask';
export { default as PreferenceTestTask } from './PreferenceTestTask';
export { default as TestLayoutSidebarContainer } from './sidebar/TestLayoutSidebarContainer';
export { default as TestLayoutFooter } from './TestLayoutFooter';
export { default as TestLayoutHeader } from './TestLayoutHeader';
export { default as TestLayoutMain } from './TestLayoutMain';
export { default as TestLayoutRenderer } from './TestLayoutRenderer';
export { default as TestLayoutSidebar } from './TestLayoutSidebar';

// Re-exportar componentes del sidebar refactorizado
export * from './sidebar';
