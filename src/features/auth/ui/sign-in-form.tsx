import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { login } from "@/app/api/auth";
import { useAuthStore } from "@/app/store/auth";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { getErrorMessage } from "@/app/api/client";

export function SignInForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => login(username, password),
    onSuccess: (data) => {
      useAuthStore.getState().setUser(data.user);
      router.navigate({ to: "/" });
    },
  });

  return (
    <div className="flex w-full flex-col gap-[20px]">
      <Input
        placeholder="Логин"
        type="text"
        name="username"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Input
        placeholder="Пароль"
        type="password"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="h-5">
        {error && (
          <p className="text-sm text-red-500">
            {getErrorMessage(error, "Ошибка входа")}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-[20px]">
        <Button
          variant="auth"
          onClick={() => mutate()}
          disabled={isPending || !username.trim() || !password.trim()}
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
