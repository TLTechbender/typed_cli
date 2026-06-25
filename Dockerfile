
FROM node:22-alpine AS builder


RUN npm install pnpm

WORKDIR /app


COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./


COPY packages/shared/package.json ./packages/shared/
COPY apps/cli-csv/package.json ./apps/cli-csv/
COPY apps/cli-transform/package.json ./apps/cli-transform/


RUN pnpm install --frozen-lockfile


COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/
COPY apps/cli-csv/src ./apps/cli-csv/src
COPY apps/cli-csv/tsconfig.json ./apps/cli-csv/
COPY apps/cli-transform/src ./apps/cli-transform/src
COPY apps/cli-transform/tsconfig.json ./apps/cli-transform/

# Build everything
RUN pnpm --filter @typed_cli/shared build && \
    pnpm --filter cli-csv build && \
    pnpm --filter cli-transform build

# Runtime stage
FROM node:22-alpine

WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app/apps ./apps
COPY --from=builder /app/packages ./packages

# Copy data folder (empty or with test data)
COPY data ./data

# Default command
ENTRYPOINT ["sh", "-c"]
CMD ["node apps/cli-csv/dist/index.js < data/input.csv && node apps/cli-transform/dist/index.js --map 'name:fullName,age:years'"]