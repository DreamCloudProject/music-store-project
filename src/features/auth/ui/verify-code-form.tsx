import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { verifyEmail, sendVerificationEmail } from "../api/auth-api";
import { Button } from "@/shared/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/shared/ui/input-otp";

const CODE_LENGTH = 6;

export function VerifyCodeForm() {
  const router = useRouter();
  const { username } = useSearch({ strict: false });

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const { mutate: submitCode, isPending: isSubmitting } = useMutation({
    mutationFn: () =>
      verifyEmail({ token: code, username: username as string }),
    onSuccess: () => {
      router.navigate({ to: "/sign-in" });
    },
    onError: async () => {
      try {
        await sendVerificationEmail(username as string);
        setCodeError("Код недействителен. Отправлен новый.");
      } catch {
        setCodeError("Неверный код. Не удалось выслать новый.");
      }
      setCode("");
    },
  });

  const { mutate: resendCode, isPending: isResending } = useMutation({
    mutationFn: () => sendVerificationEmail(username as string),
    onSuccess: () => {
      setResendMessage("Новый код отправлен на почту");
      setCodeError(null);
      setCode("");
    },
    onError: () => {
      setCodeError("Не удалось отправить код, попробуйте позже");
      setResendMessage(null);
    },
  });

  return (
    <div className="flex w-full flex-col items-stretch">
      <p className="mb-5 text-center text-sm text-neutral-500">
        Введите код из письма, отправленного на {username}
      </p>
      <InputOTP
        maxLength={CODE_LENGTH}
        value={code}
        onChange={(val) => {
          setCode(val);
          setCodeError(null);
          setResendMessage(null);
        }}
        containerClassName="mb-[30px]"
      >
        <InputOTPGroup>
          {Array.from({ length: CODE_LENGTH }).map((_, index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <div className="mb-5 min-h-5">
        {codeError && <p className="text-sm text-red-500">{codeError}</p>}
        {resendMessage && !codeError && (
          <p className="text-sm text-green-600">{resendMessage}</p>
        )}
      </div>
      <Button
        className="mb-5"
        variant="auth"
        onClick={() => submitCode()}
        disabled={isSubmitting || code.length < CODE_LENGTH}
      >
        {isSubmitting ? "Проверяем..." : "Подтвердить"}
      </Button>
      <Button
        variant="link"
        className="h-auto p-0 text-sm font-normal text-neutral-500"
        onClick={() => {
          setCodeError(null);
          setResendMessage(null);
          resendCode();
        }}
        disabled={isResending}
      >
        {isResending ? "Отправляем..." : "Отправить новый код"}
      </Button>
    </div>
  );
}
