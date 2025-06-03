FROM node:24 as base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm install -g pnpm

RUN apt-get update && apt-get install -y zsh

# make lexdir if not exists
RUN mkdir -p ./generated

RUN zsh -c 'cat ./lexicons/**/*.json'

# Generate client + server lexicons
RUN zsh -c 'pnpx @atproto/lex-cli gen-api ./generated/api ./lexicons/**/*.json'
RUN zsh -c 'pnpx @atproto/lex-cli gen-server ./generated/server ./lexicons/**/*.json'

RUN pnpm build

# stage 2
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app/data
COPY --from=builder /app/.output ./.output
EXPOSE 3000

USER nodejs

CMD ["node", ".output/server/index.mjs"]
