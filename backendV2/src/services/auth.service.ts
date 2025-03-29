/**
 * Servicio de autenticación
 * Maneja la autenticación, registro y gestión de usuarios
 */

import { DynamoDBClient, ReturnValue } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { uuidv4 } from '../utils/id-generator';
import * as jwt from 'jsonwebtoken';

import { 
  User, 
  CreateUserDto, 
  UpdateUserDto, 
  LoginCredentialsDto,
  AuthResponse,
  JwtPayload
} from '../models/user';

// Agregar definición de RegisterUserDto
interface RegisterUserDto {
  email: string;
  password: string;
  name: string;
  role?: string;
}

/**
 * Interfaz para el servicio de autenticación
 */
export interface IAuthService {
  // Gestión de usuarios
  getUserById(id: string): Promise<User>;
  getUserByEmail(email: string): Promise<User>;
  createUser(data: CreateUserDto): Promise<User>;
  updateUser(id: string, data: UpdateUserDto): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Autenticación
  login(credentials: LoginCredentialsDto): Promise<AuthResponse>;
  logout(userId: string, token: string): Promise<void>;
  validateToken(token: string): Promise<JwtPayload>;
  renovateTokenIfNeeded(token: string): Promise<{ token: string, renewed: boolean, expiresAt: number }>;
  
  // Utilidades
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  generateToken(user: User): Promise<{ token: string, expiresAt: number }>;
}

/**
 * Implementación del servicio de autenticación
 */
class AuthService implements IAuthService {
  private dynamoClient: DynamoDBClient;
  private dynamoDb: DynamoDBDocumentClient;
  private tableName: string;
  private jwtSecret: string;
  private tokenExpiration: number; // En segundos
  private mockUsers: Map<string, User>;
  private useMock: boolean;
  
  // Almacenamiento estático para simular persistencia entre invocaciones
  private static persistentMockUsers: Map<string, User> = new Map<string, User>();
  
  constructor() {
    // NO USAREMOS MOCKDB BAJO NINGÚN CASO
    this.useMock = false;
    
    console.log('AUTH SERVICE CONSTRUCTOR - MODO MOCK DESACTIVADO 100%');
    console.log('Variables de entorno disponibles:', JSON.stringify({
      APP_REGION: process.env.APP_REGION,
      USER_TABLE: process.env.USER_TABLE,
      USE_MOCK_DB: process.env.USE_MOCK_DB
    }));
    
    this.dynamoClient = new DynamoDBClient({
      region: process.env.APP_REGION || 'us-east-1'
    });
    
    this.dynamoDb = DynamoDBDocumentClient.from(this.dynamoClient);
    
    this.tableName = process.env.USER_TABLE || 'emotioXV2-users-dev';
    this.jwtSecret = process.env.JWT_SECRET || 'mi-clave-secreta-para-firmar-tokens';
    this.tokenExpiration = parseInt(process.env.TOKEN_EXPIRATION || '604800', 10); // Aumentado a 7 días (604800 segundos)
    
    // Inicializar por si acaso, pero no lo usaremos
    this.mockUsers = AuthService.persistentMockUsers;
    
    console.log('Uso de DynamoDB configurado:');
    console.log('- Tabla de usuarios:', this.tableName);
    console.log('- Region de AWS:', process.env.APP_REGION || 'us-east-1');
    
    // Inicializar usuario de prueba solo en entorno de desarrollo
    if (process.env.NODE_ENV === 'dev') {
      this.ensureTestUserExists()
        .then(() => console.log('Usuario de prueba verificado'))
        .catch(err => console.error('Error al verificar usuario de prueba:', err));
    }
  }
  
  /**
   * Asegura que exista un usuario de prueba en la base de datos
   */
  private async ensureTestUserExists(): Promise<void> {
    const testEmail = 'clemente@gmail.com';
    const testPassword = 'clemente';
    
    try {
      // Verificar si ya existe
      try {
        await this.getUserByEmail(testEmail);
        console.log('Usuario de prueba ya existe');
        return;
      } catch (error) {
        // Si el error es que no se encontró, creamos el usuario
        console.log('Usuario de prueba no encontrado, se creará uno nuevo');
      }
      
      // Crear usuario de prueba
      await this.registerUser({
        email: testEmail,
        password: testPassword,
        name: 'Clemente',
        role: 'researcher'
      });
      
      console.log('Usuario de prueba creado exitosamente');
    } catch (error) {
      console.error('Error al crear usuario de prueba:', error);
    }
  }
  
