const fs = require('fs');
const targetFile = 'views/index.ejs';

try {
    const content = fs.readFileSync(targetFile, 'utf8');
    
    // Key "Action" patterns to look for
    const patterns = {
        fetching: /(async\s+function\s+[a-zA-Z0-9_]*fetch[a-zA-Z0-9_]*|async\s+function\s+load[a-zA-Z0-9_]*)/gi,
        rowBuilding: /function\s+[a-zA-Z0-9_]*Row[a-zA-Z0-9_]*/gi,
        gridInit: /(new\s+agGrid\.Grid|createGrid|gridOptions)/gi,
        domInjection: /(\.innerHTML\s*=|\.appendChild\(|document\.getElementById)/gi
    };

    console.log('\n==================================================');
    console.log(`   LOGIC TRACE: ${targetFile}`);
    console.log('==================================================');

    // Find all function declarations to see what's available
    const functionNames = content.match(/(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(/g) || [];
    console.log(`Found ${functionNames.length} total functions.\n`);

    console.log('CANDIDATES FOR TABLE BUILDING:');
    functionNames.forEach(fn => {
        const name = fn.replace(/(async\s+)?function\s+/, '').replace('(', '');
        if (name.toLowerCase().includes('row') || 
            name.toLowerCase().includes('table') || 
            name.toLowerCase().includes('grid') || 
            name.toLowerCase().includes('render') ||
            name.toLowerCase().includes('load')) {
            console.log(` -> ${name}`);
        }
    });

    console.log('\nAG GRID SPECIFIC REFERENCES:');
    const gridRefs = content.match(/ID:\s*['"][a-zA-Z0-9_-]+['"]|container|gridDiv/gi) || [];
    if (gridRefs.length > 0) {
        console.log(Array.from(new Set(gridRefs)).slice(0, 10).join(' | '));
    } else {
        console.log('No obvious AG Grid variable references found.');
    }
    console.log('==================================================\n');

} catch (err) {
    console.error('Error:', err.message);
}