#!/usr/bin/env node

/**
 * Script to kill any process using port 3000
 * This ensures a clean start when running npm start
 */

const { execSync } = require('child_process');

const port = 3000;

try {
  // Find process using port 3000 (works on Linux/Mac)
  const pid = execSync(`lsof -ti:${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  
  if (pid) {
    console.log(`Killing process ${pid} on port ${port}...`);
    execSync(`kill ${pid}`, { stdio: 'inherit' });
    // Wait a moment for the port to be released
    execSync('sleep 1', { stdio: 'ignore' });
    console.log(`✓ Port ${port} is now free`);
  } else {
    console.log(`✓ Port ${port} is already free`);
  }
} catch (error) {
  // If lsof fails, port is likely free (or command not available)
  // On Windows, this script won't work, but that's okay - user can manually kill
  if (error.status !== 1) { // status 1 means no process found (which is fine)
    console.log(`Note: Could not check port ${port} (this is okay if port is free)`);
  }
}

