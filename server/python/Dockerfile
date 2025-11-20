# Multi-stage build to reduce final image size
FROM python:3.11-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-only PyTorch first (smaller than GPU version)
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu \
    "torch>=2.0.0,<3.0.0" \
    "torchvision>=0.15.0,<1.0.0"

# Install other dependencies
COPY requirements.prod.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Final stage - minimal runtime image
FROM python:3.11-slim

# Copy only installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

# Expose port
EXPOSE 10000

# Run the application
CMD ["python", "therapy_service.py"]

