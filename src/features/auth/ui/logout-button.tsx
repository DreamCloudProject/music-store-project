import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib";

import { logout } from "../api/auth-api";
import { useAuthStore } from "../model/auth-store";

export function LogoutButton({ className }: { className?: string }) {
  const handleLogout = async () => {
    await logout();
    useAuthStore.getState().clearSession();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-10 w-10 shrink-0 rounded-full p-0 text-white hover:bg-transparent hover:text-[#D9B6FF] focus-visible:ring-0 focus-visible:text-[#D9B6FF] active:bg-transparent active:text-[#AD61FF] [&_svg]:size-10",
        className,
      )}
      aria-label="Выйти из аккаунта"
      onClick={() => {
        void handleLogout();
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        fill="none"
        aria-hidden="true"
        viewBox="0 0 40 40"
        className="block [shape-rendering:crispEdges]"
      >
        <rect
          width="10.93"
          height="16.81"
          x="13.53"
          y="11.59"
          stroke="currentColor"
          strokeDasharray="35.2 8.56"
          strokeDashoffset="23.81"
          strokeLinecap="round"
          strokeWidth="1.5"
          rx="2.5"
          ry="2.5"
        />
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M20 20h14.8m0 0-3.2 3.2m3.2-3.2-3.2-3.2"
        />
        <circle
          cx="20"
          cy="20"
          r="19.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </Button>
  );
}
