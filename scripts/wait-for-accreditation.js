const http = require('http');
const maxAttempts = 30;
const intervalMs = 1000;

function check() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/health', { timeout: 2000 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function main() {
  for (let i = 0; i < maxAttempts; i++) {
    if (await check()) {
      console.log('[Accreditation] Service ready at http://localhost:3001');
      process.exit(0);
    }
    if (i > 0) process.stdout.write('.');
    await new Promise(r => setTimeout(r, intervalMs));
  }
  console.log('\n[Accreditation] Timeout waiting for service. Start it with: npm run accreditation:docker-up');
  process.exit(1);
}

main();
