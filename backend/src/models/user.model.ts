import { DynamoDB } from '@aws-sdk/client-dynamodb';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
}

export class UserModel {
  private readonly tableName: string;
  private readonly dynamoDB: DynamoDB;

  constructor() {
    this.tableName = process.env.USERS_TABLE || '';
    
    const config = {
      region: process.env.AWS_REGION || 'us-east-1',
    };
    
    this.dynamoDB = new DynamoDB(config);
  }

  // Convert DynamoDB item to User
  private fromDynamoDB(item: Record<string, any>): User {
    return {
      id: item.id.S!,
      name: item.name.S!,
      email: item.email.S!,
      password: item.password?.S
    };
  }

  // Convert User to DynamoDB item
  private toDynamoDB(user: Partial<User>): Record<string, any> {
    const item: Record<string, any> = {};

    if (user.id) item.id = { S: user.id };
    if (user.name) item.name = { S: user.name };
    if (user.email) item.email = { S: user.email };
    if (user.password) item.password = { S: user.password };

    return item;
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
    const id = uuidv4();
    const hashedPassword = await this.hashPassword(password);

    const user: User = {
      id,
      name,
      email,
      password: hashedPassword
    };

    // Primero verificar si existe un usuario con ese email
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    await this.dynamoDB.putItem({
      TableName: this.tableName,
      Item: this.toDynamoDB(user)
    });

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.dynamoDB.query({
      TableName: this.tableName,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': { S: email }
      }
    });

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return this.fromDynamoDB(result.Items[0]);
  }

  async update(email: string, name: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const result = await this.dynamoDB.updateItem({
      TableName: this.tableName,
      Key: {
        id: { S: user.id }
      },
      UpdateExpression: 'SET #name = :name',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': { S: name }
      },
      ReturnValues: 'ALL_NEW'
    });

    if (!result.Attributes) {
      throw new Error('Failed to update user');
    }

    return this.fromDynamoDB(result.Attributes);
  }

  async delete(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    await this.dynamoDB.deleteItem({
      TableName: this.tableName,
      Key: {
        id: { S: user.id }
      }
    });
  }
}

export const userModel = new UserModel(); 