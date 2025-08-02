#!/usr/bin/env node

// Debug script to help identify Netlify build issues
console.log('=== Netlify Build Debug Info ===');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Current working directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('npm version:', process.env.npm_version || 'unknown');

// Check if required files exist
import fs from 'fs';
import path from 'path';

const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'postcss.config.js',
  'tailwind.config.ts',
  'client/src/main.tsx',
  'client/index.html'
];

console.log('\n=== File System Check ===');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${file}: ${exists ? '✓' : '✗'}`);
});

// Check node_modules
console.log('\n=== Dependencies Check ===');
const nodeModules = fs.existsSync('node_modules');
console.log(`node_modules exists: ${nodeModules ? '✓' : '✗'}`);

if (nodeModules) {
  const criticalDeps = ['vite', 'react', 'tailwindcss', 'autoprefixer'];
  criticalDeps.forEach(dep => {
    const depPath = path.join('node_modules', dep);
    const exists = fs.existsSync(depPath);
    console.log(`${dep}: ${exists ? '✓' : '✗'}`);
  });
}

console.log('\n=== Environment Variables ===');
const envVars = Object.keys(process.env).filter(key => 
  key.includes('NODE') || key.includes('npm') || key.includes('NETLIFY')
);
envVars.forEach(key => {
  console.log(`${key}: ${process.env[key]}`);
});

console.log('\n=== End Debug Info ===');
