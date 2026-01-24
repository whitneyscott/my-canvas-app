const fs = require('fs');

const targetFile = 'views/index.ejs';

try {
    const content = fs.readFileSync(targetFile, 'utf8');
    
    // Regex to find content inside style="..."
    const styleRegex = /style="([^"]*)"/g;
    const styleCounts = {};
    let totalInlineStyles = 0;

    let match;
    while ((match = styleRegex.exec(content)) !== null) {
        const styleContent = match[1].trim();
        if (styleContent) {
            styleCounts[styleContent] = (styleCounts[styleContent] || 0) + 1;
            totalInlineStyles++;
        }
    }

    // Sort styles by frequency (most used at the top)
    const sortedStyles = Object.entries(styleCounts)
        .sort((a, b) => b[1] - a[1]);

    console.log('\n==================================================');
    console.log(`   INLINE STYLE REPORT: ${targetFile}`);
    console.log('==================================================');
    console.log(`Total inline style attributes found: ${totalInlineStyles}`);
    console.log(`Unique style strings: ${sortedStyles.length}\n`);

    console.log('TOP RECURRING STYLES:');
    console.log('(Frequency | Style Content)');
    console.log('--------------------------------------------------');

    sortedStyles.forEach(([style, count]) => {
        if (count > 1) {
            console.log(`${count.toString().padEnd(10)} | ${style}`);
        }
    });

    console.log('\nSINGLE-USE STYLES (Consider moving these too):');
    sortedStyles.forEach(([style, count]) => {
        if (count === 1) {
            console.log(`1          | ${style}`);
        }
    });
    console.log('==================================================\n');

} catch (err) {
    console.error('Error:', err.message);
}