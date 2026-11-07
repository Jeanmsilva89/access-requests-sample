# Build context is the repository root; only this app and shared are copied.
FROM node:22-alpine AS dependencies
RUN npm install -g pnpm@9.15.9
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared ./packages/shared
COPY apps/access-requests/package.json ./apps/access-requests/package.json
RUN pnpm install --frozen-lockfile --filter @apps/access-requests...
COPY apps/access-requests ./apps/access-requests

FROM dependencies AS build
# Public build-time URL only; never secrets. Empty means same-origin real API.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm --dir apps/access-requests build

# Explicit opt-in sandbox image, not part of the deployable frontend image.
FROM dependencies AS sandbox
ENV NODE_ENV=development
USER node
WORKDIR /repo/apps/access-requests
EXPOSE 4010
CMD ["node", "mocks/src/server.js"]

FROM nginxinc/nginx-unprivileged:stable-alpine AS web
COPY apps/access-requests/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/access-requests/web/dist /usr/share/nginx/html
EXPOSE 8080
