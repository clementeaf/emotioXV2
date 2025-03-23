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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
class AuthService {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_key_for_testing_only';
        this.tokenExpiration = '24h'; // Token válido por 24 horas
    }
    /**
     * Genera un token JWT para un usuario
     */
    generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name
        };
        return jwt.sign(payload, this.jwtSecret, { expiresIn: this.tokenExpiration });
    }
    /**
     * Verifica un token JWT y devuelve el payload si es válido
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    /**
     * Extrae el token de los headers de autorización
     */
    extractTokenFromHeader(authHeader) {
        if (!authHeader) {
            throw new Error('No authorization header');
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new Error('Invalid authorization header format');
        }
        return parts[1];
    }
    /**
     * Autentica a un usuario con email y contraseña
     */
    async login(email, password) {
        // Buscar usuario por email
        const user = await user_model_1.userModel.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }
        // Verificar contraseña
        if (!user.password) {
            throw new Error('Invalid credentials');
        }
        const isPasswordValid = await user_model_1.userModel.comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        // Generar token
        const token = this.generateToken(user);
        // Devolver respuesta
        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        };
    }
    /**
     * Registra un nuevo usuario
     */
    async register(name, email, password) {
        // Crear usuario
        const user = await user_model_1.userModel.create(name, email, password);
        // Generar token
        const token = this.generateToken(user);
        // Devolver respuesta
        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        };
    }
    /**
     * Obtiene el ID de usuario a partir de un token
     */
    getUserIdFromToken(token) {
        const decoded = this.verifyToken(token);
        return decoded.id;
    }
}
exports.AuthService = AuthService;
// Singleton para reutilizar en toda la aplicación
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map