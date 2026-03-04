# music-store-project
This repository contains simple test application for music store.

## Запуск в Docker

Из корня репозитория:

```bash
docker compose up --build
```

Приложение будет доступно на http://localhost:8080.

Чтобы собирать образ с той же мажорной версией Node, что и в `.nvmrc`:

```bash
NODE_VERSION=$(cat .nvmrc | cut -d. -f1) docker compose up --build
```
