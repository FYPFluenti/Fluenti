#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Starting Netlify build process...');

// Check critical dependencies
const criticalDeps = ['vite', 'tailwindcss', 'autoprefixer', 'postcss'];
console.log('📦 Checking critical dependencies...');

let missingDeps = [];
criticalDeps.forEach(dep => {
  try {
    require.resolve(dep);
    console.log(`✅ ${dep}: found`);
  } catch (e) {
    console.log(`❌ ${dep}: missing`);
    missingDeps.push(dep);
  }
});

if (missingDeps.length > 0) {
  console.log(`⚠️  Missing dependencies: ${missingDeps.join(', ')}`);
  console.log('🔧 Installing missing dependencies...');
  try {
    execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to install missing dependencies');
    process.exit(1);
  }
}

// Run the build
console.log('🏗️  Running Vite build...');
try {
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}
