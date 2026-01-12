const fs = require('fs');
const path = require('path');

function findDuplicateFunctionNames(sourceCode) {
  const functionRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
  const seen = new Set();
  const duplicates = new Set();

  let match;
  while ((match = functionRegex.exec(sourceCode)) !== null) {
    const name = match[1];
    if (seen.has(name)) {
      duplicates.add(name);
    } else {
      seen.add(name);
    }
  }

  return Array.from(duplicates);
}

const targetFile = process.argv[2];
if (!targetFile) {
  console.error('Usage: node tools/check-duplicates.js <file.js>');
  process.exit(1);
}

const absolutePath = path.resolve(process.cwd(), targetFile);
const sourceCode = fs.readFileSync(absolutePath, 'utf8');

const duplicates = findDuplicateFunctionNames(sourceCode);

if (duplicates.length === 0) {
  console.log('No duplicate function names found.');
} else {
  console.log('Duplicate function names found:');
  duplicates.forEach(name => console.log(`- ${name}`));
}
