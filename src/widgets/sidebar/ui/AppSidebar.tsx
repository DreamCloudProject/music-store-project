import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";

import { cn, getResolvedIsDark, toggleTheme } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";

const homeSearch = {
  search: "",
  artists: [] as string[],
  genres: [] as string[],
  year: undefined as string | undefined,
};

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
      viewBox="0 0 20 11"
      className={cn("h-[11px] w-5", className)}
    >
      <path stroke="currentColor" d="M20 .5H0m20 5H0m20 5H0" />
    </svg>
  );
}

function LogoLink({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      search={homeSearch}
      aria-label="На главную"
      className={cn(
        "block size-12 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-linear-to-br from-[#bf6ecc] to-[#4c2cbb]",
        className,
      )}
    />
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => getResolvedIsDark());

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={
        isDark ? "Переключить на светлую тему" : "Переключить на тёмную тему"
      }
      title={
        isDark ? "Переключить на светлую тему" : "Переключить на тёмную тему"
      }
      onClick={() => {
        const next = toggleTheme();
        setIsDark(next === "dark");
      }}
      className={cn(
        "size-[39px] rounded-full p-0 text-fg shadow-none [&_svg]:size-[39px]",
        "hover:bg-transparent hover:text-accent-hover",
        "active:bg-transparent active:text-accent-active",
        "focus-visible:bg-transparent focus-visible:text-accent-hover focus-visible:ring-0",
      )}
    >
      {isDark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="39"
          height="39"
          fill="none"
          aria-hidden="true"
          viewBox="0 0 39 39"
          className="size-[39px]"
        >
          <path
            fill="currentColor"
            d="M19.2 27.4a8.2 8.2 0 0 1-.8-16.4q.5 0 .7.4 0 .4-.2.7a5 5 0 1 0 7.4 6.9.6.6 0 0 1 1.1.4 8 8 0 0 1-8.2 8M17 12.6a7 7 0 1 0 9 8.4q-1.5 1-3.5 1.1a6.3 6.3 0 0 1-5.5-9.5"
          />
          <circle cx="19.5" cy="19.5" r="19" stroke="currentColor" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="39"
          height="39"
          fill="none"
          aria-hidden="true"
          viewBox="0 0 39 39"
          className="size-[39px]"
        >
          <path
            fill="currentColor"
            d="M19.8 25.6a6.2 6.2 0 1 1 0-12.4 6.2 6.2 0 0 1 0 12.4m0-11.2a5 5 0 1 0 0 10 5 5 0 0 0 0-10m0-3.6-.6-.6V7.6a.6.6 0 0 1 1.3 0v2.6q0 .6-.7.6M26 14a.6.6 0 0 1-.4-1l2.2-2.3a.6.6 0 0 1 .9.9l-2.2 2.2zm-13.4 0-.4-.2-2.2-2.2a.6.6 0 0 1 .9-.9L13 13a.6.6 0 0 1-.5 1.1m6.8 17.6-.6-.6v-2.6a.6.6 0 1 1 1.3 0v2.6q0 .6-.7.6M11 28.2a.6.6 0 0 1-.5-1l2.2-2.3a.6.6 0 1 1 .9 1L11.4 28q-.2.2-.5.2m17.8 0-.4-.2-2.2-2.2a.6.6 0 1 1 .9-.9l2.2 2.3a.6.6 0 0 1-.5 1M10.4 20H7.6a.6.6 0 1 1 0-1.2h2.8a.6.6 0 0 1 0 1.2m21.2 0h-3.4a.6.6 0 1 1 0-1.2h3.4a.6.6 0 0 1 0 1.2"
          />
          <circle cx="19.5" cy="19.5" r="19" stroke="currentColor" />
        </svg>
      )}
    </Button>
  );
}

function SidebarNav({
  onNavigate,
  id,
}: {
  onNavigate?: () => void;
  id?: string;
}) {
  const navLinkClassName = cn(
    "block cursor-pointer font-normal text-base leading-[1.15] tracking-[0.001em] text-fg no-underline",
    "hover:text-accent-hover focus-visible:text-accent-hover focus-visible:outline-none",
    "active:text-accent-active data-[status=active]:text-accent-hover",
  );
  const navActiveProps = {
    className: "text-accent-hover",
    "aria-current": "page" as const,
  };
  const navActiveOptions = { exact: true, includeSearch: false };

  return (
    <nav id={id} aria-label="Основная навигация">
      <ul className="flex flex-col gap-[25px]">
        <li>
          <Link
            to="/"
            search={homeSearch}
            title="Главное"
            className={navLinkClassName}
            activeProps={navActiveProps}
            activeOptions={navActiveOptions}
            onClick={onNavigate}
          >
            Главное
          </Link>
        </li>
        <li>
          <Link
            to="/my-tracks"
            search={{ search: "" }}
            title="Мои треки"
            className={navLinkClassName}
            activeProps={navActiveProps}
            activeOptions={navActiveOptions}
            onClick={onNavigate}
          >
            Мои треки
          </Link>
        </li>
        <li>
          <Button
            type="button"
            variant="ghost"
            title="Выйти из аккаунта"
            className={cn(
              navLinkClassName,
              "h-auto justify-start rounded-none p-0 shadow-none",
              "hover:bg-transparent active:bg-transparent focus-visible:ring-0",
            )}
            onClick={onNavigate}
          >
            Выйти
          </Button>
        </li>
        <li className="flex gap-2">
          <ThemeToggle />
        </li>
      </ul>
    </nav>
  );
}

const burgerButtonClassName = cn(
  "size-auto shrink-0 rounded-none p-0 text-icon-muted shadow-none [&_svg]:size-auto",
  "hover:bg-transparent hover:text-icon-hover",
  "active:bg-transparent active:text-fg",
  "focus-visible:bg-transparent focus-visible:text-icon-hover focus-visible:ring-0",
);

/** Desktop (≥ md / 768px): боковая колонка с Collapsible, как в макете. */
export function AppSidebar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <aside className="hidden w-[244px] shrink-0 flex-col bg-sidebar-bg px-9 py-[23px] md:flex">
      <LogoLink className="mb-[23px]" />

      <Collapsible
        open={menuOpen}
        onOpenChange={setMenuOpen}
        className="relative"
      >
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Меню"
            aria-controls="sidebar-nav"
            aria-expanded={menuOpen}
            className={cn(burgerButtonClassName, "mb-[30px]")}
          >
            <MenuIcon />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <SidebarNav id="sidebar-nav" />
        </CollapsibleContent>
      </Collapsible>
    </aside>
  );
}

/** Mobile (< md / 768px): логотип + бургер в шапке рядом с поиском, меню в Sheet. */
export function AppMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex shrink-0 items-center gap-4 md:hidden">
      <LogoLink />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Меню"
            className={burgerButtonClassName}
          >
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[min(100%,244px)] gap-0 border-row-border bg-sidebar-bg px-4 pb-9 pt-[23px] text-fg sm:max-w-[244px]"
        >
          <SheetTitle className="sr-only">Меню</SheetTitle>
          <SheetClose
            aria-label="Закрыть меню"
            className={cn(
              "absolute right-4 top-4 cursor-pointer rounded-sm bg-transparent p-0 text-fg shadow-none",
              "hover:bg-transparent hover:text-accent-hover",
              "active:bg-transparent active:text-accent-active",
              "focus-visible:bg-transparent focus-visible:text-accent-hover focus-visible:outline-none focus-visible:ring-0",
            )}
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Закрыть</span>
          </SheetClose>
          <LogoLink className="mb-[23px]" />
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
