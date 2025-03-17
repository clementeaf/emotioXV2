"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const user_model_1 = require("../models/user.model");
const jwt = __importStar(require("jsonwebtoken"));
class UserService {
    constructor() {
        this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        this.TOKEN_EXPIRY = '24h';
        this.userModel = new user_model_1.UserModel();
    }
    /**
     * Crea un nuevo usuario
     */
    async createUser(name, email, password) {
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
    async login(email, password) {
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
    async getUserByEmail(email) {
        const user = await this.userModel.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    /**
     * Actualiza el nombre de un usuario
     */
    async updateUserName(email, name) {
        const existingUser = await this.userModel.findByEmail(email);
        if (!existingUser) {
            throw new Error('User not found');
        }
        return await this.userModel.update(existingUser.id, { name });
    }
    /**
     * Elimina un usuario
     */
    async deleteUser(email) {
        const existingUser = await this.userModel.findByEmail(email);
        if (!existingUser) {
            throw new Error('User not found');
        }
        await this.userModel.delete(email);
    }
    /**
     * Genera un token JWT para un usuario
     */
    generateToken(user) {
        // Generar token JWT
        const token = jwt.sign({
            id: user.id,
            email: user.email,
            name: user.name
        }, this.JWT_SECRET, { expiresIn: this.TOKEN_EXPIRY });
        // No devolver el campo password
        const { password, ...userWithoutPassword } = user;
        return { token, user: userWithoutPassword };
    }
}
exports.UserService = UserService;
// Exportar una instancia del servicio
exports.userService = new UserService();
//# sourceMappingURL=user.service.js.map