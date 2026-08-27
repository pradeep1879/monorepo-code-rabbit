# ============================================================
# Stage 1: Base
# ============================================================

FROM node:20-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable \
    && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app


# ============================================================
# Stage 2: Pruner
#
# Create a minimal Turbo workspace containing only what
# apps/web needs.
# ============================================================

FROM base AS pruner

COPY . .

RUN pnpm dlx turbo@2.9.14 prune web --docker

# Result:
#
# /app/out/
# ├── json/
# └── full/


# ============================================================
# Stage 3: Builder
# ============================================================

FROM base AS builder

# Copy only dependency metadata first.
#
# This allows Docker to cache pnpm install when application
# source code changes but package manifests/lockfile don't.
COPY --from=pruner /app/out/json/ ./

# Prisma 7 reads DATABASE_URL from prisma.config.ts even
# during prisma generate.
#
# This is ONLY a build-time placeholder.
# The real DATABASE_URL is injected at runtime.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/coderabbit"

RUN pnpm install --frozen-lockfile

# Now copy the actual pruned source code.
COPY --from=pruner /app/out/full/ ./

# Build the application.
#
# Your existing turbo.json already makes db:generate a
# dependency of build, so this executes:
#
# @repo/db#db:generate
#        ↓
# Prisma Client generation
#        ↓
# web#build
#        ↓
# Next.js standalone build
RUN pnpm turbo build


# ============================================================
# Stage 4: Runner
#
# This is the actual production image.
# ============================================================

FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app

# Next standalone contains the production server and the
# traced runtime dependencies.
COPY --from=builder /app/apps/web/.next/standalone/ ./

# Standalone doesn't automatically include these.
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]