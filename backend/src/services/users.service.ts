import { userRepository } from '../models/user.model';
import { IUser, CreateUserDto, UpdateUserDto } from '../types/user';
import { PaginatedResult, PaginationOptions } from '../types/common';

export class UsersService {
  async createUser(userData: CreateUserDto): Promise<Omit<IUser, 'password'>> {
    return userRepository.create(userData);
  }

  async getUser(id: string): Promise<IUser | null> {
    return userRepository.findById(id);
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return userRepository.findByEmail(email);
  }

  async getAllUsers(options?: PaginationOptions): Promise<PaginatedResult<IUser>> {
    return userRepository.findAll(options);
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<IUser> {
    return userRepository.update(id, data);
  }

  async deleteUser(id: string): Promise<void> {
    return userRepository.delete(id);
  }
}

export const usersService = new UsersService(); 