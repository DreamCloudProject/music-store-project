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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setUser = useAuthStore((s) => s.setUser);

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (data) => {
      setUser(data.user);
      router.navigate({ to: "/" });
    },
  });

  return (
    <div className="flex w-full flex-col gap-[20px]">
      <Input
        placeholder="Email"
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          reset();
        }}
      />
      <Input
        placeholder="Пароль"
        type="password"
        name="password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          reset();
        }}
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
