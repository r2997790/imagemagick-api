FROM node:16-slim

# Install ImageMagick
RUN apt-get update && \
    apt-get install -y imagemagick && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Create directories for file storage
RUN mkdir -p uploads output

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]