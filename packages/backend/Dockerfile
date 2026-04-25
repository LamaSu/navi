FROM cgr.dev/chainguard/node:latest-dev AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --include=dev

FROM cgr.dev/chainguard/node:latest-dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src
COPY public ./public
ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000
CMD ["./node_modules/.bin/tsx", "src/server.ts"]
