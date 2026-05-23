import { AuthLayout } from "@/features/auth/ui/auth-layout";
import { VerifyCodeForm } from "@/features/auth/ui/verify-code-form";

export function VerifyCodePage() {
  return (
    <AuthLayout>
      <VerifyCodeForm />
    </AuthLayout>
  );
}
