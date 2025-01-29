# Use the official Bun image from GitHub Container Registry (GHCR)
FROM oven/bun:1 AS base

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

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

USER bun
# Expose the port your app runs on
EXPOSE 3000

# Run your app
CMD ["bun", "run", "src/index.ts"]
