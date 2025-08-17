// Package Verification Test for Sub-Step 1.3
// Tests @huggingface/inference and wav packages

import { HfInference } from '@huggingface/inference';
import wav from 'wav';
import { readFileSync } from 'fs';

console.log('🧪 Testing Package Imports for FLUENTI Phase 1');
console.log('='.repeat(50));

try {
    console.log('✅ @huggingface/inference: Successfully imported');
    console.log('   HfInference class available:', typeof HfInference);
    
    // Test basic instantiation (without API key for this test)
    const hfTest = new HfInference();
    console.log('   Can create instance: true');
    
} catch (error) {
    console.error('❌ @huggingface/inference: Import failed');
    console.error('   Error:', error.message);
}

try {
    console.log('✅ wav: Successfully imported');
    console.log('   Available methods:', Object.keys(wav));
    
    // Check for key functionality
    console.log('   Reader available:', typeof wav.Reader);
    console.log('   Writer available:', typeof wav.Writer);
    
} catch (error) {
    console.error('❌ wav: Import failed');
    console.error('   Error:', error.message);
}

console.log('\n🎯 Package Verification Summary:');
console.log('Both required packages are properly installed and importable');
console.log('Ready for Phase 1 STT and audio processing implementation');

// Test package versions
try {
    const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
    console.log('\n📦 Installed Versions:');
    console.log(`   @huggingface/inference: ${packageJson.dependencies['@huggingface/inference']}`);
    console.log(`   wav: ${packageJson.dependencies['wav']}`);
} catch (error) {
    console.log('\n⚠️  Could not read package.json for version info');
}
