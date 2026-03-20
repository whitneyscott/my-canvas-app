const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

function toWslPath(p) {
  return p.replace(/^([a-zA-Z]):/, (_, d) => `/mnt/${d.toLowerCase()}`).replace(/\\/g, '/');
}

function dockerUp() {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === 'win32';
    const cwd = path.resolve(__dirname, '..', 'services', 'accreditation-lookup');
    let proc;
    if (isWin) {
      proc = spawn('wsl', ['-e', 'bash', '-c', `cd "${toWslPath(cwd)}" && docker compose up --build -d`], { stdio: 'inherit' });
    } else {
      proc = spawn('docker', ['compose', 'up', '--build', '-d'], { cwd, stdio: 'inherit' });
    }
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`docker compose exited ${code}`))));
  });
}

function checkHealth() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/health', { timeout: 2000 }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(res.statusCode === 200));
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function waitForService(maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkHealth()) return true;
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  console.log('[Start] Database + services...');
  try {
    await dockerUp();
  } catch (e) {
    console.warn('[Start] Docker up failed (may already be running):', e.message);
  }
  console.log('[Start] Waiting for services...');
  if (!(await waitForService())) {
    console.error('[Start] Services did not become ready.');
  } else {
    console.log('[Start] Services ready.');
  }
  console.log('[Start] Main app...');
  const nest = spawn('npx', ['nest', 'start', '--watch'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
  });
  nest.on('close', (code) => process.exit(code || 0));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
