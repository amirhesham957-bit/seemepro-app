// scripts/fix-import-case.js
// This script scans all source files and corrects the case of relative import paths
// to match the actual file names on disk (Windows is case‑insensitive, but Vite/Node on CI is case‑sensitive).

const fs = require('fs');
const path = require('path');

// extensions to consider when resolving imports
const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.css', '.svg', '.png', '.jpg', '.json'];

function getAllSourceFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllSourceFiles(fullPath));
    } else if (entry.isFile()) {
      if (fullPath.match(/\.(ts|tsx|js|jsx)$/)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function resolveActualPath(importPath, basedir) {
  const baseResolved = path.resolve(basedir, importPath);
  // try each extension and also index files inside a folder
  for (const ext of extensions) {
    const candidate = baseResolved + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
    const indexCandidate = path.join(baseResolved, 'index' + ext);
    if (fs.existsSync(indexCandidate) && fs.statSync(indexCandidate).isFile()) {
      return indexCandidate;
    }
  }
  return null;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /import\s+(?:[^'";]+\s+from\s+)?['"]([^'""]+)['"]/g;
  let match;
  let updated = false;
  const dir = path.dirname(filePath);

  while ((match = importRegex.exec(content)) !== null) {
    const originalImport = match[1];
    if (!originalImport.startsWith('.')) continue; // ignore package imports
    const actualPath = resolveActualPath(originalImport, dir);
    if (!actualPath) continue; // cannot resolve, skip
    // Build the correct import string (POSIX style, without extension if original didn't have one)
    let relative = path.relative(dir, actualPath);
    // Convert Windows separators to POSIX
    relative = relative.split(path.sep).join('/');
    // Remove leading "../" or "./" if not present
    if (!relative.startsWith('.')) relative = './' + relative;
    // Remove extension when the original import had none
    const hasExt = path.extname(originalImport) !== '';
    if (!hasExt) {
      relative = relative.replace(/\.[jt]sx?$/,'');
    }
    if (relative !== originalImport) {
      // Replace the import path in the source text
      const escaped = originalImport.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const replaceRegex = new RegExp(`(['"])${escaped}\\1`);
      content = content.replace(replaceRegex, `$1${relative}$1`);
      updated = true;
      console.log(`Fixed import in ${filePath}: ${originalImport} → ${relative}`);
    }
  }

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  const files = getAllSourceFiles(srcDir);
  files.forEach(fixFile);
}

main();
