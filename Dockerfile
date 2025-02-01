# Use the official Bun image
FROM oven/bun:latest

# Set the working directory inside the container
WORKDIR /app

# Copy package files first for better caching
COPY bun.lockb package.json ./

# Install dependencies
RUN bun install

# Copy the entire project
COPY . .

# Generate Prisma client
RUN bun prisma generate

# Expose any necessary ports (adjust as needed)
EXPOSE 3000

# Command to run the application
CMD ["bun", "run", "src/index.ts"]