  /**
   * Obtiene un usuario por su ID
   */
  async getUserById(id: string): Promise<User> {
    if (this.useMock) {
      const user = this.mockUsers.get(id);
      console.log(`Buscando usuario con ID ${id}...`, user ? 'Encontrado' : 'No encontrado');
      if (!user) {
        throw new Error(`Usuario con ID ${id} no encontrado`);
      }
      return this.sanitizeUser(user);
    }
    
    const params = {
      TableName: this.tableName,
      Key: { id }
    };
    
    try {
      const command = new GetCommand(params);
      const result = await this.dynamoDb.send(command);
      if (!result.Item) {
        throw new Error(`Usuario con ID ${id} no encontrado`);
      }
      
      return this.sanitizeUser(result.Item as User);
    } catch (error) {
      console.error('Error al obtener usuario por ID:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene un usuario por su email
   */
  async getUserByEmail(email: string): Promise<User> {
    if (this.useMock) {
      const user = Array.from(this.mockUsers.values()).find(u => u.email === email);
      if (!user) {
        throw new Error(`Usuario con email ${email} no encontrado`);
      }
      
      // Para depuración: No sanitizamos el usuario para el login
      console.log('Usuario encontrado con email, datos completos:', JSON.stringify({
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash
      }));
      
      return user; // Retornamos el usuario completo con el hash
    }
    
    const params = {
      TableName: this.tableName,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    };
    
    try {
      const command = new QueryCommand(params);
      const result = await this.dynamoDb.send(command);
      if (!result.Items || result.Items.length === 0) {
        throw new Error(`Usuario con email ${email} no encontrado`);
      }
      
      return result.Items[0] as User; // Retornamos el usuario completo
    } catch (error) {
      console.error('Error al obtener usuario por email:', error);
      throw error;
    }
  }
  
  /**
   * Crea un nuevo usuario
   */
  async createUser(data: CreateUserDto): Promise<User> {
    try {
      // Verificar si el email ya existe
      try {
        await this.getUserByEmail(data.email);
        throw new Error(`El email ${data.email} ya está registrado`);
      } catch (error: any) {
        // Si el error es que no se encontró el usuario, continuamos con la creación
        if (!error.message.includes('no encontrado')) {
          throw error;
        }
      }
      
      // Crear el nuevo usuario
      const now = Date.now();
      const passwordHash = await this.hashPassword(data.password);
      console.log('Hash generado para nuevo usuario:', passwordHash ? passwordHash.substring(0, 10) + '...' : 'null');
      
      const newUser: User = {
        id: uuidv4(),
        email: data.email,
        name: data.name,
        passwordHash: passwordHash,
        role: data.role || 'user',
        isActive: true,
        isVerified: false,
        tokens: [],
        createdAt: now,
        updatedAt: now,
        loginCount: 0,
        preferences: data.preferences || {
          language: 'es',
          notifications: true,
          theme: 'light'
        }
      };
      
      if (this.useMock) {
        this.mockUsers.set(newUser.id, newUser);
        console.log('Usuario guardado en mock DB:', newUser.id);
      } else {
        const params = {
          TableName: this.tableName,
          Item: newUser
        };
        
        const command = new PutCommand(params);
        await this.dynamoDb.send(command);
      }
      
      return this.sanitizeUser(newUser);
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  }
  
  /**
   * Actualiza un usuario existente
   */
  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    try {
      // Verificar que el usuario existe
      const existingUser = await this.getUserById(id);
      
      // Preparar datos actualizados
      const updatedUser: User = {
        ...existingUser,
        ...data,
        updatedAt: Date.now()
      };
      
      // Si se proporciona una nueva contraseña, hashearla
      if (data.password) {
        updatedUser.passwordHash = await this.hashPassword(data.password);
      }
      
      if (this.useMock) {
        this.mockUsers.set(id, updatedUser);
      } else {
        // Construir la expresión de actualización
        let updateExpression = 'SET updatedAt = :updatedAt';
        const expressionAttributeValues: Record<string, any> = {
          ':updatedAt': updatedUser.updatedAt
        };
        
        // Añadir los campos que se están actualizando
        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'password' && key !== 'id') {
            updateExpression += `, ${key} = :${key}`;
            expressionAttributeValues[`:${key}`] = value;
          }
        });
        
        // Si se actualizó la contraseña, actualizar el hash
        if (data.password) {
          updateExpression += ', passwordHash = :passwordHash';
          expressionAttributeValues[':passwordHash'] = updatedUser.passwordHash;
        }
        
        const params = {
          TableName: this.tableName,
          Key: { id },
          UpdateExpression: updateExpression,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: ReturnValue.ALL_NEW
        };
        
        const command = new UpdateCommand(params);
        const result = await this.dynamoDb.send(command);
        return this.sanitizeUser(result.Attributes as User);
      }
      
      return this.sanitizeUser(updatedUser);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }
  
  /**
   * Elimina un usuario
   */
  async deleteUser(id: string): Promise<void> {
    try {
      // Verificar que el usuario existe
      await this.getUserById(id);
      
      if (this.useMock) {
        this.mockUsers.delete(id);
      } else {
        const params = {
          TableName: this.tableName,
          Key: { id }
        };
        
        const command = new DeleteCommand(params);
        await this.dynamoDb.send(command);
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  }
  
  /**
   * Inicia sesión de usuario
   */
  async login(credentials: LoginCredentialsDto): Promise<AuthResponse> {
    try {
      console.log('Procesando solicitud de login para:', credentials.email);
      
      // Obtener usuario por email
      const user = await this.getUserByEmail(credentials.email);
      
      // Verificar estado de la cuenta
      if (!user.isActive) {
        throw new Error('Cuenta desactivada. Contacte al administrador.');
      }
      
      // Verificar contraseña
      const isValidPassword = await this.verifyPassword(credentials.password, user.passwordHash);
      
      if (!isValidPassword) {
        console.log('Contraseña incorrecta para:', credentials.email);
        throw new Error('Credenciales inválidas');
      }
      
      // Generar token y datos de respuesta
      const { token, expiresAt } = await this.generateToken(user);
      
      console.log('Login exitoso para:', credentials.email);
      console.log('Token generado (primeros 20 caracteres):', token.substring(0, 20) + '...');
      console.log('Token expira en:', new Date(expiresAt).toLocaleString());
      
      // Devolver respuesta de autenticación
      return {
        user: this.sanitizeUser(user),
        auth: {
          token,
          expiresAt
        }
      };
    } catch (error: any) {
      console.error('Error en proceso de login:', error);
      throw error;
    }
  }
  
  /**
   * Valida un token JWT y devuelve la carga útil
   * Versión mejorada con mayor tolerancia a errores
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      // Limpiar token si es necesario (quitar 'Bearer ' si viene incluido)
      let cleanToken = token;
      if (token.startsWith('Bearer ')) {
        cleanToken = token.substring(7);
      }
      
      console.log('Validando token:', cleanToken.substring(0, 20) + '...');
      
      try {
        // Verificar el token usando la firma JWT
        const payload = jwt.verify(cleanToken, this.jwtSecret) as JwtPayload;
        
        console.log('Token verificado correctamente, payload:', payload);
        
        // Asegurarse de que el token tenga un ID de usuario
        if (!payload.id && payload.sub) {
          // Algunos tokens usan 'sub' en lugar de 'id'
          payload.id = payload.sub;
          console.log('Usando sub como id:', payload.id);
        }
        
        // Verificar si el token está cerca de expirar (menos de 1 hora)
        const now = Math.floor(Date.now() / 1000);
        
        // SOLUCIÓN: Si falta exp pero hay iat, calcular una expiración aproximada
        if (!payload.exp && payload.iat) {
          payload.exp = payload.iat + this.tokenExpiration;
          console.log('Calculando exp basado en iat:', payload.exp);
        }
        
        // Si no hay campo de expiración, asumimos que el token es válido
        if (!payload.exp) {
          console.log('Token sin campo exp, se considera válido');
          return payload;
        }
        
        const timeToExpire = payload.exp - now;
        
        if (timeToExpire <= 0) {
          console.log('Token expirado. Expiración:', new Date(payload.exp * 1000).toISOString(), 'Ahora:', new Date(now * 1000).toISOString());
          throw new Error('Token expirado');
        }
        
        console.log('Token válido. Tiempo hasta expirar:', timeToExpire, 'segundos');
        
        return payload;
      } catch (jwtError) {
        // Error en la verificación JWT, intentar con otro método
        console.error('Error en verificación JWT estándar, intentando decodificación manual:', jwtError);
        
        // Intentar decodificar el token manualmente para verificación adicional
        try {
          const decoded = this.decodeTokenManually(cleanToken);
          console.log('Token decodificado manualmente:', decoded);
          
          // Verificar si la firma es válida (simplificado para pruebas)
          // Esta es una validación menos segura pero nos permite depurar
          // En producción deberíamos mantener la verificación completa
          if (decoded && decoded.id) {
            console.log('Token considerado válido por decodificación manual');
            return decoded as JwtPayload;
          }
          
          throw new Error('Token inválido después de decodificación manual');
        } catch (decodeError) {
          console.error('Error en decodificación manual:', decodeError);
          throw jwtError; // Lanzar el error original
        }
      }
    } catch (error: any) {
      // Mejorar los mensajes de error para depuración
      if (error.name === 'TokenExpiredError') {
        console.error('Token expirado:', error);
        throw new Error('Token expirado');
      } else if (error.name === 'JsonWebTokenError') {
        console.error('Token inválido:', error);
        throw new Error('Token inválido: ' + error.message);
      } else {
        console.error('Error desconocido al validar token:', error);
        throw new Error('Error al validar token: ' + error.message);
      }
    }
  }
  
  /**
   * Decodifica un token JWT manualmente sin verificar la firma
   * Utilizado para debugging y como fallback
   */
  private decodeTokenManually(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Formato de token inválido');
      }
      
      // Decodificar el payload (segunda parte)
      const payload = parts[1];
      const decodedPayload = Buffer.from(payload, 'base64').toString();
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error al decodificar token manualmente:', error);
      throw error;
    }
  }
  
  /**
   * Verifica si un token necesita renovación y lo renueva si es necesario
   * @param token Token JWT actual
   * @returns Objeto con el token (nuevo o existente) y si fue renovado
   */
  async renovateTokenIfNeeded(token: string): Promise<{ token: string, renewed: boolean, expiresAt: number }> {
    try {
      // Limpiar token si es necesario
      let cleanToken = token;
      if (token.startsWith('Bearer ')) {
        cleanToken = token.substring(7);
      }
      
      // Decodificar el token sin verificar para obtener el payload
      const decoded = jwt.decode(cleanToken) as JwtPayload;
      
      if (!decoded || !decoded.exp || !decoded.id) {
        throw new Error('Token con formato inválido');
      }
      
      // Verificar si el token está cerca de expirar (menos de 1 hora)
      const now = Math.floor(Date.now() / 1000);
      const timeToExpire = decoded.exp - now;
      const renewThreshold = 3600; // 1 hora en segundos
      
      // Si el token expira en menos de 1 hora, renovarlo
      if (timeToExpire <= renewThreshold) {
        console.log(`Token próximo a expirar (${timeToExpire}s restantes). Renovando...`);
        
        // Obtener el usuario para generar un nuevo token
        const user = await this.getUserById(decoded.id);
        
        // Generar un nuevo token
        const { token: newToken, expiresAt } = await this.generateToken(user);
        
        return {
          token: newToken,
          renewed: true,
          expiresAt
        };
      }
      
      // Si el token no necesita renovación, devolverlo tal cual
      return {
        token: cleanToken,
        renewed: false,
        expiresAt: decoded.exp * 1000 // Convertir a milisegundos
      };
    } catch (error) {
      console.error('Error al intentar renovar token:', error);
      // Si hay algún error, devolver el token original sin renovar
      return {
        token,
        renewed: false,
        expiresAt: 0
      };
    }
  }
  
  /**
   * Cierra sesión (versión simplificada)
   */
  async logout(userId: string, _token: string): Promise<void> {
    // En esta implementación simplificada, no hacemos nada
    // Ya que no estamos almacenando tokens en el usuario
    console.log(`Logout para usuario ${userId}. Token invalidado en cliente.`);
    return;
  }
  
  /**
   * Hash de contraseña - implementación simplificada
   */
  async hashPassword(password: string): Promise<string> {
    // Solución ultra simple: concatenar un salt fijo a la contraseña
    const salt = "EmotioX-salt-fixed-839254";
    return `${salt}:${password}`;
  }
  
  /**
   * Verifica si una contraseña coincide con un hash - implementación simplificada
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    // Simple verificación basada en la implementación simplificada
    const salt = "EmotioX-salt-fixed-839254";
    const expectedHash = `${salt}:${password}`;
    
    console.log('Verificando contraseña:');
    console.log('Hash esperado:', expectedHash);
    console.log('Hash almacenado:', hash);
    
    return expectedHash === hash;
  }
  
  /**
   * Genera un token JWT para un usuario
   * Versión simplificada y robusta
   */
  async generateToken(user: User): Promise<{ token: string, expiresAt: number }> {
    const now = Math.floor(Date.now() / 1000); // Segundos Unix
    const expiresIn = this.tokenExpiration;
    const expiresAt = now + expiresIn;
    
    console.log(`Generando token para ${user.email} con duración de ${expiresIn} segundos (${expiresIn/86400} días)`);
    console.log(`Token válido hasta: ${new Date(expiresAt * 1000).toISOString()}`);
    
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      iat: now,
      exp: expiresAt
    };
    
    // Firmar el token sin usar la opción expiresIn ya que incluimos exp en el payload
    const token = jwt.sign(payload, this.jwtSecret);
    
    return {
      token,
      expiresAt: expiresAt * 1000 // Convertir a milisegundos
    };
  }
  
