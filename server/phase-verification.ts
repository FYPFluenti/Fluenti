// Complete Phase 1 & Phase 2 Verification Script
// Run with: npx tsx server/phase-verification.ts

import fs from 'fs';
import path from 'path';

function checkDependencies() {
  console.log('📦 Phase 1: Checking Dependencies');
  console.log('=================================\n');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    '@huggingface/inference',
    'wav',
    'fluent-ffmpeg',
    'ws'
  ];
  
  let allInstalled = true;
  
  requiredDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`✅ ${dep}: ${deps[dep]}`);
    } else {
      console.log(`❌ ${dep}: NOT INSTALLED`);
      allInstalled = false;
    }
  });
  
  console.log(`\n${allInstalled ? '✅' : '❌'} Phase 1 Dependencies: ${allInstalled ? 'COMPLETE' : 'INCOMPLETE'}\n`);
  return allInstalled;
}

function checkBackendImplementation() {
  console.log('🔧 Phase 1 & 2: Backend Implementation');
  console.log('=====================================\n');
  
  const files = [
    'server/services/speechService.ts',
    'server/index.ts',
    'shared/schema.ts'
  ];
  
  let allImplemented = true;
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      
      if (file === 'server/services/speechService.ts') {
        const hasTranscribe = content.includes('transcribeAudio');
        const hasEmotion = content.includes('detectEmotion');
        const hasUrduModel = content.includes('Abdul145/whisper-medium-urdu-custom');
        const hasEnglishModel = content.includes('openai/whisper-large-v3');
        
        console.log(`✅ ${file}:`);
        console.log(`   - transcribeAudio function: ${hasTranscribe ? '✅' : '❌'}`);
        console.log(`   - detectEmotion function: ${hasEmotion ? '✅' : '❌'}`);
        console.log(`   - Urdu model (Abdul145/whisper-medium-urdu-custom): ${hasUrduModel ? '✅' : '❌'}`);
        console.log(`   - English model (openai/whisper-large-v3): ${hasEnglishModel ? '✅' : '❌'}`);
        
        if (!hasTranscribe || !hasEmotion || !hasUrduModel || !hasEnglishModel) {
          allImplemented = false;
        }
      } else {
        console.log(`✅ ${file}: EXISTS`);
      }
    } else {
      console.log(`❌ ${file}: MISSING`);
      allImplemented = false;
    }
  });
  
  console.log(`\n${allImplemented ? '✅' : '❌'} Backend Implementation: ${allImplemented ? 'COMPLETE' : 'INCOMPLETE'}\n`);
  return allImplemented;
}

function checkFrontendImplementation() {
  console.log('🎨 Phase 1 & 2: Frontend Implementation');
  console.log('======================================\n');
  
  const frontendFile = 'client/src/pages/emotional-support.tsx';
  
  if (!fs.existsSync(frontendFile)) {
    console.log(`❌ ${frontendFile}: MISSING`);
    return false;
  }
  
  const content = fs.readFileSync(frontendFile, 'utf-8');
  
  // Check Phase 1 specifications compliance
  const hasLanguageVar = content.includes('language'); // Should use 'language' not 'selectedLanguage'
  const hasEnCode = content.includes("'en'"); // Should use 'en' not 'english'
  const hasUrCode = content.includes("'ur'"); // Should use 'ur' not 'urdu'
  const hasProcessInput = content.includes('processInput'); // Should have processInput function
  const hasWebSocket = content.includes('socket') || content.includes('webSocket');
  
  console.log(`✅ ${frontendFile}:`);
  console.log(`   - Uses 'language' variable (Phase 1 spec): ${hasLanguageVar ? '✅' : '❌'}`);
  console.log(`   - Uses 'en' language code: ${hasEnCode ? '✅' : '❌'}`);
  console.log(`   - Uses 'ur' language code: ${hasUrCode ? '✅' : '❌'}`);
  console.log(`   - Has processInput function: ${hasProcessInput ? '✅' : '❌'}`);
  console.log(`   - WebSocket integration: ${hasWebSocket ? '✅' : '❌'}`);
  
  // Check for old implementation patterns (should be removed)
  const hasOldSelectedLanguage = content.includes('selectedLanguage');
  const hasOldEnglish = content.includes("'english'");
  const hasOldUrdu = content.includes("'urdu'");
  
  console.log(`\n   Legacy Code Check:`);
  console.log(`   - No 'selectedLanguage' references: ${!hasOldSelectedLanguage ? '✅' : '❌'}`);
  console.log(`   - No 'english' string references: ${!hasOldEnglish ? '✅' : '❌'}`);
  console.log(`   - No 'urdu' string references: ${!hasOldUrdu ? '✅' : '❌'}`);
  
  const frontendComplete = hasLanguageVar && hasEnCode && hasUrCode && hasProcessInput && hasWebSocket && 
                          !hasOldSelectedLanguage && !hasOldEnglish && !hasOldUrdu;
  
  console.log(`\n${frontendComplete ? '✅' : '❌'} Frontend Implementation: ${frontendComplete ? 'COMPLETE' : 'NEEDS UPDATE'}\n`);
  return frontendComplete;
}

