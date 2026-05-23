import { AuthLayout } from "@/features/auth/ui/auth-layout";
import { SignUpForm } from "@/features/auth/ui/sign-up-form";

export function SignUpPage() {
  return (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  );
}
