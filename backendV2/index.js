'use strict';

// Redireccionamiento para Serverless
module.exports.test = require('./.build/src/controllers/test.controller').handler;