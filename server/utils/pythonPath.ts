import path from 'path';
import fs from 'fs';

/**
 * Get the correct Python executable path for cross-platform compatibility
 * Handles both Windows (.venv/Scripts/python.exe) and Unix (.venv/bin/python)
 */
export function getPythonExecutablePath(): string {
  const isWindows = process.platform === 'win32';
  const venvDir = path.join(process.cwd(), '.venv');
  
  // First try virtual environment
  if (isWindows) {
    const windowsPath = path.join(venvDir, 'Scripts', 'python.exe');
    if (fs.existsSync(windowsPath)) {
      console.log('✅ Using Windows venv Python:', windowsPath);
      return windowsPath;
    }
  } else {
    // Unix/Linux (Render, Railway, etc.) - try different Python versions
    const possiblePaths = [
      path.join(venvDir, 'bin', 'python'),
      path.join(venvDir, 'bin', 'python3'),
      path.join(venvDir, 'bin', 'python3.11'),
      path.join(venvDir, 'bin', 'python3.10'),
      path.join(venvDir, 'bin', 'python3.9')
    ];
    
    for (const pythonPath of possiblePaths) {
      if (fs.existsSync(pythonPath)) {
        console.log('✅ Using Unix venv Python:', pythonPath);
        return pythonPath;
      }
    }
  }
  
  // Fallback to system Python
  console.log('⚠️ Virtual environment not found, using system Python3');
  return 'python3';
}

/**
 * Check if virtual environment exists and is properly set up
 */
export function checkVirtualEnvironment(): boolean {
  const isWindows = process.platform === 'win32';
  const venvDir = path.join(process.cwd(), '.venv');
  
  if (!fs.existsSync(venvDir)) {
    console.warn('⚠️ Virtual environment not found at:', venvDir);
    return false;
  }
  
  const pythonPath = isWindows 
    ? path.join(venvDir, 'Scripts', 'python.exe')
    : path.join(venvDir, 'bin', 'python');
    
  if (!fs.existsSync(pythonPath)) {
    console.warn('⚠️ Python executable not found at:', pythonPath);
    return false;
  }
  
  console.log('✅ Virtual environment found:', pythonPath);
  return true;
}