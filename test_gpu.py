import torch
print("CUDA available:", torch.cuda.is_available())
print("GPU Name:", torch.cuda.get_device_name(0) if torch.cuda.is_available() else "No GPU")
print("PyTorch version:", torch.__version__)
print("CUDA version:", torch.version.cuda if torch.cuda.is_available() else "No CUDA")
print("Number of GPUs:", torch.cuda.device_count() if torch.cuda.is_available() else 0)

if torch.cuda.is_available():
    print("GPU Memory:")
    print(f"  Total: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
    print(f"  Reserved: {torch.cuda.memory_reserved(0) / 1024**3:.2f} GB")
    print(f"  Allocated: {torch.cuda.memory_allocated(0) / 1024**3:.2f} GB")
