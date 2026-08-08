import { AuthLayout } from "@/features/auth/ui/auth-layout";
import { SignInForm } from "@/features/auth/ui/sign-in-form";

export function SignInPage() {
  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  );
}
