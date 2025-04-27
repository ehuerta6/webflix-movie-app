const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Determine command prefix based on OS
const isWindows = os.platform() === 'win32';
const shellOption = isWindows ? true : '/bin/bash';

// Define paths
const frontendPath = path.join(__dirname, 'frontend');
const backendPath = path.join(__dirname, 'backend');

// Function to start a process
function startProcess(command, args, cwd, name) {
  console.log(`Starting ${name}...`);

  const childProcess = spawn(command, args, {
    cwd,
    shell: shellOption,
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

// Start backend server
console.log('Starting development servers...\n');

// Determine if we should activate venv first
const activateVenv = isWindows
  ? `${path.join(backendPath, 'venv', 'Scripts', 'activate')} &&`
  : `source ${path.join(backendPath, 'venv', 'bin', 'activate')} &&`;

// Start Flask backend
const backendCommand = isWindows ? 'cmd' : 'bash';
const backendArgs = isWindows
  ? ['/c', `${activateVenv} flask run`]
  : ['-c', `${activateVenv} flask run`];

const backendProcess = startProcess(
  backendCommand,
  backendArgs,
  backendPath,
  'Backend'
);

// Start frontend
const frontendProcess = startProcess(
  isWindows ? 'npm.cmd' : 'npm',
  ['run', 'dev'],
  frontendPath,
  'Frontend'
);

// Handle termination
process.on('SIGINT', () => {
  console.log('Shutting down development servers...');
  backendProcess.kill();
  frontendProcess.kill();
  process.exit(0);
});

console.log('\nDevelopment servers started!');
console.log('- Backend: http://localhost:5000');
console.log('- Frontend: http://localhost:5173');
console.log('\nPress Ctrl+C to stop both servers.');
