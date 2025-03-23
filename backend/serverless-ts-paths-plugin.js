// serverless-ts-paths-plugin.js
// Este plugin permite que Serverless maneje correctamente las rutas de módulos definidas en tsconfig.json

const path = require('path');
const fs = require('fs');
const { register } = require('ts-node');

class ServerlessTsPathsPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    
    this.hooks = {
      'before:offline:start:init': this.registerTsNode.bind(this),
      'before:invoke:local:invoke': this.registerTsNode.bind(this),
      'before:package:createDeploymentArtifacts': this.registerTsNode.bind(this),
    };
  }

  registerTsNode() {
    const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
    
    if (fs.existsSync(tsConfigPath)) {
      this.serverless.cli.log('Registrando ts-node con tsconfig.json');
      
      register({
        project: tsConfigPath,
        transpileOnly: true,
        compilerOptions: {
          module: 'commonjs',
        },
      });
      
      // Agregar extensiones a require para manejar archivos TypeScript
      require.extensions['.ts'] = require.extensions['.js'];
      
      this.serverless.cli.log('ts-node registrado correctamente');
    } else {
      this.serverless.cli.log('No se encontró el archivo tsconfig.json');
    }
  }
}

module.exports = ServerlessTsPathsPlugin; 