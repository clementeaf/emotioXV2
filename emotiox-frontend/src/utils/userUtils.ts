/**
 * User utilities for authentication and user data management
 */

export interface User {
  name: string;
  initials: string;
  avatar?: string;
}

/**
 * Get user data from localStorage or sessionStorage
 * @returns User object or null if not found
 */
export const getUserFromStorage = (): User | null => {
  const storedUser = localStorage.getItem('user') ?? sessionStorage.getItem('user');
  
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  
  return null;
};

/**
 * Save user data to localStorage
 * @param user User object to save
 */
export const saveUserToStorage = (user: User): void => {
  try {
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

/**
 * Clear user data from storage
 */
export const clearUserFromStorage = (): void => {
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
};

/**
 * Get user initials from user object
 * @param user User object
 * @returns User initials
 */
export const getUserInitials = (user: User | null): string => {
  if (!user?.name) return 'U';
  return user.name.charAt(0).toUpperCase();
};

/**
 * Get user name with fallback
 * @param user User object
 * @returns User name or 'Usuario' as fallback
 */
export const getUserName = (user: User | null): string => {
  return user?.name || 'Usuario';
};
