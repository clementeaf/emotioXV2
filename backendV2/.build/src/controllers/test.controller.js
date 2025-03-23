"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
            message: 'Hola desde backendV2! El endpoint de prueba funciona correctamente.',
            timestamp: new Date().toISOString(),
            stage: process.env.NODE_ENV || 'local',
        })
    };
};
exports.handler = handler;
//# sourceMappingURL=test.controller.js.map