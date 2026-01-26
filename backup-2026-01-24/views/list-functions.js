const fs = require('fs');

const targetFile = 'index.ejs';

try {
    const content = fs.readFileSync(targetFile, 'utf8');
    const lines = content.split('\n');
    
    // Regex to capture function names from different declaration styles
    // Match: function name(), async function name(), const name = () =>, const name = async () =>
    const funcRegex = /(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(|(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?(?:function\s*\(|\([^)]*\)\s*=>)/g;
    
    const functionList = [];
    const counts = {};

    lines.forEach((line, index) => {
        let match;
        while ((match = funcRegex.exec(line)) !== null) {
            const name = match[1] || match[2];
            if (name) {
                if (!functionList.find(f => f.name === name)) {
                    functionList.push({ name, line: index + 1 });
                }
                counts[name] = (counts[name] || 0) + 1;
            }
        }
    });

    // Sort alphabetically
    functionList.sort((a, b) => a.name.localeCompare(b.name));

    console.log('\n==================================================');
    console.log(`   FUNCTION LIST: ${targetFile}`);
    console.log('==================================================\n');

    functionList.forEach(func => {
        const duplicate = counts[func.name] > 1 ? ' ⚠️  DUPLICATE' : '';
        console.log(`${func.name}${duplicate}`);
    });

    console.log('\n==================================================');
    console.log(`Total unique functions: ${Object.keys(counts).length}`);
    console.log(`Total function declarations: ${Object.values(counts).reduce((a, b) => a + b, 0)}`);
    
    if (Object.keys(counts).some(name => counts[name] > 1)) {
        console.log('\n⚠️  Warning: Duplicate functions detected!');
    }
    
    console.log('==================================================\n');

} catch (err) {
    console.error('Error:', err.message);
}