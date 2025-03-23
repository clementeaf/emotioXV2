/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.handler = void 0;
/**
 * Controlador de prueba para verificar la configuración básica
 */
const handler = async (event) => {
    console.log('Test controller llamado con evento:', JSON.stringify(event));
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true'
        },
        body: JSON.stringify({
            message: 'Hello from test controller!',
            event: {
                path: event.path,
                method: event.httpMethod,
                queryParams: event.queryStringParameters
            }
        })
    };
};
exports.handler = handler;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=test.controller.js.map