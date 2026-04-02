import { SignUpForm } from "@/features/auth/ui/sign-up-form";

export function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="flex w-full max-w-[366px] flex-col items-center gap-[30px] rounded-xl bg-white p-11 pt-[30px]">
        <img className="h-12 w-12" src="/logo.png" alt="logo" />
        <SignUpForm />
      </div>
    </div>
  );
}
