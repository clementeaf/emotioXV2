// Este archivo sirve como punto de entrada para las funciones Lambda
// Exportamos todas las funciones desde el controlador compilado

// Importar todas las funciones del controlador
const userController = require('./dist/controllers/user.controller');

// Exportar todas las funciones para que sean accesibles
module.exports = {
  requestOTP: userController.requestOTP,
  validateOTP: userController.validateOTP,
  createUser: userController.createUser,
  getUser: userController.getUser,
  updateUser: userController.updateUser,
  deleteUser: userController.deleteUser,
  optionsHandler: userController.optionsHandler
}; 