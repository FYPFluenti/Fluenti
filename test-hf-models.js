import 'dotenv/config';
import { HfInference } from '@huggingface/inference';

console.log('🔍 Testing Alternative HF Models...\n');

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const modelsToTest = [
  'microsoft/DialoGPT-small',
  'microsoft/DialoGPT-large',
  'facebook/blenderbot-400M-distill',
  'google/flan-t5-base',
  'HuggingFaceH4/zephyr-7b-beta'
];

for (const model of modelsToTest) {
  console.log(`\n🧪 Testing ${model}...`);
  try {
    const result = await hf.textGeneration({
      model: model,
      inputs: 'I feel sad today.',
      parameters: {
        max_new_tokens: 30,
        temperature: 0.7,
      }
    });

    console.log(`✅ ${model} working!`);
    console.log(`Response: "${result.generated_text.substring(0, 80)}..."`);
  } catch (error) {
    console.log(`❌ ${model} failed: ${error.message.substring(0, 60)}...`);
  }
}

console.log('\n✨ Model testing complete!');
