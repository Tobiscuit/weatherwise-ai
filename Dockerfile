# Use a Node.js 20 base image for the build stage
FROM node:20-bullseye as build

# Install pnpm
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

# Copy all source files
COPY . .

# Install dependencies and build the application
RUN pnpm install
RUN pnpm build


# Use a smaller Node.js 20 slim image for the production stage
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Copy package files and install only production dependencies
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --prod

# Copy the entire build output from the build stage
COPY --from=build /app/dist ./dist

# Expose the port the app runs on
EXPOSE 8089

# Set the command to start the server
CMD [ "pnpm", "start" ] 