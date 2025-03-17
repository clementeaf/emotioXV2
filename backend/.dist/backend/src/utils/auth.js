"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = verifyToken;
exports.getUserIdFromEvent = getUserIdFromEvent;
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = require("jsonwebtoken");
/**
 * Extract and verify JWT token from Authorization header
 */
function verifyToken(token) {
    try {
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET);
        return decoded;
    }
    catch (error) {
        throw new Error('Invalid token');
    }
}
/**
 * Extract user ID from event's Authorization header
 */
function getUserIdFromEvent(event) {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
        throw new Error('No authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    // Soporte para tokens con campo 'sub' o 'id'
    const userId = decoded.sub || decoded.id;
    if (!userId) {
        throw new Error('Invalid token: missing user identifier');
    }
    return userId;
}
/**
 * Middleware to verify authentication
 */
function requireAuth(event) {
    try {
        return getUserIdFromEvent(event);
    }
    catch (error) {
        throw new Error('Unauthorized');
    }
}
//# sourceMappingURL=auth.js.map