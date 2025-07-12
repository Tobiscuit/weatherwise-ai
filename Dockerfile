# Use a Node.js 20 base image for the build stage
FROM node:20-bullseye as build

# Install pnpm
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN pnpm build


# Use a smaller Node.js 20 slim image for the production stage
FROM node:20-slim

# Install pnpm
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

# Copy package files and install only production dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod

# Copy the build output from the build stage
COPY --from=build /app/dist ./dist

# Copy the static assets from the top-level assets folder
COPY --from=build /app/assets ./dist/static

# Expose the port the app runs on
EXPOSE 8089

# Set the command to start the server
CMD [ "pnpm", "start" ] 