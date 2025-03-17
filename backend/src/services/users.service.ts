import { userModel, User } from '../models/user.model';

export interface UserUpdateData {
  name?: string;
  password?: string;
}

export class UsersService {
  /**
   * Obtiene un usuario por su ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const user = await userModel.findById(userId);
    
    if (!user) {
      return null;
    }

    // No devolver la contraseña
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Actualiza un usuario
   */
  async updateUser(userId: string, data: UserUpdateData): Promise<User> {
    return userModel.update(userId, data);
  }

  /**
   * Elimina un usuario
   */
  async deleteUser(userId: string): Promise<void> {
    await userModel.delete(userId);
  }
}

// Singleton para reutilizar en toda la aplicación
export const usersService = new UsersService(); 