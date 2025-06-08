FROM node:24 as base

FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
COPY patches/ ./patches/

RUN npm install -g pnpm && \
    apt-get update && \
    apt-get install -y --no-install-recommends zsh && \
    rm -rf /var/lib/apt/lists/*

RUN pnpm install --frozen-lockfile

COPY . .

RUN mkdir -p ./generated && \
    zsh -c 'pnpx @atproto/lex-cli gen-api --yes ./generated/api ./lexicons/**/*.json \
    && pnpx @atproto/lex-cli gen-server --yes ./generated/server ./lexicons/**/*.json'


RUN pnpm build
RUN pnpx kysely-ctl migrate:latest

# Runner stage
FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs && \
    mkdir -p /app/data && \
    chown -R nodejs:nodejs /app/data

COPY --from=builder /app .

EXPOSE 3000

USER nodejs

CMD ["node", ".output/server/index.mjs"]
