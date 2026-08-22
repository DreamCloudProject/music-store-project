interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#000000d9]">
      <div className="flex w-full min-w-[366px] max-w-[366px] flex-col items-center rounded-[12px] bg-white px-[41px] pb-[47px] pt-[47px]">
        <img
          className="mb-5 h-12 w-12 rounded-[12px]"
          src="/assets/logo.png"
          alt="MusicLab"
        />
        {children}
      </div>
    </div>
  );
}
