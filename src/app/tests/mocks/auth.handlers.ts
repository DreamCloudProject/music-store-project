import { http, HttpResponse } from "msw";
import { z } from "zod";

type MockUser = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  active: boolean;
  verificationCode: string;
};

const MOCK_VERIFICATION_CODE = "123456";

const users = new Map<string, MockUser>([
  [
    "demo@music.store",
    {
      email: "demo@music.store",
      password: "password",
      firstName: "Demo",
      lastName: "User",
      active: true,
      verificationCode: MOCK_VERIFICATION_CODE,
    },
  ],
]);

function persistUsers() {
  if (import.meta.env.MODE === "test") return;
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem("msw-users", JSON.stringify([...users.values()]));
}

(() => {
  if (import.meta.env.MODE === "test") return;
  if (typeof sessionStorage === "undefined") return;
  const stored = z
    .array(
      z.object({
        email: z.string(),
        password: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        active: z.boolean(),
        verificationCode: z.string(),
      }),
    )
    .safeParse(JSON.parse(sessionStorage.getItem("msw-users") ?? "[]")).data;
  for (const user of stored ?? []) {
    users.set(user.email, user);
  }
})();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function issueToken(email: string) {
  return `msw-token:${email}`;
}

function tokenEmail(token: string) {
  if (!token.startsWith("msw-token:")) return null;
  return normalizeEmail(token.slice("msw-token:".length));
}

function setVerificationCode(user: MockUser) {
  user.verificationCode = MOCK_VERIFICATION_CODE;
  persistUsers();
}

export function requestUserEmail(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return tokenEmail(auth.slice("Bearer ".length).trim());
}

