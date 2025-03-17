"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = exports.UsersService = void 0;
const user_model_1 = require("../models/user.model");
class UsersService {
    /**
     * Obtiene un usuario por su ID
     */
    async getUserById(userId) {
        const user = await user_model_1.userModel.findById(userId);
        if (!user) {
            return null;
        }
        // No devolver la contraseña
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    /**
     * Actualiza un usuario
     */
    async updateUser(userId, data) {
        return user_model_1.userModel.update(userId, data);
    }
    /**
     * Elimina un usuario
     */
    async deleteUser(userId) {
        await user_model_1.userModel.delete(userId);
    }
}
exports.UsersService = UsersService;
// Singleton para reutilizar en toda la aplicación
exports.usersService = new UsersService();
//# sourceMappingURL=users.service.js.map