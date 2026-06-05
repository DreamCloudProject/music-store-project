# Music Store

Фронтенд приложение для музыкального сервиса.

---

# Стек

- Vite
- TypeScript
- React
- TanStack Router
- Zustand
- TanStack Query
- shadcn/ui
- MSW
- Axios
- Tailwind CSS
- Lucide

---

# Как запустить

### 1. Клонировать репозиторий

git clone https://github.com/DreamCloudProject/music-store-project.git

cd music-store-project

### 2. Установить зависимости

```bash
nvm use $(cat .nvmrc)
npm ci
# npm ci --omit=dev - for production
```

(или `npm install` — обновит lock при необходимости.)

### 3. Запустить dev-сервер

```bash
npm run dev
```

Приложение будет доступно: http://localhost:5173

### Сборка

```bash
npm run build
npm run preview
```

---

## Запуск в Docker

Из корня репозитория:

```bash
docker compose up --build
```

Приложение будет доступно на http://localhost:8080.
