# Use the official Bun image from GitHub Container Registry (GHCR)
FROM ghcr.io/oven-sh/bun:latest

# Set working directory inside container
WORKDIR /app

# Copy the application files into the container
COPY . /app

# Install dependencies using Bun
RUN bun install

# Build arguments from GitHub Secrets (passed during build)
ARG DATABASE_URL
ARG WEBHOOK
ARG BASE_URL
ARG GETALL_URL
ARG SHIFTS_URL
ARG MANAGER
ARG EMAIL
ARG PASS
ARG JWT

# Create .env file from the passed build arguments
RUN echo "DATABASE_URL=${DATABASE_URL}" >> .env && \
    echo "WEBHOOK=${WEBHOOK}" >> .env && \
    echo "BASE_URL=${BASE_URL}" >> .env && \
    echo "GETALL_URL=${GETALL_URL}" >> .env && \
    echo "SHIFTS_URL=${SHIFTS_URL}" >> .env && \
    echo "MANAGER=${MANAGER}" >> .env && \
    echo "EMAIL=${EMAIL}" >> .env && \
    echo "PASS=${PASS}" >> .env && \
    echo "JWT=${JWT}" >> .env

# Expose the port your app runs on
EXPOSE 3000

# Run your app
CMD ["bun", "run", "src/index.ts"]
