interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

class ConditionalLogger implements Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
  
  info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }
  
  warn(message: string, ...args: unknown[]): void {
    // Warnings are always shown
    console.warn(`[WARN] ${message}`, ...args);
  }
  
  error(message: string, ...args: unknown[]): void {
    // Errors are always shown
    console.error(`[ERROR] ${message}`, ...args);
  }
}

class SilentLogger implements Logger {
  debug(): void { /* silent */ }
  info(): void { /* silent */ }
  warn(): void { /* silent */ }
  error(message: string, ...args: unknown[]): void {
    // Only errors in production
    console.error(`[ERROR] ${message}`, ...args);
  }
}

// Export the appropriate logger based on environment
export const logger: Logger = process.env.NODE_ENV === 'development' 
  ? new ConditionalLogger() 
  : new SilentLogger();

// Utility function to create component-specific loggers
export const createComponentLogger = (componentName: string): Logger => ({
  debug: (message: string, ...args: unknown[]) => 
    logger.debug(`[${componentName}] ${message}`, ...args),
  info: (message: string, ...args: unknown[]) => 
    logger.info(`[${componentName}] ${message}`, ...args),
  warn: (message: string, ...args: unknown[]) => 
    logger.warn(`[${componentName}] ${message}`, ...args),
  error: (message: string, ...args: unknown[]) => 
    logger.error(`[${componentName}] ${message}`, ...args),
}); 