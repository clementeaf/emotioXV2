import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { IUser } from '../types/user';
import { IUserRepository } from '../types/repository';
import { PaginatedResult, PaginationOptions } from '../types/common';

/**
 * Implementación del repositorio de usuarios utilizando DynamoDB
 */
export class UserRepository implements IUserRepository<IUser> {
  private readonly tableName: string;
  private readonly docClient: DynamoDBDocument;

  constructor() {
    this.tableName = process.env.USERS_TABLE || '';
    
    const client = new DynamoDB({
      region: process.env.REGION || 'us-east-1',
    });
    
    this.docClient = DynamoDBDocument.from(client);
  }

  /**
   * Hash password con bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Verificar contraseña con bcrypt
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Crear un nuevo usuario
   */
  async create(userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    // Primero verificar si existe un usuario con ese email
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const now = Date.now();
    const id = uuidv4();
    const hashedPassword = await this.hashPassword(userData.password as string);

    const user: IUser = {
      id,
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now
    };

    await this.docClient.put({
      TableName: this.tableName,
      Item: user
    });

    // No devolver la contraseña
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as IUser;
  }

  /**
   * Buscar usuario por ID
   */
  async findById(id: string): Promise<IUser | null> {
    const result = await this.docClient.get({
      TableName: this.tableName,
      Key: { id }
    });

    if (!result.Item) {
      return null;
    }

    return result.Item as IUser;
  }

  /**
   * Buscar usuario por email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    const result = await this.docClient.query({
      TableName: this.tableName,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    });

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return result.Items[0] as IUser;
  }

  /**
   * Buscar todos los usuarios con paginación
   */
  async findAll(options?: PaginationOptions): Promise<PaginatedResult<IUser>> {
    const limit = options?.limit || 50;
    const params: any = {
      TableName: this.tableName,
      Limit: limit
    };

    // Si hay un token de siguiente página, usarlo
    if (options?.nextToken) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(options.nextToken, 'base64').toString());
    }

    const result = await this.docClient.scan(params);
    
    // Preparar token para la siguiente página si hay más resultados
    let nextToken: string | undefined;
    if (result.LastEvaluatedKey) {
      nextToken = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
    }

    // Filtrar contraseñas de los resultados
    const items = (result.Items || []).map(item => {
      const { password, ...userWithoutPassword } = item as IUser;
      return userWithoutPassword as IUser;
    });

    return {
      items,
      nextToken,
      count: items.length
    };
  }

  /**
   * Actualizar usuario
   */
  async update(id: string, data: Partial<IUser>): Promise<IUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Construir expresiones de actualización dinámicamente
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Actualizar solo los campos proporcionados
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'email' && key !== 'password' && key !== 'createdAt') {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    // Siempre actualizar updatedAt
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = Date.now();

    // Si hay una nueva contraseña, hashearla
    if (data.password) {
      updateExpressions.push('#password = :password');
      expressionAttributeNames['#password'] = 'password';
      expressionAttributeValues[':password'] = await this.hashPassword(data.password);
    }

    const updateExpression = `SET ${updateExpressions.join(', ')}`;

    const result = await this.docClient.update({
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    if (!result.Attributes) {
      throw new Error('Failed to update user');
    }

    // No devolver la contraseña
    const { password: _, ...userWithoutPassword } = result.Attributes as IUser;
    return userWithoutPassword as IUser;
  }

  /**
   * Eliminar usuario
   */
  async delete(id: string): Promise<void> {
    await this.docClient.delete({
      TableName: this.tableName,
      Key: { id }
    });
  }
}

// Singleton para reutilizar en toda la aplicación
export const userRepository = new UserRepository(); 