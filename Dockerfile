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

# Runner stage
FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app .

EXPOSE 3000

CMD ["sh", "-c", "npx kysely-ctl migrate:latest && node .output/server/index.mjs"]
