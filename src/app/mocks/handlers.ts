import { http, HttpResponse } from "msw";
import type { Track } from "../api/tracks";

interface StoredUser {
  _id: string;
  email: string;
  password: string;
}

interface Credentials {
  email: string;
  password: string;
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem("msw_users");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem("msw_users", JSON.stringify(users));
}

function generateTokens(userId: string) {
  return {
    accessToken: `access-${userId}`,
    refreshToken: `refresh-${userId}`,
  };
}

export const handlers = [
  http.get("*/tracks", async () => {
    const response = await fetch("/tracks.json");
    const tracks = (await response.json()) as Track[];
    return HttpResponse.json(tracks);
  }),

  http.post("*/auth/register", async ({ request }) => {
    const body = (await request.json()) as Credentials;
    const users = loadUsers();

    if (users.find((u) => u.email === body.email)) {
      return HttpResponse.json(
        { code: "USER_EXISTS", message: "Пользователь уже существует" },
        { status: 400 },
      );
    }

    const newUser: StoredUser = {
      _id: crypto.randomUUID(),
      email: body.email,
      password: body.password,
    };
    users.push(newUser);
    saveUsers(users);

    return HttpResponse.json(
      { done: true, message: "Регистрация успешна" },
      { status: 201 },
    );
  }),

  http.post("*/auth/login", async ({ request }) => {
    const body = (await request.json()) as Credentials;
    const users = loadUsers();
    const user = users.find(
      (u) => u.email === body.email && u.password === body.password,
    );

    if (!user) {
      return HttpResponse.json(
        { code: "INVALID_CREDENTIALS", message: "Неверный логин или пароль" },
        { status: 400 },
      );
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    localStorage.setItem("msw_refresh_token", refreshToken);

    return HttpResponse.json({ accessToken, refreshToken });
  }),

  http.post("*/auth/refresh", () => {
    const storedRefresh = localStorage.getItem("msw_refresh_token");
    if (!storedRefresh) {
      return HttpResponse.json(
        { code: "NO_REFRESH_TOKEN", message: "Refresh token missing" },
        { status: 401 },
      );
    }

    if (!storedRefresh.startsWith("refresh-")) {
      return HttpResponse.json(
        { code: "INVALID_REFRESH_TOKEN", message: "Invalid refresh token" },
        { status: 403 },
      );
    }

    const userId = storedRefresh.replace("refresh-", "");
    const { accessToken, refreshToken } = generateTokens(userId);
    localStorage.setItem("msw_refresh_token", refreshToken);

    return HttpResponse.json({ accessToken, refreshToken });
  }),

  http.get("*/users/me", ({ request }) => {
    const auth = request.headers.get("Authorization");
    const token = auth?.replace("Bearer ", "");

    if (!token?.startsWith("access-")) {
      return HttpResponse.json(
        { code: "UNAUTHORIZED", message: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = token.replace("access-", "");
    const users = loadUsers();
    const user = users.find((u) => u._id === userId);

    if (!user) {
      return HttpResponse.json(
        { code: "UNAUTHORIZED", message: "Unauthorized" },
        { status: 401 },
      );
    }

    return HttpResponse.json({ _id: user._id, email: user.email });
  }),

  http.get("*/auth/logout", () => {
    localStorage.removeItem("msw_refresh_token");
    return HttpResponse.json({});
  }),
];
