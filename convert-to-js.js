import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function removeTypeScript(content) {
  // Remove type imports
  content = content.replace(/import\s+type\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?\s*/g, '');
  content = content.replace(/import\s+\{\s*type\s+([^}]+)\}\s+from/g, 'import {$1} from');
  
  // Remove type annotations from parameters
  content = content.replace(/(\w+)\s*:\s*[A-Za-z<>[\]|&\s'"]+(\s*[,)])/g, '$1$2');
  
  // Remove return type annotations
  content = content.replace(/\)\s*:\s*[A-Za-z<>[\]|&\s'"]+\s*{/g, ') {');
  content = content.replace(/\)\s*:\s*[A-Za-z<>[\]|&\s'"]+\s*=>/g, ') =>');
  
  // Remove variable type annotations
  content = content.replace(/:\s*[A-Za-z<>[\]|&\s'"]+(\s*=)/g, '$1');
  
  // Remove generics from JSX
  content = content.replace(/<([A-Z]\w+)<[^>]+>/g, '<$1>');
  
  // Remove type assertions
  content = content.replace(/as\s+[A-Za-z<>[\]|&\s'"]+/g, '');
  content = content.replace(/document\.getElementById\([^)]+\)!/g, 'document.getElementById($1)');
  
  // Remove interfaces
  content = content.replace(/interface\s+\w+\s*{[^}]*}\s*/g, '');
  content = content.replace(/export\s+interface\s+\w+\s*{[^}]*}\s*/g, '');
  
  // Remove type definitions
  content = content.replace(/type\s+\w+\s*=\s*[^;]+;?\s*/g, '');
  content = content.replace(/export\s+type\s+\w+\s*=\s*[^;]+;?\s*/g, '');
  
  // Remove satisfies
  content = content.replace(/\s+satisfies\s+\w+/g, '');
  
  // Update import extensions
  content = content.replace(/from\s+['"]([^'"]+)\.tsx['"]/g, 'from \'$1.jsx\'');
  content = content.replace(/from\s+['"]([^'"]+)\.ts['"]/g, 'from \'$1.js\'');
  
  return content;
}

function convertFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    content = removeTypeScript(content);
    
    const newPath = filePath.replace(/\.tsx$/, '.jsx').replace(/\.ts$/, '.js');
    fs.writeFileSync(newPath, content);
    console.log(`Converted: ${filePath} -> ${newPath}`);
    return newPath;
  } catch (error) {
    console.error(`Error converting ${filePath}:`, error.message);
    return null;
  }
}

function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Skip vite.config.ts and tailwind.config.ts as we already converted them
      if (file !== 'vite.config.ts' && file !== 'tailwind.config.ts') {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// Convert all files
const tsFiles = getAllTsFiles(__dirname);
console.log(`Found ${tsFiles.length} TypeScript files to convert`);

tsFiles.forEach(file => convertFile(file));

console.log('Conversion complete!');
