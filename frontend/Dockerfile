FROM node:lts-alpine AS build-stage
# Installed with npm: corepack no longer ships with recent Node images.
RUN npm install -g pnpm@11
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY ./ .
RUN pnpm run build

FROM nginx:mainline-alpine AS production-stage
RUN mkdir /app
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build-stage /app/dist /app
