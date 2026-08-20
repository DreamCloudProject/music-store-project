import { useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuthStore } from "../../model/auth-store";
import { AuthLayout } from "../../ui/auth-layout";
import { LogoutButton } from "../../ui/logout-button";
import { SignInForm } from "../../ui/sign-in-form";
import { SignUpForm } from "../../ui/sign-up-form";
import { VerifyCodeForm } from "../../ui/verify-code-form";

export function AuthScreens() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  useEffect(() => {
    return useAuthStore.subscribe((state, prev) => {
      if (state.session === prev.session) return;
      void router.invalidate();
    });
  }, [router]);

  if (session) {
    return (
      <div className="flex min-h-screen flex-col bg-[#181818] px-8 py-10 text-white">
        <header className="mb-8 flex items-center justify-end">
          <LogoutButton />
        </header>
        <h1 className="text-2xl font-semibold">Треки</h1>
      </div>
    );
  }

  if (pathname === "/sign-up") {
    return (
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    );
  }

  if (pathname === "/verify-code") {
    return (
      <AuthLayout>
        <VerifyCodeForm />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  );
}
