const fs = require('fs');

const targetFile = 'views/index.ejs';

try {
    const content = fs.readFileSync(targetFile, 'utf8');
    const lines = content.split('\n');
    
    // Regex to capture function names from different declaration styles
    const funcRegex = /(?:async\s+)?function\s+([a-zA-Z0-9_]+)|(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\(.*?\)\s*=>/g;
    
    const functionList = [];
    const counts = {};

    lines.forEach((line, index) => {
        let match;
        while ((match = funcRegex.exec(line)) !== null) {
            const name = match[1] || match[2];
            if (name) {
                functionList.push({ name, line: index + 1 });
                counts[name] = (counts[name] || 0) + 1;
            }
        }
    });

    const duplicates = Object.keys(counts).filter(name => counts[name] > 1);

    console.log('\n==================================================');
    console.log(`   DUPLICATE FUNCTION REPORT: ${targetFile}`);
    console.log('==================================================');

    if (duplicates.length === 0) {
        console.log('✅ No duplicate function names found!');
    } else {
        console.log(`Found ${duplicates.length} functions with multiple definitions:\n`);
        
        duplicates.forEach(name => {
            const occurrences = functionList
                .filter(f => f.name === name)
                .map(f => `Line ${f.line}`);
            
            console.log(`❌ "${name}"`);
            console.log(`   Occurrences (${counts[name]}): ${occurrences.join(', ')}`);
            console.log('   ----------------------------------------------');
        });
    }

    console.log(`\nTotal unique functions: ${Object.keys(counts).length}`);
    console.log(`Total function declarations: ${functionList.length}`);
    console.log('==================================================\n');

} catch (err) {
    console.error('Error:', err.message);
}