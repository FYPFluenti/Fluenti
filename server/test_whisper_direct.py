import os
import torch
from transformers import pipeline

# Add ffmpeg to PATH
ffmpeg_path = r"C:\Users\Syeda Hira\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-7.1.1-full_build\bin"
if ffmpeg_path not in os.environ.get('PATH', ''):
    os.environ['PATH'] = ffmpeg_path + os.pathsep + os.environ.get('PATH', '')

print("PATH updated with ffmpeg")

device = "cpu"
pipe = pipeline("automatic-speech-recognition", model="openai/whisper-tiny", device=-1)
transcription = pipe("E:\\Fluenti\\temp_audio.wav")['text']
print(transcription)
