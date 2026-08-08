# Meesho Sakhi Backend - Railway Deployment

# ============================================
# Stage 1: Builder
# ============================================

FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ============================================
# Stage 2: Runtime
# ============================================

FROM python:3.11-slim

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Copy installed Python packages
COPY --from=builder /install /usr/local

# Copy backend application
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# Railway provides PORT automatically
# Do NOT set PORT=8000 here

EXPOSE 8000

# Container health check
HEALTHCHECK --interval=30s \
    --timeout=10s \
    --start-period=40s \
    --retries=3 \
    CMD sh -c 'curl -f http://localhost:${PORT}/health || exit 1'

# Start FastAPI
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]