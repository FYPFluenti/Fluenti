FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data
RUN python -c "import nltk; nltk.download('vader_lexicon'); nltk.download('punkt')"

# Copy application code
COPY server/python/ ./server/python/
COPY .env.production .env

# Set working directory to server/python
WORKDIR /app/server/python

# Expose port
EXPOSE 5001

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=5001
ENV THERAPY_PRODUCTION=true

# Run the application
CMD ["python", "therapy_service.py"]