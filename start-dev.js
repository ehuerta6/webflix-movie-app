const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Determine command prefix based on OS
const isWindows = os.platform() === 'win32';

// Define paths
const frontendPath = path.join(__dirname, 'frontend');

// Function to start a process
function startProcess(command, args, cwd, name) {
  console.log(`Starting ${name}...`);

  const childProcess = spawn(command, args, {
    cwd,
    shell: isWindows ? true : '/bin/bash',
    stdio: 'pipe',
  });

  childProcess.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });

  childProcess.stderr.on('data', (data) => {
    console.error(`[${name} ERROR] ${data.toString().trim()}`);
  });

  childProcess.on('close', (code) => {
    console.log(`${name} process exited with code ${code}`);
  });

  return childProcess;
}

// Start frontend
console.log('Starting development server...\n');

const frontendProcess = startProcess(
  isWindows ? 'npm.cmd' : 'npm',
  ['run', 'dev'],
  frontendPath,
  'Frontend'
);

// Handle termination
process.on('SIGINT', () => {
  console.log('Shutting down development server...');
  frontendProcess.kill();
  process.exit(0);
});

console.log('\nDevelopment server started!');
console.log('- Frontend: http://localhost:5173');
console.log('\nPress Ctrl+C to stop the server.');
