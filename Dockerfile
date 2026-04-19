# ─── Stage 1: Dependencies ───────────────────────────────
FROM oven/bun:1.3-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ─── Stage 2: Builder ────────────────────────────────────
FROM oven/bun:1.3-alpine AS builder
WORKDIR /app

COPY package.json bun.lock tsconfig.json ./
RUN bun install --frozen-lockfile

COPY src/ ./src/

RUN bun run typecheck

# ─── Stage 3: Runner ─────────────────────────────────────
FROM oven/bun:1.3-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p logs && chown appuser:appgroup logs

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health/live || exit 1

CMD ["bun", "run", "src/server.ts"]
