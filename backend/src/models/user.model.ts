import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  createdAt: number;
  updatedAt: number;
}

export class UserModel {
  private readonly tableName: string;
  private readonly docClient: DynamoDBDocument;

  constructor() {
    this.tableName = process.env.USERS_TABLE || '';
    
    const client = new DynamoDB({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    
    this.docClient = DynamoDBDocument.from(client);
  }

  // Hash password con bcrypt
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  // Verificar contraseña con bcrypt
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async create(name: string, email: string, password: string): Promise<User> {
    // Primero verificar si existe un usuario con ese email
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const now = Date.now();
    const id = uuidv4();
    const hashedPassword = await this.hashPassword(password);

    const user: User = {
      id,
      name,
      email,
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
    return userWithoutPassword as User;
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.docClient.get({
      TableName: this.tableName,
      Key: { id }
    });

    if (!result.Item) {
      return null;
    }

    return result.Item as User;
  }

  async findByEmail(email: string): Promise<User | null> {
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

    return result.Items[0] as User;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
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
    const { password: _, ...userWithoutPassword } = result.Attributes as User;
    return userWithoutPassword as User;
  }

  async delete(id: string): Promise<void> {
    await this.docClient.delete({
      TableName: this.tableName,
      Key: { id }
    });
  }
}

// Singleton para reutilizar en toda la aplicación
export const userModel = new UserModel(); 