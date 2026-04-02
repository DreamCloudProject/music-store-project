import { SignInForm } from "@/features/auth/ui/sign-in-form";

export function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="flex w-full max-w-[366px] flex-col items-center gap-[30px] rounded-xl bg-white p-11 pt-[30px]">
        <img className="h-12 w-12" src="/logo.png" alt="logo" />
        <SignInForm />
      </div>
    </div>
  );
}
