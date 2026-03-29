FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

# Data directory for SQLite
RUN mkdir -p /data

EXPOSE 3001

CMD ["node", "server.js"]
