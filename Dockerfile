# ── Stage 1 : build frontend ──────────────────────────────────────────────────
FROM node:22-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ── Stage 2 : build backend ───────────────────────────────────────────────────
FROM node:22-alpine AS backend-builder

WORKDIR /app
COPY backend/package.json ./
RUN npm install
COPY backend/ .
RUN npm run build

# ── Stage 3 : image finale ────────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

COPY backend/package.json ./
RUN npm install --omit=dev

COPY --from=backend-builder /app/dist ./dist
COPY --from=frontend-builder /frontend/dist ./dist/public

RUN mkdir -p /data

EXPOSE 3001

ENV NODE_ENV=production
ENV DB_PATH=/data/exo.db

CMD ["node", "dist/server.js"]
