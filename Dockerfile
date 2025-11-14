FROM node:18

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy rest of the application code
COPY . .

# Set environment to production
ENV NODE_ENV=production

# Expose the port
EXPOSE 5000

# Start the application
CMD ["node", "src/server.js"]
