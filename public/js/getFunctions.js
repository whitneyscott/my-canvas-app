const fs = require('fs');

const fileContent = fs.readFileSync('main.js', 'utf8');
const functionRegex = /^(?:async\s+)?function\s+([a-zA-Z0-9_]+)|(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/gm;

let match;
const functions = [];

while ((match = functionRegex.exec(fileContent)) !== null) {
  functions.push(match[1] || match[2]);
}

console.log("### Function List for main.js");
console.log(functions.join('\n'));