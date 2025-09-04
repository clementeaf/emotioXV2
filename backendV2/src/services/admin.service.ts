import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  AdminUser,
  AdminUserWithPassword,
  CreateUserRequest,
  UpdateUserRequest,
  UserStats,
  AdminServiceResponse
} from '../interfaces/admin.interface';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);
const USER_TABLE = process.env.USER_TABLE || 'emotioxv2-backend-users-dev';

export class AdminService {
  /**
   * Listar todos los usuarios del sistema
   */
  static async getAllUsers(): Promise<AdminServiceResponse<AdminUser[]>> {
    try {
      const command = new ScanCommand({
        TableName: USER_TABLE,
      });

      const result = await dynamodb.send(command);
      
      if (!result.Items) {
        return {
          success: true,
          data: [],
          message: 'No hay usuarios registrados'
        };
      }

      const users: AdminUser[] = result.Items.map((item: any) => ({
        id: item.id,
        email: item.email,
        role: item.role || 'user',
        status: item.status || 'active',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      console.log(`📋 Obtenidos ${users.length} usuarios`);
      
      return {
        success: true,
        data: users,
        message: `${users.length} usuarios obtenidos correctamente`
      };

    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      return {
        success: false,
        error: 'Error obteniendo lista de usuarios'
      };
    }
  }

  /**
   * Obtener un usuario por ID
   */
  static async getUserById(userId: string): Promise<AdminServiceResponse<AdminUserWithPassword>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'ID de usuario requerido'
        };
      }

      const command = new GetCommand({
        TableName: USER_TABLE,
        Key: { id: userId }
      });

      const result = await dynamodb.send(command);
      
      if (!result.Item) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      const user: AdminUserWithPassword = {
        id: result.Item.id,
        email: result.Item.email,
        role: result.Item.role || 'user',
        status: result.Item.status || 'active',
        createdAt: result.Item.createdAt,
        updatedAt: result.Item.updatedAt,
        hashedPassword: result.Item.passwordHash || result.Item.password
      };

      return {
        success: true,
        data: user,
        message: 'Usuario obtenido correctamente'
      };

    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error);
      return {
        success: false,
        error: 'Error obteniendo usuario'
      };
    }
  }

  /**
   * Crear nuevo usuario
   */
  static async createUser(userData: CreateUserRequest): Promise<AdminServiceResponse<AdminUser>> {
    try {
      // Validaciones
      if (!userData.email || !userData.password) {
        return {
          success: false,
          error: 'Email y contraseña son obligatorios'
        };
      }

      if (userData.password.length < 6) {
        return {
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres'
        };
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        return {
          success: false,
          error: 'Formato de email inválido'
        };
      }

      // Verificar que el email no exista
      const existingUserResponse = await this.getUserByEmail(userData.email);
      if (existingUserResponse.success && existingUserResponse.data) {
        return {
          success: false,
          error: 'Ya existe un usuario con este email'
        };
      }

      // Hash de la contraseña (compatible con auth.service.ts)
      const salt = "EmotioX-salt-fixed-839254";
      const hashedPassword = `${salt}:${userData.password}`;
      
      const userId = uuidv4();
      const now = new Date().toISOString();

      const newUserItem = {
        id: userId,
        email: userData.email.toLowerCase().trim(),
        passwordHash: hashedPassword,
        role: userData.role || 'user',
        status: 'active',
        isActive: true,
        isVerified: false,
        createdAt: now,
        updatedAt: now,
        loginCount: 0,
        preferences: {
          language: 'es',
          notifications: true,
          theme: 'light'
        }
      };

      const command = new PutCommand({
        TableName: USER_TABLE,
        Item: newUserItem,
        ConditionExpression: 'attribute_not_exists(id)'
      });

      await dynamodb.send(command);

      console.log(`✅ Usuario creado: ${userData.email}`);

      const createdUser: AdminUser = {
        id: newUserItem.id,
        email: newUserItem.email,
        role: newUserItem.role as 'user' | 'admin',
        status: newUserItem.status as 'active' | 'inactive',
        createdAt: newUserItem.createdAt,
        updatedAt: newUserItem.updatedAt
      };

      return {
        success: true,
        data: createdUser,
        message: 'Usuario creado correctamente'
      };

    } catch (error) {
      console.error('❌ Error creando usuario:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error creando usuario'
      };
    }
  }

  /**
   * Actualizar usuario existente
   */
  static async updateUser(userId: string, updates: UpdateUserRequest): Promise<AdminServiceResponse<AdminUser>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'ID de usuario requerido'
        };
      }

      // Verificar que el usuario existe
      const existingUserResponse = await this.getUserById(userId);
      if (!existingUserResponse.success || !existingUserResponse.data) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      // Si se actualiza el email, verificar que no exista otro usuario con ese email
      if (updates.email && updates.email !== existingUserResponse.data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updates.email)) {
          return {
            success: false,
            error: 'Formato de email inválido'
          };
        }

        const userWithEmailResponse = await this.getUserByEmail(updates.email);
        if (userWithEmailResponse.success && userWithEmailResponse.data && userWithEmailResponse.data.id !== userId) {
          return {
            success: false,
            error: 'Ya existe un usuario con este email'
          };
        }
      }

      // Preparar actualizaciones
      const updateExpression: string[] = [];
      const expressionAttributeValues: Record<string, any> = {};
      const expressionAttributeNames: Record<string, string> = {};

      if (updates.email) {
        updateExpression.push('#email = :email');
        expressionAttributeNames['#email'] = 'email';
        expressionAttributeValues[':email'] = updates.email.toLowerCase().trim();
      }

      if (updates.password) {
        if (updates.password.length < 6) {
          return {
            success: false,
            error: 'La contraseña debe tener al menos 6 caracteres'
          };
        }
        const hashedPassword = await bcrypt.hash(updates.password, 12);
        updateExpression.push('#password = :password');
        expressionAttributeNames['#password'] = 'password';
        expressionAttributeValues[':password'] = hashedPassword;
      }

      if (updates.role) {
        updateExpression.push('#role = :role');
        expressionAttributeNames['#role'] = 'role';
        expressionAttributeValues[':role'] = updates.role;
      }

      if (updates.status) {
        updateExpression.push('#status = :status');
        expressionAttributeNames['#status'] = 'status';
        expressionAttributeValues[':status'] = updates.status;
      }

      // Siempre actualizar updatedAt
      updateExpression.push('updatedAt = :updatedAt');
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      if (updateExpression.length === 1) { // Solo updatedAt
        return {
          success: false,
          error: 'No hay cambios para actualizar'
        };
      }

      const command = new UpdateCommand({
        TableName: USER_TABLE,
        Key: { id: userId },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
        ReturnValues: 'ALL_NEW'
      });

      const result = await dynamodb.send(command);

      if (!result.Attributes) {
        return {
          success: false,
          error: 'Error actualizando usuario'
        };
      }

      console.log(`✅ Usuario actualizado: ${result.Attributes.email}`);

      const updatedUser: AdminUser = {
        id: result.Attributes.id,
        email: result.Attributes.email,
        role: result.Attributes.role,
        status: result.Attributes.status,
        createdAt: result.Attributes.createdAt,
        updatedAt: result.Attributes.updatedAt
      };

      return {
        success: true,
        data: updatedUser,
        message: 'Usuario actualizado correctamente'
      };

    } catch (error) {
      console.error('❌ Error actualizando usuario:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error actualizando usuario'
      };
    }
  }

  /**
   * Eliminar usuario
   */
  static async deleteUser(userId: string): Promise<AdminServiceResponse<void>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'ID de usuario requerido'
        };
      }

      // Verificar que el usuario exists
      const existingUserResponse = await this.getUserById(userId);
      if (!existingUserResponse.success || !existingUserResponse.data) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      const command = new DeleteCommand({
        TableName: USER_TABLE,
        Key: { id: userId },
        ConditionExpression: 'attribute_exists(id)'
      });

      await dynamodb.send(command);

      console.log(`✅ Usuario eliminado: ${existingUserResponse.data.email}`);

      return {
        success: true,
        message: 'Usuario eliminado correctamente'
      };

    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error eliminando usuario'
      };
    }
  }

  /**
   * Buscar usuario por email
   */
  static async getUserByEmail(email: string): Promise<AdminServiceResponse<AdminUserWithPassword>> {
    try {
      if (!email) {
        return {
          success: false,
          error: 'Email requerido'
        };
      }

      const command = new QueryCommand({
        TableName: USER_TABLE,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email.toLowerCase().trim()
        }
      });

      const result = await dynamodb.send(command);
      
      if (!result.Items || result.Items.length === 0) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      const item = result.Items[0];
      const user: AdminUserWithPassword = {
        id: item.id,
        email: item.email,
        role: item.role || 'user',
        status: item.status || 'active',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        hashedPassword: item.password
      };

      return {
        success: true,
        data: user,
        message: 'Usuario encontrado'
      };

    } catch (error) {
      console.error('❌ Error buscando usuario por email:', error);
      return {
        success: false,
        error: 'Error buscando usuario'
      };
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  static async getUserStats(): Promise<AdminServiceResponse<UserStats>> {
    try {
      const allUsersResponse = await this.getAllUsers();
      
      if (!allUsersResponse.success || !allUsersResponse.data) {
        return {
          success: false,
          error: 'Error obteniendo usuarios para estadísticas'
        };
      }

      const allUsers = allUsersResponse.data;
      
      const stats: UserStats = {
        total: allUsers.length,
        active: allUsers.filter(u => u.status === 'active').length,
        inactive: allUsers.filter(u => u.status === 'inactive').length,
        admins: allUsers.filter(u => u.role === 'admin').length,
        users: allUsers.filter(u => u.role === 'user').length
      };

      return {
        success: true,
        data: stats,
        message: 'Estadísticas obtenidas correctamente'
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return {
        success: false,
        error: 'Error obteniendo estadísticas de usuarios'
      };
    }
  }

  /**
   * Verificar si existe al menos un administrador activo
   */
  static async hasAdminUsers(): Promise<AdminServiceResponse<boolean>> {
    try {
      const command = new ScanCommand({
        TableName: USER_TABLE,
        FilterExpression: '#role = :role AND #status = :status',
        ExpressionAttributeNames: {
          '#role': 'role',
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':role': 'admin',
          ':status': 'active'
        }
      });

      const result = await dynamodb.send(command);
      const hasAdmins = result.Items ? result.Items.length > 0 : false;

      return {
        success: true,
        data: hasAdmins,
        message: hasAdmins ? 'Existen administradores activos' : 'No hay administradores activos'
      };

    } catch (error) {
      console.error('❌ Error verificando administradores:', error);
      return {
        success: false,
        error: 'Error verificando administradores'
      };
    }
  }
}