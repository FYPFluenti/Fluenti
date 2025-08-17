import 'dotenv/config';
import OpenAI from 'openai';
import { HfInference } from '@huggingface/inference';

console.log('🔍 Diagnosing API Key Issues...\n');

// Test 1: Environment Variables
console.log('📋 Environment Variables:');
console.log(`OpenAI Key: ${process.env.OPENAI_API_KEY ? 'Found (' + process.env.OPENAI_API_KEY.length + ' chars)' : '❌ Missing'}`);
console.log(`HF Key: ${process.env.HUGGINGFACE_API_KEY ? 'Found (' + process.env.HUGGINGFACE_API_KEY.length + ' chars)' : '❌ Missing'}`);

// Test 2: OpenAI API
console.log('\n🤖 Testing OpenAI API...');
try {
  const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say hello in exactly 3 words.' }
    ],
    temperature: 0.7,
    max_tokens: 10,
  });

  console.log('✅ OpenAI API working!');
  console.log(`Response: "${completion.choices[0].message.content}"`);
} catch (error) {
  console.log('❌ OpenAI API failed:');
  console.log(`Error: ${error.message}`);
  if (error.status) console.log(`Status: ${error.status}`);
  if (error.code) console.log(`Code: ${error.code}`);
}

// Test 3: Hugging Face API
console.log('\n🤗 Testing Hugging Face API...');
try {
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  
  const result = await hf.textGeneration({
    model: 'microsoft/DialoGPT-medium',
    inputs: 'Hello, how are you?',
    parameters: {
      max_new_tokens: 20,
      temperature: 0.7,
    }
  });

  console.log('✅ Hugging Face API working!');
  console.log(`Response: "${result.generated_text}"`);
} catch (error) {
  console.log('❌ Hugging Face API failed:');
  console.log(`Error: ${error.message}`);
  if (error.status) console.log(`Status: ${error.status}`);
}

console.log('\n✨ Diagnosis complete!');
