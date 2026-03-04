# Версия Node: по умолчанию 22; для совпадения с .nvmrc задайте build-arg NODE_VERSION=25 (или из .nvmrc)
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /app

# Как в pages.yml: зависимости строго по lockfile. .nvmrc — при смене версии ноды пересоберётся слой
COPY package.json package-lock.json .nvmrc ./
RUN npm ci

COPY . .

# Проверки перед сборкой (как в CI)
RUN npm run lint && npm run typecheck && npm run test
RUN npm run build

# Финальный образ: Chainguard nginx — минимальная база (Wolfi), без shell/apk, обновления и меньше CVE.
# Слушает порт 8080 (unprivileged).
FROM cgr.dev/chainguard/nginx:latest

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
