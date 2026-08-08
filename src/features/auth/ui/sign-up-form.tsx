import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

import {
  checkEmail,
  isUserActive,
  register,
  sendVerificationEmail,
} from "../api/auth-api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export function SignUpForm() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    mutate: submitRegister,
    isPending,
    reset,
  } = useMutation({
    mutationFn: async () => {
      const isTaken = await checkEmail(email);

      if (isTaken) {
        const active = await isUserActive(email);
        if (!active) {
          await sendVerificationEmail(email);
          return { redirectToVerify: true };
        }
        throw new Error("Этот email уже занят");
      }

      await register({ firstName, lastName, email, password });
      return { redirectToVerify: true };
    },
    onSuccess: (data) => {
      if (data.redirectToVerify) {
        router.navigate({ to: "/verify-code", search: { username: email } });
      }
    },
    onError: (error) => {
      setFormError(error.message ?? "Ошибка регистрации");
    },
  });

  function handleSubmit() {
    setFormError(null);
    if (password !== confirmPassword) {
      setFormError("Пароли не совпадают");
      return;
    }
    submitRegister();
  }

  const isDisabled =
    isPending ||
    !firstName.trim() ||
    !lastName.trim() ||
    !email.trim() ||
    !password.trim() ||
    !confirmPassword.trim();

  return (
    <div className="flex w-full flex-col gap-5">
      <Input
        placeholder="Имя"
        type="text"
        name="firstName"
        autoComplete="given-name"
        value={firstName}
        onChange={(e) => {
          setFirstName(e.target.value);
          reset();
        }}
      />
      <Input
        placeholder="Фамилия"
        type="text"
        name="lastName"
        autoComplete="family-name"
        value={lastName}
        onChange={(e) => {
          setLastName(e.target.value);
          reset();
        }}
      />
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
        autoComplete="new-password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          reset();
        }}
      />
      <Input
        placeholder="Повторите пароль"
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          reset();
        }}
      />
      <div className="h-5">
        {formError && <p className="text-sm text-red-500">{formError}</p>}
      </div>
      <div className="flex flex-col gap-5">
        <Button variant="auth" onClick={handleSubmit} disabled={isDisabled}>
          {isPending ? "Регистрируем..." : "Зарегистрироваться"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.navigate({ to: "/sign-in" })}
        >
          Войти
        </Button>
      </div>
    </div>
  );
}
