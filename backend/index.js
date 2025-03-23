'use strict';

// Este archivo sirve como punto de entrada alternativo para las funciones Lambda
// Puede ayudar a resolver problemas de importación en el entorno AWS Lambda

// Exportar el controlador de prueba
exports.test = require('./dist/controllers/test.controller').handler;

// Exportar controladores de auth
try {
  const authController = require('./dist/controllers/auth.controller');
  exports.authRegister = authController.register;
  exports.authLogin = authController.login;
  exports.authLogout = authController.logout;
} catch (err) {
  console.error('Error al cargar controlador de auth:', err);
}

// Exportar controladores de usuarios
try {
  const usersController = require('./dist/controllers/users.controller');
  exports.userGet = usersController.getUser;
  exports.userUpdate = usersController.updateUser;
  exports.userDelete = usersController.deleteUser;
  exports.usersGetAll = usersController.getAllUsers;
} catch (err) {
  console.error('Error al cargar controlador de usuarios:', err);
}

// Log para depurar
console.log('Módulos cargados en index.js:');
console.log(Object.keys(exports)); 