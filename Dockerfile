FROM node:20-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install root server dependencies first (better layer cache)
COPY package.json ./
RUN npm install

COPY . .

# Build the AI Workforce Office SPA into apps/workforce/dist.
# devDependencies removed afterwards to keep the image small.
RUN cd apps/workforce \
 && npm install \
 && npm run build \
 && rm -rf node_modules

EXPOSE 3000
CMD ["node", "server.js"]
