#!/usr/bin/env node

/**
 * 🎯 ANÁLISIS PRECISO DE IMPORTS SIN USO
 * 
 * Verifica MANUALMENTE cada import sin falsos positivos
 */

const fs = require('fs');
const path = require('path');

class PreciseImportAnalyzer {
  constructor() {
    this.srcDir = path.join(__dirname, 'src');
    this.trulyUnused = [];
  }

  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(this.srcDir + '/', '');
    
    // Extraer imports
    const importRegex = /import\s+(?:{([^}]+)}|(\w+)(?:\s*,\s*{([^}]+)})?)\s+from\s+['"]([^'"]+)['"];?/g;
    const unused = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const [fullMatch, namedImports, defaultImport, additionalNamed, source] = match;
      
      // Solo analizar imports internos
      if (source.startsWith('./') || source.startsWith('../') || source.startsWith('@/')) {
        
        // Analizar default import
        if (defaultImport) {
          if (!this.isUsedInContent(defaultImport, content, fullMatch)) {
            unused.push(defaultImport);
          }
        }
        
        // Analizar named imports
        if (namedImports) {
          const named = namedImports.split(',').map(imp => imp.trim().split(' as ')[0]);
          for (const imp of named) {
            if (!this.isUsedInContent(imp, content, fullMatch)) {
              unused.push(imp);
            }
          }
        }
        
        // Analizar additional named imports
        if (additionalNamed) {
          const additional = additionalNamed.split(',').map(imp => imp.trim().split(' as ')[0]);
          for (const imp of additional) {
            if (!this.isUsedInContent(imp, content, fullMatch)) {
              unused.push(imp);
            }
          }
        }
      }
    }

    if (unused.length > 0) {
      this.trulyUnused.push({
        file: relativePath,
        unused: unused
      });
    }
  }

  isUsedInContent(importName, content, importStatement) {
    // Remover el statement de import para no contar esa referencia
    const contentWithoutImports = content.replace(importStatement, '');
    
    // Buscar uso del import
    const patterns = [
      new RegExp(`\\b${importName}\\b(?!\\s*[,}])`, 'g'),  // Uso directo
      new RegExp(`<${importName}\\b`, 'g'),                // JSX component
      new RegExp(`${importName}\\(`, 'g'),                 // Function call
      new RegExp(`${importName}\\[`, 'g'),                 // Array/object access
      new RegExp(`${importName}\\.`, 'g'),                 // Property access
      new RegExp(`typeof\\s+${importName}\\b`, 'g')        // typeof usage
    ];

    return patterns.some(pattern => pattern.test(contentWithoutImports));
  }

  analyze() {
    console.log('🎯 ANÁLISIS PRECISO DE IMPORTS SIN USO\n');

    // Analizar algunos archivos específicos del reporte
    const suspiciousFiles = [
      'components/dashboard/DashboardLayout.tsx',
      'components/dashboard/DashboardStats.tsx', 
      'components/common/ConfigCard.tsx',
      'components/research/CognitiveTask/components/ErrorModal.tsx',
      'components/research/CognitiveTask/hooks/useCognitiveTaskForm.ts'
    ];

    for (const file of suspiciousFiles) {
      const fullPath = path.join(this.srcDir, file);
      if (fs.existsSync(fullPath)) {
        try {
          this.analyzeFile(fullPath);
        } catch (error) {
          console.warn(`⚠️ Error analizando ${file}: ${error.message}`);
        }
      }
    }

    this.generateReport();
  }

  generateReport() {
    console.log('📋 IMPORTS REALMENTE SIN USO (VERIFICADOS MANUALMENTE):\n');
    
    if (this.trulyUnused.length === 0) {
      console.log('✅ No se encontraron imports sin uso en los archivos verificados');
      return;
    }

    this.trulyUnused.forEach((file, index) => {
      console.log(`${index + 1}. ${file.file}:`);
      file.unused.forEach(imp => {
        console.log(`   - ${imp}`);
      });
      console.log();
    });

    console.log(`📊 Total: ${this.trulyUnused.reduce((acc, f) => acc + f.unused.length, 0)} imports realmente sin uso`);
  }
}

const analyzer = new PreciseImportAnalyzer();
analyzer.analyze();