/** 401 если Bearer есть, но токен невалиден. Без заголовка — пропуск (каталог/тесты). */
export function unauthorizedIfInvalidBearer(request: Request): Response | null {
  const auth = request.headers.get("Authorization");
  if (!auth) return null;
  if (!auth.startsWith("Bearer ")) {
    return HttpResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  const token = auth.slice("Bearer ".length).trim();
  const email = tokenEmail(token);
  const user = email ? users.get(email) : undefined;

  if (!user?.active) {
    return HttpResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  return null;
}

/** Debug: все mock-пользователи с raw password (только при MSW). */
export function dumpMockAuthUsers(): MockUser[] {
  return [...users.values()].map((user) => ({ ...user }));
}

declare global {
  interface Window {
    __dumpMswUsers?: () => MockUser[];
    __expireMswSession?: () => void;
  }
}

if (
  import.meta.env.VITE_ENABLE_MSW === "true" &&
  typeof window !== "undefined"
) {
  window.__dumpMswUsers = () => {
    const list = dumpMockAuthUsers();
    // eslint-disable-next-line no-console -- debug helper for local MSW users
    console.table(list);
    return list;
  };

  window.__expireMswSession = () => {
    const raw = localStorage.getItem("mastermindcms-auth-session");
    if (!raw) return;
    const session = z
      .object({ token: z.string(), username: z.string() })
      .safeParse(JSON.parse(raw)).data;
    if (!session) return;
    localStorage.setItem(
      "mastermindcms-auth-session",
      JSON.stringify({ ...session, token: "msw-token:__expired__" }),
    );
    location.reload();
  };
}

/** Bean-функции auth. `null` — не auth, пусть отвечает tracks-handler. */
export function handleAuthBean(body: unknown): Response | null {
  const bean = z
    .looseObject({
      beanId: z.string().optional(),
      functionName: z.string().optional(),
      args: z.array(z.unknown()).optional(),
    })
    .safeParse(body).data;

  if (!bean?.functionName) return null;

  if (bean.functionName === "isEmailTaken") {
    const email = z.object({ "0": z.string() }).safeParse(bean.args?.[0])
      .data?.["0"];
    if (!email) return HttpResponse.json({ result: false });
    return HttpResponse.json({
      result: users.has(normalizeEmail(email)),
    });
  }

  if (bean.functionName === "isUserActive") {
    const email = z.object({ "0": z.string() }).safeParse(bean.args?.[0])
      .data?.["0"];
    if (!email) return HttpResponse.json({ result: false });
    const user = users.get(normalizeEmail(email));
    return HttpResponse.json({ result: user?.active ?? false });
  }

  if (bean.functionName === "sendVerificationEmail") {
    const username = z
      .object({
        "0": z.union([z.string(), z.object({ username: z.string() })]),
      })
      .safeParse(bean.args?.[0]).data?.["0"];
    const email = typeof username === "string" ? username : username?.username;
    if (!email) {
      return HttpResponse.json(
        { message: "username required" },
        { status: 400 },
      );
    }
    const user = users.get(normalizeEmail(email));
    if (!user) {
      return HttpResponse.json({ message: "user not found" }, { status: 404 });
    }
    setVerificationCode(user);
    return HttpResponse.json({ result: true });
  }

  if (bean.functionName === "validateVerificationToken") {
    const token = z.object({ "0": z.string() }).safeParse(bean.args?.[0])
      .data?.["0"];
    if (!token) return HttpResponse.json({ result: false });
    const match = [...users.values()].some(
      (user) => user.verificationCode === token,
    );
    return HttpResponse.json({ result: match });
  }

  if (bean.functionName === "registerCustomerFull") {
    const profile = z
      .object({
        "0": z.object({
          profiles: z
            .array(
              z.object({
                firstName: z.string(),
                lastName: z.string(),
                emailAddress: z.string(),
                user: z.object({
                  username: z.string(),
                  password: z.string(),
                }),
              }),
            )
            .min(1),
        }),
      })
      .safeParse(bean.args?.[0]).data?.["0"].profiles[0];

    if (!profile) {
      return HttpResponse.json(
        { message: "invalid register payload" },
        { status: 400 },
      );
    }

    const email = normalizeEmail(profile.emailAddress || profile.user.username);
    if (users.has(email)) {
      return HttpResponse.json({ message: "email taken" }, { status: 409 });
    }

    users.set(email, {
      email,
      password: profile.user.password,
      firstName: profile.firstName,
      lastName: profile.lastName,
      active: false,
      verificationCode: MOCK_VERIFICATION_CODE,
    });
    persistUsers();

    return HttpResponse.json({ result: true });
  }

  return null;
}

export const authHttpHandlers = [
  http.post("*/api/v1/auth/token", async ({ request }) => {
    const payload = z
      .object({
        username: z.string(),
        password: z.string(),
      })
      .safeParse(await request.json()).data;

    if (!payload) {
      return HttpResponse.json({ message: "bad request" }, { status: 400 });
    }

    const user = users.get(normalizeEmail(payload.username));
    if (!user || user.password !== payload.password || !user.active) {
      return HttpResponse.json(
        { message: "invalid credentials" },
        { status: 401 },
      );
    }

    return HttpResponse.json({ token: issueToken(user.email) });
  }),

  http.post("*/api/v1/auth/verify", async ({ request }) => {
    const payload = z
      .object({
        token: z.string(),
        username: z.string(),
      })
      .safeParse(await request.json()).data;

    if (!payload) {
      return HttpResponse.json({ message: "bad request" }, { status: 400 });
    }

    const user = users.get(normalizeEmail(payload.username));
    if (!user || user.verificationCode !== payload.token) {
      return HttpResponse.json({ message: "invalid code" }, { status: 400 });
    }

    user.active = true;
    persistUsers();
    return HttpResponse.json({ result: true });
  }),

  http.post("*/api/v1/auth/validate-token", async ({ request }) => {
    const payload = z
      .object({
        token: z.string(),
        username: z.string(),
      })
      .safeParse(await request.json()).data;

    if (!payload) {
      return new HttpResponse(null, { status: 400 });
    }

    const user = users.get(normalizeEmail(payload.username));
    const ok =
      !!user?.active &&
      (payload.token === issueToken(user.email) ||
        payload.token === user.verificationCode);

    if (!ok) {
      return new HttpResponse(null, { status: 401 });
    }

    return new HttpResponse(null, { status: 200 });
  }),

  http.post("*/api/v1/logout", () => HttpResponse.json({ result: true })),
];
