# --- Stage 1: Build ---
# Use a Node.js version that matches the project's engine requirement
FROM node:20-slim AS builder

# Set the working directory
WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for building)
RUN pnpm install

# Copy the rest of the application source code
COPY . .

# Build the TypeScript code
RUN pnpm build


# --- Stage 2: Production ---
# Use a lightweight Node.js image for the final container
FROM node:20-slim

# Set the working directory
WORKDIR /usr/src/app

# Set the environment to production
ENV NODE_ENV=production

# Copy package files again
COPY package.json pnpm-lock.yaml ./

# Install ONLY production dependencies
RUN npm install -g pnpm && pnpm install --prod

# Copy the built application from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy static assets and templates from the builder stage
COPY --from=builder /usr/src/app/dist/static ./dist/static
COPY --from=builder /usr/src/app/dist/templates ./dist/templates

# Expose the port the app runs on
EXPOSE 8089

# The command to run the application
CMD [ "node", "dist/server.js" ] 