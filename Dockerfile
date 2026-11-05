FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --ignore-scripts
COPY . .
RUN npx svelte-kit sync && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
# Schema + config so `drizzle-kit push` can run from this image at deploy time.
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/src/lib/server/db/schema.ts ./src/lib/server/db/schema.ts

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD node build
