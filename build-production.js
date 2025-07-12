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
  
  // Build frontend JavaScript and assets
  console.log('📦 Building frontend assets...');
  execSync('pnpm build:frontend', { stdio: 'inherit' });
  
  // Copy Nunjucks templates
  console.log('📦 Copying Nunjucks templates...');
  execSync('pnpm build:templates', { stdio: 'inherit' });

  // Compile TypeScript backend
  console.log('📦 Compiling TypeScript backend...');
  execSync('tsc --project tsconfig.json', { stdio: 'inherit' });
  
  console.log('✅ Production build completed successfully!');
  console.log('📁 Build output: dist/');
  console.log('🚀 Run with: pnpm start');
  
} catch (error) {
  console.error('❌ Build failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
} 