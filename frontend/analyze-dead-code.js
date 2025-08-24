#!/usr/bin/env node

/**
 * 🔍 ANALIZADOR DE CÓDIGO MUERTO - EmotioXV2 Frontend
 * 
 * Identifica y reporta:
 * - Archivos no importados/referenciados
 * - Componentes no utilizados
 * - Funciones exportadas sin uso
 * - Variables/constantes sin referencias
 * - Imports no utilizados
 * - Tipos TypeScript sin uso
 * 
 * SOLO REPORTA - NO MODIFICA CÓDIGO
 */

const fs = require('fs');
const path = require('path');

class DeadCodeAnalyzer {
  constructor() {
    this.srcDir = path.join(__dirname, 'src');
    this.allFiles = [];
    this.imports = new Map(); // file -> [imported items]
    this.exports = new Map(); // file -> [exported items]
    this.references = new Map(); // item -> [files that reference it]
    this.deadCode = {
      files: [],
      components: [],
      functions: [],
      variables: [],
      types: [],
      imports: []
    };
  }

  log(category, message, details = null) {
    console.log(`📁 ${category}: ${message}`);
    if (details && details.length > 0) {
      details.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item}`);
      });
    }
  }

  // Obtener todos los archivos .ts/.tsx
  getAllFiles(dir = this.srcDir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !['node_modules', '.next', 'dist'].includes(entry.name)) {
        this.getAllFiles(fullPath, files);
      } else if (entry.name.match(/\.(ts|tsx|js|jsx)$/)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  // Analizar imports en un archivo
  analyzeImports(filePath, content) {
    const imports = [];
    const importRegex = /import\s+(?:{([^}]+)}|([^{,\s]+)(?:,\s*{([^}]+)})?|\*\s+as\s+(\w+))\s+from\s+['"']([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const [, namedImports, defaultImport, additionalNamed, namespaceImport, source] = match;
      
      // Solo analizar imports internos (relativos o de @/)
      if (source.startsWith('./') || source.startsWith('../') || source.startsWith('@/')) {
        if (namedImports) {
          namedImports.split(',').forEach(imp => {
            imports.push(imp.trim().replace(/\s+as\s+\w+/, ''));
          });
        }
        if (additionalNamed) {
          additionalNamed.split(',').forEach(imp => {
            imports.push(imp.trim().replace(/\s+as\s+\w+/, ''));
          });
        }
        if (defaultImport) {
          imports.push(defaultImport.trim());
        }
        if (namespaceImport) {
          imports.push(namespaceImport.trim());
        }
      }
    }
    
    this.imports.set(filePath, imports);
    return imports;
  }

  // Analizar exports en un archivo
  analyzeExports(filePath, content) {
    const exports = [];
    
    // Named exports
    const namedExportRegex = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    // Export statements
    const exportStatementRegex = /export\s+{\s*([^}]+)\s*}/g;
    while ((match = exportStatementRegex.exec(content)) !== null) {
      match[1].split(',').forEach(exp => {
        const cleaned = exp.trim().replace(/\s+as\s+\w+/, '');
        exports.push(cleaned);
      });
    }
    
    // Default export (component name)
    const defaultExportRegex = /export\s+default\s+(?:function\s+)?(\w+)|const\s+(\w+)\s*=.*export\s+default\s+\2/g;
    while ((match = defaultExportRegex.exec(content)) !== null) {
      exports.push(match[1] || match[2]);
    }
    
    this.exports.set(filePath, exports);
    return exports;
  }

  // Buscar referencias de un símbolo en todos los archivos
  findReferences(symbol, excludeFile = null) {
    const references = [];
    
    for (const [filePath, content] of this.fileContents.entries()) {
      if (filePath === excludeFile) continue;
      
      // Buscar referencias directas
      const symbolRegex = new RegExp(`\\b${symbol}\\b`, 'g');
      const matches = content.match(symbolRegex);
      
      if (matches && matches.length > 0) {
        references.push({
          file: filePath.replace(this.srcDir + '/', ''),
          occurrences: matches.length
        });
      }
    }
    
    return references;
  }

  // Analizar archivos no referenciados
  analyzeUnusedFiles() {
    const referencedFiles = new Set();
    
    // Marcar archivos que son importados
    for (const [filePath, content] of this.fileContents.entries()) {
      const importRegex = /from\s+['"']([^'"]+)['"]/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        let importPath = match[1];
        
        // Resolver rutas relativas
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          const resolvedPath = path.resolve(path.dirname(filePath), importPath);
          
          // Intentar diferentes extensiones
          const possiblePaths = [
            resolvedPath + '.ts',
            resolvedPath + '.tsx',
            resolvedPath + '.js',
            resolvedPath + '.jsx',
            resolvedPath + '/index.ts',
            resolvedPath + '/index.tsx'
          ];
          
          for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
              referencedFiles.add(possiblePath);
              break;
            }
          }
        }
        
        // Resolver imports con @/
        if (importPath.startsWith('@/')) {
          const resolvedPath = importPath.replace('@/', this.srcDir + '/');
          const possiblePaths = [
            resolvedPath + '.ts',
            resolvedPath + '.tsx',
            resolvedPath + '.js',
            resolvedPath + '.jsx',
            resolvedPath + '/index.ts',
            resolvedPath + '/index.tsx'
          ];
          
          for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
              referencedFiles.add(possiblePath);
              break;
            }
          }
        }
      }
    }
    
    // Marcar archivos especiales como usados
    const specialFiles = [
      'page.tsx',
      'layout.tsx',
      'globals.css',
      'page.ts',
      'layout.ts',
      'middleware.ts',
      'next.config.js',
      '_app.tsx',
      '_document.tsx'
    ];
    
    for (const filePath of this.allFiles) {
      const fileName = path.basename(filePath);
      if (specialFiles.includes(fileName)) {
        referencedFiles.add(filePath);
      }
    }
    
    // Identificar archivos no referenciados
    for (const filePath of this.allFiles) {
      if (!referencedFiles.has(filePath)) {
        // Excluir archivos de test y configuración
        const relativePath = filePath.replace(this.srcDir + '/', '');
        if (!relativePath.includes('test') && 
            !relativePath.includes('spec') &&
            !relativePath.includes('.config.') &&
            !relativePath.includes('__tests__')) {
          this.deadCode.files.push(relativePath);
        }
      }
    }
  }

  // Analizar exports no utilizados
  analyzeUnusedExports() {
    for (const [filePath, exports] of this.exports.entries()) {
      const relativePath = filePath.replace(this.srcDir + '/', '');
      
      for (const exportName of exports) {
        const references = this.findReferences(exportName, filePath);
        
        if (references.length === 0) {
          // Verificar si es un componente de página (puede ser usado por Next.js)
          if (filePath.includes('/page.') || filePath.includes('/layout.')) {
            continue; // Los componentes de página pueden no tener referencias explícitas
          }
          
          this.deadCode.functions.push(`${relativePath}: ${exportName}`);
        }
      }
    }
  }

  // Analizar imports no utilizados
  analyzeUnusedImports() {
    for (const [filePath, content] of this.fileContents.entries()) {
      const relativePath = filePath.replace(this.srcDir + '/', '');
      const imports = this.imports.get(filePath) || [];
      
      for (const importName of imports) {
        // Buscar si el import se usa en el archivo
        const usageRegex = new RegExp(`\\b${importName}\\b`, 'g');
        const contentWithoutImports = content.replace(/import.*from.*['"'][^'"]*['"];?\s*/g, '');
        
        if (!usageRegex.test(contentWithoutImports)) {
          this.deadCode.imports.push(`${relativePath}: ${importName}`);
        }
      }
    }
  }

  // Analizar variables no utilizadas
  analyzeUnusedVariables() {
    for (const [filePath, content] of this.fileContents.entries()) {
      const relativePath = filePath.replace(this.srcDir + '/', '');
      
      // Buscar declaraciones de variables/constantes
      const variableRegex = /(?:const|let|var)\s+(\w+)\s*=/g;
      let match;
      
      while ((match = variableRegex.exec(content)) !== null) {
        const varName = match[1];
        
        // Excluir variables exportadas
        const exports = this.exports.get(filePath) || [];
        if (exports.includes(varName)) continue;
        
        // Contar referencias (excluyendo la declaración)
        const refRegex = new RegExp(`\\b${varName}\\b`, 'g');
        const matches = content.match(refRegex) || [];
        
        if (matches.length === 1) { // Solo la declaración
          this.deadCode.variables.push(`${relativePath}: ${varName}`);
        }
      }
    }
  }

  // Buscar tipos TypeScript no utilizados
  analyzeUnusedTypes() {
    for (const [filePath, content] of this.fileContents.entries()) {
      const relativePath = filePath.replace(this.srcDir + '/', '');
      
      // Buscar declaraciones de tipos e interfaces
      const typeRegex = /(?:interface|type)\s+(\w+)/g;
      let match;
      
      while ((match = typeRegex.exec(content)) !== null) {
        const typeName = match[1];
        
        // Buscar referencias del tipo
        const references = this.findReferences(typeName, filePath);
        const localRefs = (content.match(new RegExp(`\\b${typeName}\\b`, 'g')) || []).length;
        
        if (references.length === 0 && localRefs === 1) {
          this.deadCode.types.push(`${relativePath}: ${typeName}`);
        }
      }
    }
  }

  async analyze() {
    console.log('🔍 INICIANDO ANÁLISIS DE CÓDIGO MUERTO\n');
    console.log(`📂 Analizando directorio: ${this.srcDir}`);
    
    // 1. Obtener todos los archivos
    this.allFiles = this.getAllFiles();
    console.log(`📄 Total archivos encontrados: ${this.allFiles.length}\n`);
    
    // 2. Leer contenido de todos los archivos
    this.fileContents = new Map();
    for (const filePath of this.allFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        this.fileContents.set(filePath, content);
        
        // Analizar imports y exports
        this.analyzeImports(filePath, content);
        this.analyzeExports(filePath, content);
      } catch (error) {
        console.warn(`⚠️ No se pudo leer: ${filePath}`);
      }
    }
    
    console.log('📊 Analizando patrones de uso...\n');
    
    // 3. Ejecutar análisis
    this.analyzeUnusedFiles();
    this.analyzeUnusedExports();
    this.analyzeUnusedImports();
    this.analyzeUnusedVariables();
    this.analyzeUnusedTypes();
    
    // 4. Generar reporte
    this.generateReport();
  }

  generateReport() {
    console.log('=' .repeat(60));
    console.log('📋 REPORTE DE CÓDIGO MUERTO - EmotioXV2 Frontend');
    console.log('=' .repeat(60));
    
    // Archivos sin uso
    if (this.deadCode.files.length > 0) {
      this.log('ARCHIVOS SIN USO', `${this.deadCode.files.length} archivos sin referencias`, this.deadCode.files.slice(0, 20));
      if (this.deadCode.files.length > 20) {
        console.log(`   ... y ${this.deadCode.files.length - 20} más\n`);
      }
    } else {
      console.log('✅ ARCHIVOS SIN USO: No se encontraron archivos sin referencias\n');
    }
    
    // Funciones/Componentes sin uso
    if (this.deadCode.functions.length > 0) {
      this.log('EXPORTS SIN USO', `${this.deadCode.functions.length} funciones/componentes sin referencias`, this.deadCode.functions.slice(0, 15));
      if (this.deadCode.functions.length > 15) {
        console.log(`   ... y ${this.deadCode.functions.length - 15} más\n`);
      }
    } else {
      console.log('✅ EXPORTS SIN USO: No se encontraron exports sin referencias\n');
    }
    
    // Imports sin uso
    if (this.deadCode.imports.length > 0) {
      this.log('IMPORTS SIN USO', `${this.deadCode.imports.length} imports no utilizados`, this.deadCode.imports.slice(0, 15));
      if (this.deadCode.imports.length > 15) {
        console.log(`   ... y ${this.deadCode.imports.length - 15} más\n`);
      }
    } else {
      console.log('✅ IMPORTS SIN USO: No se encontraron imports sin uso\n');
    }
    
    // Variables sin uso
    if (this.deadCode.variables.length > 0) {
      this.log('VARIABLES SIN USO', `${this.deadCode.variables.length} variables no utilizadas`, this.deadCode.variables.slice(0, 10));
      if (this.deadCode.variables.length > 10) {
        console.log(`   ... y ${this.deadCode.variables.length - 10} más\n`);
      }
    } else {
      console.log('✅ VARIABLES SIN USO: No se encontraron variables sin uso\n');
    }
    
    // Tipos sin uso
    if (this.deadCode.types.length > 0) {
      this.log('TIPOS SIN USO', `${this.deadCode.types.length} tipos/interfaces sin referencias`, this.deadCode.types.slice(0, 10));
      if (this.deadCode.types.length > 10) {
        console.log(`   ... y ${this.deadCode.types.length - 10} más\n`);
      }
    } else {
      console.log('✅ TIPOS SIN USO: No se encontraron tipos sin uso\n');
    }
    
    // Resumen final
    const totalIssues = this.deadCode.files.length + 
                       this.deadCode.functions.length + 
                       this.deadCode.imports.length + 
                       this.deadCode.variables.length + 
                       this.deadCode.types.length;
    
    console.log('=' .repeat(60));
    console.log(`📊 RESUMEN TOTAL: ${totalIssues} elementos de código muerto encontrados`);
    console.log(`📁 Archivos sin uso: ${this.deadCode.files.length}`);
    console.log(`🔧 Exports sin uso: ${this.deadCode.functions.length}`);
    console.log(`📦 Imports sin uso: ${this.deadCode.imports.length}`);
    console.log(`🔤 Variables sin uso: ${this.deadCode.variables.length}`);
    console.log(`🏷️ Tipos sin uso: ${this.deadCode.types.length}`);
    console.log('=' .repeat(60));
    
    if (totalIssues === 0) {
      console.log('🎉 ¡EXCELENTE! No se encontró código muerto significativo');
    } else if (totalIssues < 20) {
      console.log('✨ BUEN ESTADO: Poco código muerto, fácil de limpiar');
    } else if (totalIssues < 50) {
      console.log('⚠️ MODERADO: Cantidad razonable de código muerto');
    } else {
      console.log('🚨 ALTA: Considerable cantidad de código muerto para limpiar');
    }
    
    // Guardar reporte detallado
    const reportPath = './dead-code-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.deadCode, null, 2));
    console.log(`\n💾 Reporte detallado guardado en: ${reportPath}`);
  }
}

// Ejecutar análisis
const analyzer = new DeadCodeAnalyzer();
analyzer.analyze().catch(console.error);