import { DynamoDB } from '@aws-sdk/client-dynamodb';

export interface User {
  id: string;
  name: string;
  email: string;
}

export class UserModel {
  private readonly tableName: string;
  private readonly dynamoDB: DynamoDB;

  constructor() {
    this.tableName = process.env.USERS_TABLE || '';
    this.dynamoDB = new DynamoDB({});
  }

  // Convert DynamoDB item to User
  private fromDynamoDB(item: Record<string, any>): User {
    return {
      id: item.id.S!,
      name: item.name.S!,
      email: item.email.S!
    };
  }

  // Convert User to DynamoDB item
  private toDynamoDB(user: Partial<User>): Record<string, any> {
    const item: Record<string, any> = {};

    if (user.id) item.id = { S: user.id };
    if (user.name) item.name = { S: user.name };
    if (user.email) item.email = { S: user.email };

    return item;
  }

  async create(name: string, email: string): Promise<User> {
    const user: User = {
      id: email, // Usando el email como ID
      name,
      email
    };

    await this.dynamoDB.putItem({
      TableName: this.tableName,
      Item: this.toDynamoDB(user),
      ConditionExpression: 'attribute_not_exists(id)'
    });

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.dynamoDB.getItem({
      TableName: this.tableName,
      Key: {
        id: { S: email }
      }
    });

    if (!result.Item) {
      return null;
    }

    return this.fromDynamoDB(result.Item);
  }

  async update(email: string, name: string): Promise<User> {
    const result = await this.dynamoDB.updateItem({
      TableName: this.tableName,
      Key: {
        id: { S: email }
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
    await this.dynamoDB.deleteItem({
      TableName: this.tableName,
      Key: {
        id: { S: email }
      }
    });
  }
}

export const userModel = new UserModel(); 