const fs = require('fs');

const cssFile = 'public/css/style.css';

try {
    const content = fs.readFileSync(cssFile, 'utf8');
    
    // Regex to find class names (e.g., .my-class)
    const classRegex = /\.([a-zA-Z0-9_-]+)\s*\{/g;
    const classes = [];
    
    let match;
    while ((match = classRegex.exec(content)) !== null) {
        classes.push(match[1]);
    }

    console.log('\n==================================================');
    console.log(`   CSS AUDIT: ${cssFile}`);
    console.log('==================================================');
    console.log(`Total classes found: ${classes.length}`);
    console.log('--------------------------------------------------');
    console.log(classes.sort().join('\n'));
    console.log('==================================================\n');

} catch (err) {
    console.error('Error:', err.message);
}