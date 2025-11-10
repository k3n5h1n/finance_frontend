# Use Node slim image
FROM node:20-slim

# Set working directory
WORKDIR /workspace

# Copy package files first to cache dependencies
COPY package.json package-lock.json* ./

# Install dependencies if package.json exists
RUN if [ -f package.json ]; then npm install; fi

# Copy remaining project files
COPY . .

# Expose Vite default port
EXPOSE 5173

# Default command for dev
CMD ["npm", "run", "dev"]
