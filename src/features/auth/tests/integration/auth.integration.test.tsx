import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

import {
  LogoutButton,
  SignInForm,
  SignUpForm,
  VerifyCodeForm,
  useAuthStore,
} from "../../";

const searchSchema = z.object({
  search: z.string().optional().default(""),
  year: z
    .string()
    .optional()
    .default("")
    .transform((s) => s.trim() || undefined),
  artists: z.array(z.string()).optional().default([]),
  genres: z.array(z.string()).optional().default([]),
});

const homeSearch = {
  search: "",
  year: undefined as string | undefined,
  artists: [] as string[],
  genres: [] as string[],
};

function renderAuthRouter(initialEntry: string) {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    beforeLoad: () => {
      if (!useAuthStore.getState().session) throw redirect({ to: "/sign-in" });
    },
    validateSearch: (raw) => searchSchema.parse(raw),
    component: () => (
      <div>
        <h1>Треки</h1>
        <LogoutButton />
      </div>
    ),
  });
  const signInRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/sign-in",
    beforeLoad: () => {
      if (useAuthStore.getState().session)
        throw redirect({ to: "/", search: homeSearch });
    },
    component: SignInForm,
  });
  const signUpRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/sign-up",
    beforeLoad: () => {
      if (useAuthStore.getState().session)
        throw redirect({ to: "/", search: homeSearch });
    },
    component: SignUpForm,
  });
  const verifyCodeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/verify-code",
    validateSearch: (search: Record<string, unknown>) => ({
      username: String(search.username ?? ""),
    }),
    beforeLoad: ({ search }) => {
      if (!search.username) throw redirect({ to: "/sign-in" });
    },
    component: VerifyCodeForm,
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    routeTree: rootRoute.addChildren([
      indexRoute,
      signInRoute,
      signUpRoute,
      verifyCodeRoute,
    ]),
  });
  const unsubscribe = useAuthStore.subscribe((state, prev) => {
    if (state.session === prev.session) return;
    void router.invalidate();
  });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { router, unsubscribe };
}

describe("auth flow", () => {
  let unsubscribe: () => void = () => {};

  afterEach(() => {
    unsubscribe();
    useAuthStore.getState().clearSession();
  });

  it("redirects guests from home to sign-in", async () => {
    ({ unsubscribe } = renderAuthRouter("/"));

    expect(await screen.findByRole("button", { name: "Войти" })).toBeVisible();
  });

  it("logs in with demo credentials and reaches home", async () => {
    const user = userEvent.setup({ delay: null });
    ({ unsubscribe } = renderAuthRouter("/sign-in"));

    await user.type(
      await screen.findByPlaceholderText("Логин"),
      "demo@music.store",
    );
    await user.type(screen.getByPlaceholderText("Пароль"), "password");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByRole("heading", { name: "Треки" })).toBeVisible();
  });

  it("logs out from home back to sign-in", async () => {
    const user = userEvent.setup({ delay: null });
    useAuthStore.getState().setSession({
      token: "msw-token:demo@music.store",
      username: "demo@music.store",
    });
    ({ unsubscribe } = renderAuthRouter("/"));

    expect(await screen.findByRole("heading", { name: "Треки" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Выйти из аккаунта" }));

    expect(await screen.findByRole("button", { name: "Войти" })).toBeVisible();
  });

  it("registers a new user, verifies the email code, then signs in", async () => {
    const user = userEvent.setup({ delay: null });
    const email = `signup-${crypto.randomUUID()}@music.store`;
    ({ unsubscribe } = renderAuthRouter("/sign-up"));

    await user.type(await screen.findByPlaceholderText("Имя"), "New");
    await user.type(screen.getByPlaceholderText("Фамилия"), "User");
    await user.type(screen.getByPlaceholderText("Логин"), email);
    await user.type(screen.getByPlaceholderText("Пароль"), "password");
    await user.type(
      screen.getByPlaceholderText("Повторите пароль"),
      "password",
    );
    await user.click(
      screen.getByRole("button", { name: "Зарегистрироваться" }),
    );

    expect(
      await screen.findByText(new RegExp(`отправленного на ${email}`)),
    ).toBeVisible();

    const otp = document.querySelector(
      'input[autocomplete="one-time-code"]',
    ) as HTMLInputElement;
    await user.type(otp, "123456");
    await user.click(screen.getByRole("button", { name: "Подтвердить" }));

    expect(await screen.findByRole("button", { name: "Войти" })).toBeVisible();

    await user.type(screen.getByPlaceholderText("Логин"), email);
    await user.type(screen.getByPlaceholderText("Пароль"), "password");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByRole("heading", { name: "Треки" })).toBeVisible();
  });

  it("sends an inactive user from login to the verification page", async () => {
    const user = userEvent.setup({ delay: null });
    const email = `inactive-${crypto.randomUUID()}@music.store`;
    ({ unsubscribe } = renderAuthRouter("/sign-up"));

    await user.type(await screen.findByPlaceholderText("Имя"), "Wait");
    await user.type(screen.getByPlaceholderText("Фамилия"), "Code");
    await user.type(screen.getByPlaceholderText("Логин"), email);
    await user.type(screen.getByPlaceholderText("Пароль"), "password");
    await user.type(
      screen.getByPlaceholderText("Повторите пароль"),
      "password",
    );
    await user.click(
      screen.getByRole("button", { name: "Зарегистрироваться" }),
    );
    expect(
      await screen.findByText(new RegExp(`отправленного на ${email}`)),
    ).toBeVisible();

    unsubscribe();
    cleanup();
    useAuthStore.getState().clearSession();
    ({ unsubscribe } = renderAuthRouter("/sign-in"));

    await user.type(await screen.findByPlaceholderText("Логин"), email);
    await user.type(screen.getByPlaceholderText("Пароль"), "password");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(`отправленного на ${email}`)),
      ).toBeVisible();
    });
  });
});
