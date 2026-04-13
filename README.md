# Music Store

Фронтенд приложение для музыкального сервиса.

---

# Стек

- React
- TypeScript
- Vite
- Zustand
- Tailwind CSS
- shadcn/ui
- TanStack Router

---

# Как запустить

### 1. Клонировать репозиторий

```bash
git clone https://github.com/DreamCloudProject/music-store-project.git

cd music-store-project
```

---

### 2. Установить зависимости

```bash
npm install
```

---

### 3. Запустить dev-сервер

```bash
npm run dev
```

Приложение будет доступно: http://localhost:5173

## Запуск в Docker

Из корня репозитория:

```bash
docker compose up --build
```

Приложение будет доступно на http://localhost:8080.

## Запуск с разным бэкендом

### С MSW (по умолчанию)

Скопируй `.env.example` в `.env`:

```bash
cp .env.example .env
```

Запусти проект:

```bash
npm run dev
```

### С реальным бэкендом

В `.env` укажи адрес сервера:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

Инструкция по запуску бэкенда: https://github.com/mrerberg/musiclab-api
