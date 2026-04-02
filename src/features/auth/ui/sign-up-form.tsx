import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { register } from "@/app/api/auth";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { getErrorMessage } from "@/app/api/client";

export function SignUpForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [validationError, setValidationError] = useState("");
  const checkInfo =
    !username.trim() || !password.trim() || !passwordConfirm.trim();

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => register(username, password),
    onSuccess: () => router.navigate({ to: "/sign-in" }),
  });

  const handleSubmit = () => {
    if (checkInfo) {
      setValidationError("Заполните все поля");
      return;
    }
    if (password !== passwordConfirm) {
      setValidationError("Пароли не совпадают");
      return;
    }
    setValidationError("");
    mutate();
  };

  return (
    <div
      className="flex w-full flex-col gap-[20px]"
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSubmit();
      }}
    >
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
      <Input
        placeholder="Повторите пароль"
        type="password"
        name="passwordConfirm"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
      />
      <div className="h-5">
        {(validationError || error) && (
          <p className="text-sm text-red-500">
            {validationError || getErrorMessage(error, "Ошибка регистрации")}
          </p>
        )}
      </div>
      <Button
        variant="auth"
        onClick={handleSubmit}
        disabled={isPending || checkInfo}
      >
        {isPending ? "Регистрируем..." : "Зарегистрироваться"}
      </Button>
    </div>
  );
}
