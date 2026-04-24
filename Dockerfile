FROM cgr.dev/chainguard/node:latest-dev AS build
WORKDIR /app
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/backend ./packages/backend
RUN corepack enable && pnpm install --filter @shiptoprod/backend
RUN pnpm --filter @shiptoprod/backend build

FROM cgr.dev/chainguard/node:latest
WORKDIR /app
COPY --from=build /app /app
ENV PORT=3000
EXPOSE 3000
CMD ["packages/backend/dist/server.js"]
