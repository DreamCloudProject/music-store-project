import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import { apiFetch, useAuthStore } from "../../";
import { server } from "@/app/tests/setup";

afterEach(() => {
  useAuthStore.getState().clearSession();
});

describe("apiFetch", () => {
  it("retries once after 401 when the session token is still valid", async () => {
    let catalogCalls = 0;
    server.use(
      http.get("*/api/v1/protected", () => {
        catalogCalls += 1;
        if (catalogCalls === 1) {
          return HttpResponse.json(
            { message: "unauthorized" },
            { status: 401 },
          );
        }
        return HttpResponse.json({ ok: true });
      }),
    );

    useAuthStore.getState().setSession({
      token: "msw-token:demo@music.store",
      username: "demo@music.store",
    });

    const response = await apiFetch("/api/v1/protected");

    expect(response.ok).toBe(true);
    expect(catalogCalls).toBe(2);
    expect(useAuthStore.getState().session?.username).toBe("demo@music.store");
  });

  it("clears the session when 401 cannot be renewed", async () => {
    server.use(
      http.get("*/api/v1/protected", () =>
        HttpResponse.json({ message: "unauthorized" }, { status: 401 }),
      ),
    );

    useAuthStore.getState().setSession({
      token: "msw-token:__expired__",
      username: "demo@music.store",
    });

    const response = await apiFetch("/api/v1/protected");

    expect(response.status).toBe(401);
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("clears the session when CMS returns 500 for an expired token", async () => {
    let catalogCalls = 0;
    server.use(
      http.post("*/api/v1/bean/request", () => {
        catalogCalls += 1;
        return HttpResponse.json(
          { timestamp: 1, status: 500, error: "Internal Server Error" },
          { status: 500 },
        );
      }),
    );

    useAuthStore.getState().setSession({
      token: "msw-token:__expired__",
      username: "demo@music.store",
    });

    const response = await apiFetch("/api/v1/bean/request", { method: "POST" });

    expect(response.status).toBe(500);
    expect(catalogCalls).toBe(1);
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("keeps the session when CMS returns 500 but the token is still valid", async () => {
    server.use(
      http.post("*/api/v1/bean/request", () =>
        HttpResponse.json(
          { timestamp: 1, status: 500, error: "Internal Server Error" },
          { status: 500 },
        ),
      ),
    );

    useAuthStore.getState().setSession({
      token: "msw-token:demo@music.store",
      username: "demo@music.store",
    });

    const response = await apiFetch("/api/v1/bean/request", { method: "POST" });

    expect(response.status).toBe(500);
    expect(useAuthStore.getState().session?.username).toBe("demo@music.store");
  });
});