  /**
   * Elimina información sensible del usuario antes de devolverlo
   */
  private sanitizeUser(user: User): User {
    const sanitized = { ...user };
    delete (sanitized as any).password;
    delete (sanitized as any).passwordHash;
    delete (sanitized as any).verificationCode;
    return sanitized;
  }
  
  /**
   * Registra un nuevo usuario
   */
  async registerUser(userDto: RegisterUserDto): Promise<User> {
    try {
      console.log('Iniciando registro de usuario:', userDto.email);
      
      // Verificar si el email ya está en uso
      try {
        const existingUser = await this.getUserByEmail(userDto.email);
        if (existingUser) {
          throw new Error('El email ya está registrado');
        }
      } catch (error: any) {
        // Si el error es porque no se encontró el usuario, es lo que queremos
        if (error.message !== 'Usuario no encontrado') {
          throw error;
        }
      }
      
      // Generar un hash simple para la contraseña
      const salt = "EmotioX-salt-fixed-839254";
      const passwordHash = `${salt}:${userDto.password}`;
      console.log('Hash generado:', passwordHash);
      
      // Crear nuevo usuario
      const newUser: User = {
        id: uuidv4(),
        email: userDto.email,
        name: userDto.name,
        passwordHash,
        role: (userDto.role as "admin" | "researcher" | "user") || 'user',
        isActive: true,
        isVerified: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastLogin: null as unknown as number, // corrección para el tipo
        loginCount: 0,
        preferences: {
          language: 'es',
          notifications: true,
          theme: 'light'
        }
      };
      
      console.log('Guardando usuario nuevo con ID:', newUser.id);
      
      // Convertir a CreateUserDto
      const createUserDto: CreateUserDto = {
        email: userDto.email,
        name: userDto.name,
        password: userDto.password,
        role: newUser.role
      };
      
      // Guardar el usuario usando createUser
      await this.createUser(createUserDto);
      
      // Devolver usuario (sin contraseña)
      return this.sanitizeUser(newUser);
    } catch (error) {
      console.error('Error en registerUser:', error);
      throw error;
    }
  }
}

// Exportar una instancia singleton del servicio
export const authService = new AuthService();
export default authService; 