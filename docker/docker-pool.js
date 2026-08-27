// docker/docker-pool.js
// ===================================================================
// DOCKER CONTAINER POOL MANAGEMENT
// Manages isolated containers for cybersecurity students
// ===================================================================

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Container configuration
const CONFIG = {
  image: 'EduAI-cyber-lab:latest',
  maxContainers: 50,
  containerTimeout: 30 * 60 * 1000, // 30 minutes
  cpuLimit: '0.5', // 50% of one CPU
  memoryLimit: '256m',
  networkMode: 'none', // Isolated network by default
};

// Container pool
const containers = new Map(); // userId -> { containerId, lastActivity, timeout }

// ----------------------------------------------------------------
// CHECK IF DOCKER IS AVAILABLE
// ----------------------------------------------------------------
async function isDockerAvailable() {
  return new Promise((resolve) => {
    exec('docker --version', (err, stdout) => {
      if (err) {
        console.warn('Docker not available:', err.message);
        resolve(false);
      } else {
        console.log('Docker available:', stdout.trim());
        resolve(true);
      }
    });
  });
}

// ----------------------------------------------------------------
// BUILD CYBER LAB IMAGE
// ----------------------------------------------------------------
async function buildImage() {
  const dockerfilePath = path.join(__dirname, 'Dockerfile');
  
  if (!fs.existsSync(dockerfilePath)) {
    throw new Error('Dockerfile not found at ' + dockerfilePath);
  }

  return new Promise((resolve, reject) => {
    console.log('Building EduAI Cyber Lab image...');
    
    const build = spawn('docker', [
      'build',
      '-t', CONFIG.image,
      '-f', dockerfilePath,
      __dirname
    ]);

    build.stdout.on('data', (data) => {
      console.log(`[docker build] ${data.toString().trim()}`);
    });

    build.stderr.on('data', (data) => {
      console.error(`[docker build] ${data.toString().trim()}`);
    });

    build.on('close', (code) => {
      if (code === 0) {
        console.log('Docker image built successfully');
        resolve(true);
      } else {
        reject(new Error(`Docker build failed with code ${code}`));
      }
    });
  });
}

// ----------------------------------------------------------------
// CREATE CONTAINER FOR USER
// ----------------------------------------------------------------
async function createContainer(userId, options = {}) {
  const containerName = `EduAI-${userId}-${Date.now()}`;
  
  const args = [
    'create',
    '--name', containerName,
    '--hostname', 'cyberlab',
    '--user', 'student',
    '--workdir', '/home/student/workspace',
    '--cpu-quota', '50000', // 50% CPU
    '--memory', CONFIG.memoryLimit,
    '--memory-swap', CONFIG.memoryLimit,
    '--network', options.network || CONFIG.networkMode,
    '--read-only=false',
    '--tmpfs', '/tmp:size=10M,mode=1777',
    '-e', 'TERM=xterm-256color',
    '-e', 'HOME=/home/student',
    CONFIG.image,
    '/bin/bash'
  ];

  return new Promise((resolve, reject) => {
    exec(`docker ${args.join(' ')}`, (err, stdout, stderr) => {
      if (err) {
        console.error('Container creation failed:', stderr);
        reject(new Error(`Failed to create container: ${stderr}`));
        return;
      }

      const containerId = stdout.trim();
      console.log(`Created container ${containerId} for user ${userId}`);

      // Start the container
      exec(`docker start ${containerId}`, (startErr) => {
        if (startErr) {
          reject(new Error(`Failed to start container: ${startErr.message}`));
          return;
        }

        // Set up timeout cleanup
        const timeout = setTimeout(() => {
          destroyContainer(containerId);
        }, CONFIG.containerTimeout);

        containers.set(userId, {
          containerId,
          containerName,
          lastActivity: Date.now(),
          timeout
        });

        resolve(containerId);
      });
    });
  });
}

// ----------------------------------------------------------------
// GET OR CREATE CONTAINER FOR USER
// ----------------------------------------------------------------
async function getOrCreateContainer(userId) {
  const existing = containers.get(userId);

  if (existing) {
    // Update last activity and reset timeout
    existing.lastActivity = Date.now();
    clearTimeout(existing.timeout);
    existing.timeout = setTimeout(() => {
      destroyContainer(existing.containerId);
    }, CONFIG.containerTimeout);

    // Check if container is still running
    const isRunning = await checkContainerRunning(existing.containerId);
    if (isRunning) {
      return existing.containerId;
    }
    // Container died, create new one
    containers.delete(userId);
  }

  return createContainer(userId);
}

// ----------------------------------------------------------------
// EXECUTE COMMAND IN CONTAINER
// ----------------------------------------------------------------
async function executeInContainer(containerId, command, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Command timeout'));
    }, timeout);

    const args = [
      'exec',
      '-u', 'student',
      '-i',
      containerId,
      '/bin/bash', '-c', command
    ];

    exec(`docker ${args.join(' ')}`, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      clearTimeout(timeoutId);

      if (err && !stdout) {
        resolve({ stdout: '', stderr: stderr || err.message, exitCode: err.code || 1 });
      } else {
        resolve({
          stdout: stdout || '',
          stderr: stderr || '',
          exitCode: err ? err.code : 0
        });
      }
    });
  });
}

