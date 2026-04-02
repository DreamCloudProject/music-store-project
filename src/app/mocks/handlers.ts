import { http, HttpResponse } from "msw";
import type { Track } from "../api/tracks";

interface StoredUser {
  id: string;
  username: string;
  password: string;
}

interface Credentials {
  username: string;
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

export const handlers = [
  http.get("*/track", async () => {
    const response = await fetch("/tracks.json");
    const tracks = (await response.json()) as Track[];
    return HttpResponse.json(tracks);
  }),

  http.post("*/register", async ({ request }) => {
    const body = (await request.json()) as Credentials;
    const users = loadUsers();

    if (users.find((u) => u.username === body.username)) {
      return HttpResponse.json(
        { message: "Пользователь уже существует" },
        { status: 409 },
      );
    }

    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      username: body.username,
      password: body.password,
    };
    users.push(newUser);
    saveUsers(users);

    return HttpResponse.json(
      { message: "Регистрация успешна" },
      { status: 201 },
    );
  }),

  http.post("*/login", async ({ request }) => {
    const body = (await request.json()) as Credentials;
    const users = loadUsers();
    const user = users.find(
      (u) => u.username === body.username && u.password === body.password,
    );

    if (!user) {
      return HttpResponse.json(
        { message: "Неверный логин или пароль" },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      token: `token-${user.id}`,
      user: { id: user.id, username: user.username },
    });
  }),

  http.get("*/me", ({ request }) => {
    const auth = request.headers.get("Authorization");
    const token = auth?.replace("Bearer ", "");

    if (!token?.startsWith("token-")) {
      return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = token.replace("token-", "");
    const users = loadUsers();
    const user = users.find((u) => u.id === userId);

    if (!user) {
      return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return HttpResponse.json({ id: user.id, username: user.username });
  }),
];