function checkTestImplementation() {
  console.log('🧪 Phase 2: Test Implementation');
  console.log('===============================\n');
  
  const testFile = 'server/test-stt.ts';
  const testDir = 'server/test-audio';
  
  const hasTestFile = fs.existsSync(testFile);
  const hasTestDir = fs.existsSync(testDir);
  
  console.log(`✅ Test file (${testFile}): ${hasTestFile ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Test directory (${testDir}): ${hasTestDir ? 'EXISTS' : 'MISSING'}`);
  
  if (hasTestFile) {
    const content = fs.readFileSync(testFile, 'utf-8');
    const hasTestFunction = content.includes('testSTT');
    console.log(`   - testSTT function: ${hasTestFunction ? '✅' : '❌'}`);
  }
  
  const testComplete = hasTestFile && hasTestDir;
  console.log(`\n${testComplete ? '✅' : '❌'} Test Implementation: ${testComplete ? 'COMPLETE' : 'INCOMPLETE'}\n`);
  return testComplete;
}

async function runVerification() {
  console.log('🎯 FLUENTI - PHASE 1 & 2 IMPLEMENTATION VERIFICATION');
  console.log('=====================================================\n');
  
  const depCheck = checkDependencies();
  const backendCheck = checkBackendImplementation();
  const frontendCheck = checkFrontendImplementation();
  const testCheck = checkTestImplementation();
  
  console.log('📊 FINAL VERIFICATION SUMMARY');
  console.log('=============================');
  console.log(`Phase 1 Dependencies: ${depCheck ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
  console.log(`Backend Implementation: ${backendCheck ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
  console.log(`Frontend Implementation: ${frontendCheck ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
  console.log(`Phase 2 Testing: ${testCheck ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
  
  const allComplete = depCheck && backendCheck && frontendCheck && testCheck;
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 OVERALL STATUS: ${allComplete ? '✅ ALL PHASES COMPLETE' : '❌ NEEDS ATTENTION'}`);
  console.log('='.repeat(50));
  
  if (!allComplete) {
    console.log('\n💡 Next Steps:');
    if (!depCheck) console.log('   • Install missing dependencies');
    if (!backendCheck) console.log('   • Complete backend implementation');
    if (!frontendCheck) console.log('   • Update frontend to Phase 1 specifications');
    if (!testCheck) console.log('   • Set up Phase 2 testing framework');
  } else {
    console.log('\n🚀 Ready for Phase 3 implementation!');
  }
}

// Run verification if this file is executed directly
if (process.argv[1]?.endsWith('phase-verification.ts')) {
  runVerification().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

export { runVerification };
