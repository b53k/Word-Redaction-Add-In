#!/usr/bin/env node

/**
 * Script to generate SSL certificates for local development
 * Generates cert.pem and key.pem if they don't exist
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const certPath = path.join(__dirname, '..', 'cert.pem');
const keyPath = path.join(__dirname, '..', 'key.pem');

// Check if certificates already exist
const certExists = fs.existsSync(certPath);
const keyExists = fs.existsSync(keyPath);

if (certExists && keyExists) {
  console.log('✓ SSL certificates already exist');
  process.exit(0);
}

console.log('Generating SSL certificates for local development...');

try {
  // Generate self-signed certificate valid for 365 days
  const opensslCommand = [
    'openssl req -x509',
    '-newkey rsa:2048',
    '-keyout ' + keyPath,
    '-out ' + certPath,
    '-days 365',
    '-nodes',
    '-subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"'
  ].join(' ');

  execSync(opensslCommand, { stdio: 'inherit' });
  console.log('✓ SSL certificates generated successfully');
  console.log('  Certificate: ' + certPath);
  console.log('  Key: ' + keyPath);
} catch (error) {
  console.error('✗ Error generating SSL certificates:', error.message);
  console.error('  Make sure OpenSSL is installed on your system');
  process.exit(1);
}

