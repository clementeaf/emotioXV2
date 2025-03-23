import { userRepository } from '../models/user.model';
import { IUser, UpdateUserDto } from '../types/user';
import { IUserService } from '../types/service';
import { PaginatedResult, PaginationOptions } from '../types/common';
import * as jwt from 'jsonwebtoken';

/**
 * Servicio de usuario para operaciones relacionadas con usuarios
 */
export class UserService implements IUserService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly TOKEN_EXPIRY = '24h';

  /**
   * Obtener un usuario por ID
   */
  async getUser(id: string): Promise<IUser> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    // No devolver la contraseña
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as IUser;
  }

  /**
   * Obtener un usuario por email
   */
  async getUserByEmail(email: string): Promise<IUser> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    
    // No devolver la contraseña
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as IUser;
  }

  /**
   * Obtener todos los usuarios
   */
  async getAllUsers(options?: PaginationOptions): Promise<PaginatedResult<IUser>> {
    return userRepository.findAll(options);
  }

  /**
   * Actualizar un usuario
   */
  async updateUser(id: string, data: UpdateUserDto): Promise<IUser> {
    return userRepository.update(id, data);
  }

  /**
   * Eliminar un usuario
   */
  async deleteUser(id: string): Promise<void> {
    return userRepository.delete(id);
  }

  /**
   * Crea un nuevo usuario
   */
  async createUser(userData: { name: string, email: string, password: string }): Promise<{ token: string; user: IUser }> {
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = await userRepository.create(userData);
    return this.generateToken(user);
  }

  /**
   * Autentica un usuario con email y contraseña
   */
  async login(email: string, password: string): Promise<{ token: string; user: IUser }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Verificar la contraseña
    const isValidPassword = await userRepository.comparePassword(password, user.password || '');
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    return this.generateToken(user);
  }

  /**
   * Actualiza el nombre de un usuario
   */
  async updateUserName(email: string, name: string): Promise<IUser> {
    const existingUser = await userRepository.findByEmail(email);
    if (!existingUser) {
      throw new Error('User not found');
    }

    return await userRepository.update(existingUser.id, { name });
  }

  /**
   * Genera un token JWT para un usuario
   */
  generateToken(user: IUser): { token: string; user: IUser } {
    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      this.JWT_SECRET,
      { expiresIn: this.TOKEN_EXPIRY }
    );

    // No devolver el campo password
    const { password, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword as IUser };
  }
}

// Exportar una instancia del servicio para reutilizar
export const userService = new UserService(); 