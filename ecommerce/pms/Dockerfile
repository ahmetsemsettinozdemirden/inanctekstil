FROM oven/bun:1.2-alpine AS base
WORKDIR /app

# Backend deps
FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Frontend deps + build
FROM base AS frontend
COPY frontend/package.json frontend/bun.lock* ./frontend/
RUN cd frontend && bun install --frozen-lockfile
COPY frontend ./frontend
RUN cd frontend && bun run build

# Final image
FROM base AS app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=frontend /app/frontend/dist ./frontend/dist
COPY . .

EXPOSE 3000
CMD ["bun", "src/server.ts"]