// ----------------------------------------------------------------
// CHECK IF CONTAINER IS RUNNING
// ----------------------------------------------------------------
async function checkContainerRunning(containerId) {
  return new Promise((resolve) => {
    exec(`docker inspect -f '{{.State.Running}}' ${containerId}`, (err, stdout) => {
      if (err) {
        resolve(false);
      } else {
        resolve(stdout.trim() === 'true');
      }
    });
  });
}

// ----------------------------------------------------------------
// DESTROY CONTAINER
// ----------------------------------------------------------------
async function destroyContainer(containerId) {
  return new Promise((resolve) => {
    exec(`docker rm -f ${containerId}`, (err, stdout, stderr) => {
      if (err) {
        console.warn('Container destruction warning:', stderr);
      } else {
        console.log(`Destroyed container ${containerId}`);
      }

      // Remove from pool
      for (const [userId, data] of containers.entries()) {
        if (data.containerId === containerId) {
          clearTimeout(data.timeout);
          containers.delete(userId);
          break;
        }
      }

      resolve(!err);
    });
  });
}

// ----------------------------------------------------------------
// DESTROY ALL CONTAINERS
// ----------------------------------------------------------------
async function destroyAllContainers() {
  const promises = [];
  for (const [userId, data] of containers.entries()) {
    clearTimeout(data.timeout);
    promises.push(destroyContainer(data.containerId));
  }
  await Promise.all(promises);
  containers.clear();
  console.log('All containers destroyed');
}

// ----------------------------------------------------------------
// COPY FILES TO CONTAINER
// ----------------------------------------------------------------
async function copyFilesToContainer(containerId, files) {
  // Create temp directory with files
  const tmpDir = path.join(require('os').tmpdir(), `EduAI-${containerId}`);
  
  try {
    fs.mkdirSync(tmpDir, { recursive: true });
    
    for (const file of files) {
      const filePath = path.join(tmpDir, file.name);
      fs.writeFileSync(filePath, file.content || '');
    }

    return new Promise((resolve, reject) => {
      exec(`docker cp "${tmpDir}/." ${containerId}:/home/student/workspace/`, (err, stdout, stderr) => {
        // Cleanup temp dir
        fs.rmSync(tmpDir, { recursive: true, force: true });
        
        if (err) {
          reject(new Error(`Failed to copy files: ${stderr}`));
        } else {
          resolve(true);
        }
      });
    });
  } catch (err) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw err;
  }
}

// ----------------------------------------------------------------
// GET CONTAINER STATS
// ----------------------------------------------------------------
async function getContainerStats(containerId) {
  return new Promise((resolve) => {
    exec(`docker stats ${containerId} --no-stream --format "{{json .}}"`, (err, stdout) => {
      if (err) {
        resolve(null);
      } else {
        try {
          resolve(JSON.parse(stdout.trim()));
        } catch {
          resolve(null);
        }
      }
    });
  });
}

// ----------------------------------------------------------------
// LIST ACTIVE CONTAINERS
// ----------------------------------------------------------------
function listContainers() {
  const list = [];
  for (const [userId, data] of containers.entries()) {
    list.push({
      userId,
      containerId: data.containerId,
      lastActivity: data.lastActivity,
      age: Date.now() - data.lastActivity
    });
  }
  return list;
}

// ----------------------------------------------------------------
// CLEANUP IDLE CONTAINERS (run periodically)
// ----------------------------------------------------------------
async function cleanupIdleContainers(maxIdleMs = 10 * 60 * 1000) {
  const now = Date.now();
  const toRemove = [];

  for (const [userId, data] of containers.entries()) {
    if (now - data.lastActivity > maxIdleMs) {
      toRemove.push({ userId, containerId: data.containerId });
    }
  }

  for (const { userId, containerId } of toRemove) {
    await destroyContainer(containerId);
    console.log(`Cleaned up idle container for user ${userId}`);
  }

  return toRemove.length;
}

// ----------------------------------------------------------------
// INITIALIZE
// ----------------------------------------------------------------
async function initialize() {
  const available = await isDockerAvailable();
  
  if (!available) {
    console.warn('Docker not available - cybersecurity terminal will use fallback mode');
    return false;
  }

  // Check if image exists
  const imageExists = await new Promise((resolve) => {
    exec(`docker images -q ${CONFIG.image}`, (err, stdout) => {
      resolve(!!stdout.trim());
    });
  });

  if (!imageExists) {
    try {
      await buildImage();
    } catch (err) {
      console.error('Failed to build Docker image:', err.message);
      return false;
    }
  }

  // Cleanup on process exit
  process.on('SIGINT', async () => {
    console.log('Cleaning up Docker containers...');
    await destroyAllContainers();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Cleaning up Docker containers...');
    await destroyAllContainers();
    process.exit(0);
  });

  // Periodic cleanup
  setInterval(() => {
    cleanupIdleContainers();
  }, 5 * 60 * 1000); // Every 5 minutes

  return true;
}

// ----------------------------------------------------------------
// CLEANUP ALL CONTAINERS (alias for destroyAllContainers)
// ----------------------------------------------------------------
async function cleanup() {
  await destroyAllContainers();
}

// ----------------------------------------------------------------
// EXPORTS
// ----------------------------------------------------------------
module.exports = {
  isDockerAvailable,
  buildImage,
  createContainer,
  getOrCreateContainer,
  executeInContainer,
  checkContainerRunning,
  destroyContainer,
  destroyAllContainers,
  cleanup,
  copyFilesToContainer,
  getContainerStats,
  listContainers,
  cleanupIdleContainers,
  initialize,
  CONFIG
};
