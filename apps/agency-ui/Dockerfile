# ── Build stage ────────────────────────────────────────────────
FROM node:22-bookworm AS builder

WORKDIR /app

# Install build deps for native modules (node-pty, etc.)
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npx vite build

# ── Runtime stage ─────────────────────────────────────────────
FROM node:22-bookworm

WORKDIR /app

# Runtime deps + gh (GitHub CLI)
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ bash gh ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm install tsx node-pty

# Shim onnxruntime-node → onnxruntime-web (native ONNX crashes on Alpine/musl)
RUN rm -rf node_modules/onnxruntime-node && \
    mkdir -p node_modules/onnxruntime-node && \
    echo '{"name":"onnxruntime-node","main":"index.js"}' > node_modules/onnxruntime-node/package.json && \
    echo 'module.exports = require("onnxruntime-web");' > node_modules/onnxruntime-node/index.js

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server source (tsx runs it directly)
COPY server ./server
COPY tsconfig.json ./

# Single port — Express serves both API + static frontend
EXPOSE 3002

# Default env vars (overridden in docker-compose)
ENV YASWARM_PORT=3002
ENV AGENCY_ROOT=/workspace/agency
ENV YASWARM_TOKEN=yaswarm-dev-token
ENV CHROMA_URL=http://yaswarm-rag:8000

CMD ["npx", "tsx", "server/index.ts"]
