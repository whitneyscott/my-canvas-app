#!/usr/bin/env node
const { generateKeyPairSync } = require('crypto');
const { writeFileSync } = require('fs');
const path = require('path');

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const outDir = path.join(__dirname, '..');
writeFileSync(path.join(outDir, 'private-key.pem'), privateKey);
writeFileSync(path.join(outDir, 'public-key.pem'), publicKey);
console.log('Wrote private-key.pem and public-key.pem');
console.log('Add private-key.pem to .gitignore and configure LTI_PRIVATE_KEY_PATH if needed.');
