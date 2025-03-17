import { UserModel, User } from '../models/user.model';
import * as jwt from 'jsonwebtoken';

export class UserService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly TOKEN_EXPIRY = '24h';
  private userModel: UserModel;

  constructor() {
    this.userModel = new UserModel();
  }

  /**
   * Crea un nuevo usuario
   */
  async createUser(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const existingUser = await this.userModel.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = await this.userModel.create(name, email, password);
    return this.generateToken(user);
  }

  /**
   * Autentica un usuario con email y contraseña
   */
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const user = await this.userModel.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Verificar si el usuario tiene contraseña
    if (!user.password) {
      throw new Error('Invalid credentials');
    }

    // Verificar la contraseña
    const isValidPassword = await this.userModel.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    return this.generateToken(user);
  }

  /**
   * Obtiene un usuario por su email
   */
  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userModel.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Actualiza el nombre de un usuario
   */
  async updateUserName(email: string, name: string): Promise<User> {
    const existingUser = await this.userModel.findByEmail(email);
    if (!existingUser) {
      throw new Error('User not found');
    }

    return await this.userModel.update(existingUser.id, { name });
  }

  /**
   * Elimina un usuario
   */
  async deleteUser(email: string): Promise<void> {
    const existingUser = await this.userModel.findByEmail(email);
    if (!existingUser) {
      throw new Error('User not found');
    }

    await this.userModel.delete(email);
  }

  /**
   * Genera un token JWT para un usuario
   */
  private generateToken(user: User): { token: string; user: User } {
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        name: user.name
      },
      this.JWT_SECRET,
      { expiresIn: this.TOKEN_EXPIRY }
    );

    // No devolver el campo password
    const { password, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword as User };
  }
}

// Exportar una instancia del servicio
export const userService = new UserService(); 