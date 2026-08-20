import { afterEach, describe, expect, it } from "vitest";

import { useAuthStore } from "../../";

afterEach(() => {
  useAuthStore.getState().clearSession();
});

describe("useAuthStore", () => {
  it("writes the session to localStorage", () => {
    useAuthStore.getState().setSession({
      token: "msw-token:demo@music.store",
      username: "demo@music.store",
    });

    expect(useAuthStore.getState().session).toEqual({
      token: "msw-token:demo@music.store",
      username: "demo@music.store",
    });
    expect(localStorage.getItem("mastermindcms-auth-session")).toBe(
      JSON.stringify({
        token: "msw-token:demo@music.store",
        username: "demo@music.store",
      }),
    );
  });

  it("clears the session and storage", () => {
    useAuthStore.getState().setSession({
      token: "msw-token:demo@music.store",
      username: "demo@music.store",
    });

    useAuthStore.getState().clearSession();

    expect(useAuthStore.getState().session).toBeNull();
    expect(localStorage.getItem("mastermindcms-auth-session")).toBeNull();
  });
});
