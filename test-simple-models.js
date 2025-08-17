import 'dotenv/config';
import { HfInference } from '@huggingface/inference';

console.log('🔍 Testing Simple HF Models for Text Generation...\n');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const simpleModels = [
  'gpt2',
  'distilgpt2',
  'microsoft/DialoGPT-medium'
];

for (const model of simpleModels) {
  console.log(`\n🧪 Testing ${model}...`);
  try {
    // Try text generation task
    const result = await hf.textGeneration({
      model: model,
      inputs: 'Hello, I need emotional support. I feel',
      parameters: {
        max_new_tokens: 20,
        temperature: 0.7,
        return_full_text: false
      }
    });

    console.log(`✅ ${model} working!`);
    console.log(`Response: "${result.generated_text}"`);
    break; // Use the first working model
  } catch (error) {
    console.log(`❌ ${model} failed: ${error.message.substring(0, 80)}...`);
  }
}

// Also test if we can use a different task
console.log('\n🧪 Testing text2text-generation task...');
try {
  const result = await hf.textToTextGeneration({
    model: 'google/flan-t5-small',
    inputs: 'Provide emotional support for someone feeling sad: I lost my job today',
  });

  console.log('✅ Text2Text generation working!');
  console.log(`Response: "${result.generated_text}"`);
} catch (error) {
  console.log(`❌ Text2Text failed: ${error.message.substring(0, 80)}...`);
}

console.log('\n✨ Simple model testing complete!');
