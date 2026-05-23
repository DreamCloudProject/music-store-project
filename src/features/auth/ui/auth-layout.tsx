interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="flex w-full max-w-91.5 flex-col items-center gap-7.5 rounded-xl bg-white p-11 pt-7.5">
        <img className="h-12 w-12" src="/assets/logo.png" alt="logo" />
        {children}
      </div>
    </div>
  );
}
