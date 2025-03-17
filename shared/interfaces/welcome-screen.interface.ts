/**
 * Interface for Welcome Screen configuration in research projects
 */
export interface WelcomeScreenConfig {
  /**
   * Whether the welcome screen is enabled for the research
   */
  isEnabled: boolean;

  /**
   * Title to be displayed on the welcome screen
   */
  title: string;

  /**
   * Main message/description to be shown to participants
   */
  message: string;

  /**
   * Text to be displayed on the start button
   */
  startButtonText: string;

  /**
   * Optional metadata
   */
  metadata?: {
    /**
     * Last time the configuration was updated
     */
    lastUpdated?: Date;

    /**
     * Version of the configuration
     */
    version?: string;

    /**
     * User who last modified the configuration
     */
    lastModifiedBy?: string;
  };
}

/**
 * Interface for Welcome Screen form validation
 */
export interface WelcomeScreenValidation {
  title: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
  message: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
  startButtonText: {
    minLength: number;
    maxLength: number;
    required: boolean;
  };
}

/**
 * Default validation rules for Welcome Screen
 */
export const DEFAULT_WELCOME_SCREEN_VALIDATION: WelcomeScreenValidation = {
  title: {
    minLength: 3,
    maxLength: 100,
    required: true
  },
  message: {
    minLength: 10,
    maxLength: 1000,
    required: true
  },
  startButtonText: {
    minLength: 2,
    maxLength: 50,
    required: true
  }
};

/**
 * Default Welcome Screen configuration
 */
export const DEFAULT_WELCOME_SCREEN_CONFIG: WelcomeScreenConfig = {
  isEnabled: true,
  title: '',
  message: '',
  startButtonText: 'Start Research',
  metadata: {
    version: '1.0.0'
  }
};

/**
 * Interface for Welcome Screen DynamoDB record
 */
export interface WelcomeScreenRecord extends WelcomeScreenConfig {
  /**
   * Research ID this welcome screen belongs to
   */
  researchId: string;

  /**
   * Unique identifier for the welcome screen configuration
   */
  id: string;

  /**
   * Timestamp when the record was created
   */
  createdAt: Date;

  /**
   * Timestamp when the record was last updated
   */
  updatedAt: Date;
}

/**
 * Type for Welcome Screen form submission
 */
export type WelcomeScreenFormData = Omit<WelcomeScreenConfig, 'metadata'>;

/**
 * Interface for Welcome Screen update operations
 */
export interface WelcomeScreenUpdate {
  researchId: string;
  updates: Partial<WelcomeScreenFormData>;
} 