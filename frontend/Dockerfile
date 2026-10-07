# ==============================================================================
# Build stage
# ==============================================================================
FROM node:26.5.0-alpine AS build

# Installed with npm: corepack no longer ships with recent Node images.
# git: pnpm fetches the design system (a GitHub dependency) with it.
RUN apk add --no-cache git && npm install -g pnpm@11
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --ignore-scripts: `quasar prepare` (postinstall) needs the sources, it runs
# again as part of `quasar build` below.
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm run build

# ==============================================================================
# Production stage: unprivileged nginx on 8080
# ==============================================================================
FROM nginxinc/nginx-unprivileged:stable-alpine-slim

# The alpine base lags Alpine's package repo: take every fixed package.
USER root
RUN apk upgrade --no-cache
USER 101

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/spa /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/ready || exit 1
