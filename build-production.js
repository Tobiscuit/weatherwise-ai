const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build...');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

try {
  // Build Tailwind CSS
  console.log('📦 Building Tailwind CSS...');
  execSync('pnpm build:tailwind', { stdio: 'inherit' });
  
  // Build frontend JavaScript
  console.log('📦 Building frontend JavaScript...');
  execSync('pnpm build:frontend', { stdio: 'inherit' });
  
  // Compile TypeScript backend
  console.log('📦 Compiling TypeScript backend...');
  execSync('npx tsc --project tsconfig.json', { stdio: 'inherit' });
  
  // Copy Nunjucks templates
  console.log('📦 Copying Nunjucks templates...');
  fs.mkdirSync('dist/templates', { recursive: true });
  const templateFiles = fs.readdirSync('src/backend/templates').filter(f => f.endsWith('.njk'));
  templateFiles.forEach(file => {
    fs.copyFileSync(`src/backend/templates/${file}`, `dist/templates/${file}`);
  });

  // Copy static assets
  console.log('📦 Copying static assets...');
  const staticSrc = 'src/backend/templates/static';
  if (fs.existsSync(staticSrc)) {
    fs.cpSync(staticSrc, 'dist/static', { recursive: true });
  }
  
  // Copy .env file if it exists
  if (fs.existsSync('.env')) {
    console.log('📦 Copying environment file...');
    fs.copyFileSync('.env', 'dist/.env');
  }
  
  console.log('✅ Production build completed successfully!');
  console.log('📁 Build output: dist/');
  console.log('🚀 Run with: pnpm start');
  
} catch (error) {
  console.error('❌ Build failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
} 