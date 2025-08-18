import { spawn } from 'child_process';
import path from 'path';

async function debugTest() {
  const venvPython = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
  
  const pythonCode = `
import torch
from transformers import pipeline
print("PyTorch loaded successfully")
print("CUDA available:", torch.cuda.is_available())

try:
    # Try CPU first
    pipe = pipeline("automatic-speech-recognition", model="openai/whisper-small", device=-1)
    print("Pipeline created successfully on CPU")
except Exception as e:
    print("Error creating pipeline:", str(e))
    import traceback
    traceback.print_exc()
  `;

  console.log('Using Python:', venvPython);
  const python = spawn(venvPython, ['-c', pythonCode]);

  let output = '';
  let errorOutput = '';
  
  python.stdout.on('data', (data) => { 
    const text = data.toString();
    console.log('STDOUT:', text);
    output += text;
  });
  
  python.stderr.on('data', (data) => { 
    const text = data.toString();
    console.log('STDERR:', text);
    errorOutput += text;
  });
  
  python.on('close', (code) => {
    console.log(`Process exited with code: ${code}`);
    console.log('Final output:', output.trim());
    if (errorOutput) {
      console.log('Final error:', errorOutput.trim());
    }
  });

  python.on('error', (err) => {
    console.log('Process error:', err);
  });
}

debugTest();
