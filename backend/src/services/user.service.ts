import { userModel, User } from '../models/user.model';
import { otpModel } from '../models/otp.model';
import { sign } from 'jsonwebtoken';

export class UserService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly TOKEN_EXPIRY = '24h';

  /**
   * Crea un nuevo usuario
   */
  async createUser(name: string, email: string): Promise<User> {
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    return await userModel.create(name, email);
  }

  /**
   * Obtiene un usuario por su email
   */
  async getUserByEmail(email: string): Promise<User> {
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Actualiza el nombre de un usuario
   */
  async updateUserName(email: string, name: string): Promise<User> {
    const existingUser = await userModel.findByEmail(email);
    if (!existingUser) {
      throw new Error('User not found');
    }

    return await userModel.update(email, name);
  }

  /**
   * Elimina un usuario
   */
  async deleteUser(email: string): Promise<void> {
    const existingUser = await userModel.findByEmail(email);
    if (!existingUser) {
      throw new Error('User not found');
    }

    await userModel.delete(email);
  }

  /**
   * Solicita un código OTP para iniciar sesión
   */
  async requestOTP(email: string): Promise<void> {
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    await otpModel.createOTP(email);
  }

  /**
   * Valida el código OTP y genera un token de acceso
   */
  async validateOTP(email: string, code: string): Promise<{ token: string; user: User }> {
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await otpModel.validateOTP(email, code);
    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }

    // Generar token JWT
    const token = sign(
      { 
        id: user.id,
        email: user.email,
        name: user.name
      },
      this.JWT_SECRET,
      { expiresIn: this.TOKEN_EXPIRY }
    );

    return { token, user };
  }
}

// Exportar una instancia del servicio
export const userService = new UserService(); 