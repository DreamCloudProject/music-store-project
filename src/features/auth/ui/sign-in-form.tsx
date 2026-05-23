import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { login, isUserActive, checkEmail } from "../api/auth-api";
import { useAuthStore } from "../model/auth-store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export function SignInForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    mutate: submitLogin,
    isPending,
    reset,
  } = useMutation({
    mutationFn: () => login({ username: email, password }),
    onSuccess: (data) => {
      setSession({ token: data.token, username: email });
      router.invalidate();
    },
    onError: async () => {
      try {
        const taken = await checkEmail(email);
        if (!taken) {
          setFormError("Неверный email или пароль");
          return;
        }
        const active = await isUserActive(email);
        if (!active) {
          router.navigate({ to: "/verify-code", search: { username: email } });
          return;
        }
      } catch {
        setFormError("Произошла ошибка. Попробуйте позже");
        return;
      }
      setFormError("Неверный email или пароль");
    },
  });

  return (
    <div className="flex w-full flex-col gap-5">
      <Input
        placeholder="Email"
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          reset();
          setFormError(null);
        }}
      />
      <Input
        placeholder="Пароль"
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          reset();
          setFormError(null);
        }}
      />
      <div className="h-5">
        {formError && <p className="text-sm text-red-500">{formError}</p>}
      </div>
      <div className="flex flex-col gap-5">
        <Button
          variant="auth"
          onClick={() => submitLogin()}
          disabled={isPending || !email.trim() || !password.trim()}
        >
          {isPending ? "Входим..." : "Войти"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.navigate({ to: "/sign-up" })}
        >
          Зарегистрироваться
        </Button>
      </div>
    </div>
  );
}
