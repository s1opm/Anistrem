#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

const log = (msg) => console.log(`\x1b[36m✓\x1b[0m ${msg}`);
const warn = (msg) => console.log(`\x1b[33m⚠\x1b[0m ${msg}`);
const err = (msg) => console.log(`\x1b[31m✗\x1b[0m ${msg}`);

function run(cmd, cwd) {
  try {
    execSync(cmd, { cwd, stdio: 'pipe', env: { ...process.env, FORCE_COLOR: '0' } });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('\n\x1b[1m🎬 AniStrem Setup\x1b[0m\n');
  console.log('This will set up the project for you.\n');

  // Check Node.js
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1));
  if (major < 18) {
    err(`Node.js 18+ required (found ${nodeVersion})`);
    process.exit(1);
  }
  log(`Node.js ${nodeVersion}`);

  // Check npm
  if (!run('npm --version')) {
    err('npm not found');
    process.exit(1);
  }
  log('npm available');

  // Check MongoDB
  const mongod = run('mongod --version');
  const mongosh = run('mongosh --version') || run('mongo --version');
  if (mongod && mongosh) {
    log('MongoDB detected locally');
  } else {
    warn('MongoDB not found locally - you\'ll need a MongoDB URI (e.g., MongoDB Atlas)');
  }

  console.log('\n\x1b[1m📦 Installing dependencies...\x1b[0m\n');

  // Backend deps
  log('Installing backend dependencies...');
  const backendOk = run('npm install', resolve(root, 'backend'));
  if (!backendOk) { err('Backend install failed'); process.exit(1); }
  log('Backend dependencies installed');

  // Frontend deps
  log('Installing frontend dependencies...');
  const frontendOk = run('npm install', resolve(root, 'frontend'));
  if (!frontendOk) { err('Frontend install failed'); process.exit(1); }
  log('Frontend dependencies installed');

  // Check FFmpeg
  const ffmpeg = run('ffmpeg -version');
  if (ffmpeg) {
    log('FFmpeg available');
  } else {
    warn('FFmpeg not found - video processing won\'t work without it');
    warn('Install: https://ffmpeg.org/download.html');
  }

  // Create upload directories
  const dirs = [
    'backend/uploads/videos',
    'backend/uploads/thumbnails',
    'backend/uploads/temp',
    'backend/src/uploads/videos',
    'backend/src/uploads/thumbnails',
    'backend/src/uploads/temp',
  ];
  dirs.forEach(d => {
    const p = resolve(root, d);
    if (!existsSync(p)) mkdirSync(p, { recursive: true });
  });
  log('Upload directories created');

  // Setup .env
  console.log('\n\x1b[1m🔧 Configuration\x1b[0m\n');

  const envPath = resolve(root, 'backend/.env');
  let existingEnv = '';
  if (existsSync(envPath)) {
    existingEnv = readFileSync(envPath, 'utf-8');
  }

  const hasMongoUri = existingEnv.includes('MONGODB_URI=');
  const hasJwtSecret = existingEnv.includes('JWT_SECRET=');

  if (hasMongoUri && hasJwtSecret) {
    log('Backend .env already configured');
  } else {
    const answers = {};
    answers.mongoUri = await ask('MongoDB URI [mongodb://localhost:27017/anistrem]: ') || 'mongodb://localhost:27017/anistrem';
    answers.jwtSecret = await ask('JWT Secret [change-me-to-random-string]: ') || 'change-me-to-random-string';
    answers.adminEmail = await ask('Admin Email [admin@anistrem.com]: ') || 'admin@anistrem.com';
    answers.adminPassword = await ask('Admin Password [Admin@123456]: ') || 'Admin@123456';
    answers.port = await ask('Backend Port [5000]: ') || '5000';
    answers.frontendUrl = await ask('Frontend URL [http://localhost:3000]: ') || 'http://localhost:3000';

    const envContent = `# Server
PORT=${answers.port}
NODE_ENV=development

# MongoDB
MONGODB_URI=${answers.mongoUri}

# JWT
JWT_SECRET=${answers.jwtSecret}
JWT_REFRESH_SECRET=${answers.jwtSecret}-refresh
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=${answers.frontendUrl}

# Admin
ADMIN_EMAIL=${answers.adminEmail}
ADMIN_PASSWORD=${answers.adminPassword}

# FFmpeg (leave blank for system default)
FFMPEG_PATH=
FFPROBE_PATH=

# Upload limits
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=524288000

# Storage: local | s3 | cloudinary | gcs
STORAGE_TYPE=local

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5000

# Cloud Storage (optional, set STORAGE_TYPE to match)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_S3_BUCKET=
# AWS_REGION=us-east-1
# CLOUDINARY_CLOUD_NAME=
# CLOUDINARY_API_KEY=
# CLOUDINARY_API_SECRET=
`;

    writeFileSync(envPath, envContent);
    log('Backend .env created');
  }

  // Seed database
  console.log('\n\x1b[1m🌱 Database Seed\x1b[0m\n');

  const seedChoice = await ask('Seed database with admin account & categories? (Y/n): ');
  if (seedChoice.toLowerCase() !== 'n') {
    log('Running seed script...');
    const seedOk = run('node src/seed.js', resolve(root, 'backend'));
    if (seedOk) {
      log('Database seeded successfully');
    } else {
      warn('Seed failed - make sure MongoDB is running');
    }
  }

  rl.close();

  console.log('\n\x1b[1m🎉 Setup Complete!\x1b[0m\n');
  console.log('Run the development servers:\n');
  console.log('  \x1b[36mTerminal 1 (Backend):\x1b[0m');
  console.log('    cd backend && npm run dev\n');
  console.log('  \x1b[36mTerminal 2 (Frontend):\x1b[0m');
  console.log('    cd frontend && npm run dev\n');
  console.log('  \x1b[36mURLs:\x1b[0m');
  console.log('    Site:   http://localhost:3000');
  console.log('    Admin:  http://localhost:3000/admin/login');
  console.log('    API:    http://localhost:5000/api\n');
  console.log('  \x1b[33mDefault Admin:\x1b[0m');
  console.log('    Email:    admin@anistrem.com');
  console.log('    Password: Admin@123456\n');
  console.log('  \x1b[31m⚠ Change the default password!\x1b[0m\n');
}

main().catch(err => { console.error(err); process.exit(1); });