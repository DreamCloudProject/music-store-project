import { Link } from "@tanstack/react-router";

import { Button } from "@/shared/ui/button";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#181818] px-6 text-white">
      <div className="flex max-w-full flex-col items-center text-center">
        <h1 className="m-0 mb-[2px] text-[clamp(88px,20vw,160px)] font-normal leading-none [font-feature-settings:'pnum'_on,'lnum'_on]">
          404
        </h1>
        <p className="m-0 mb-2 text-[clamp(24px,4vw,32px)] font-normal leading-[1.25] [font-feature-settings:'pnum'_on,'lnum'_on]">
          Страница не найдена
        </p>
        <p className="m-0 mb-9 max-w-[60%] text-[18px] font-normal leading-[1.33] tracking-[-0.003em] text-white/70 [font-feature-settings:'pnum'_on,'lnum'_on]">
          Возможно, она была удалена или перенесена на другой адрес
        </p>
        <Button
          asChild
          className="h-auto rounded-[6px] border-0 bg-[#580ea2] px-10 py-3.5 text-lg font-normal leading-[1.33] tracking-[-0.003em] text-white shadow-none hover:bg-[#3f007d] hover:text-white active:bg-[#271a58] active:text-white focus-visible:bg-[#3f007d] focus-visible:ring-0 [font-feature-settings:'pnum'_on,'lnum'_on]"
        >
          <Link
            to="/"
            search={{
              search: "",
              artists: [],
              genres: [],
              year: undefined,
            }}
          >
            Вернуться на главную
          </Link>
        </Button>
      </div>
    </main>
  );
}
