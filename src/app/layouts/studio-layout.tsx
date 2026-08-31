import { Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

import { LogoutButton, useAuthStore } from "@/features/auth";
import { HeaderSearch } from "@/widgets/header-search";
import { PlayerBar, usePlaybackStore } from "@/widgets/player-bar";
import { AppMobileNav, AppSidebar } from "@/widgets/sidebar";

export function StudioLayout() {
  const currentTrack = usePlaybackStore((state) => state.currentTrack);
  const queue = usePlaybackStore((state) => state.queue);
  const selectTrack = usePlaybackStore((state) => state.selectTrack);
  const dismiss = usePlaybackStore((state) => state.dismiss);

  useEffect(
    () =>
      useAuthStore.subscribe((state, prev) => {
        if (prev.session && !state.session) {
          usePlaybackStore.getState().dismiss();
        }
      }),
    [],
  );

  return (
    <div className="flex min-h-screen bg-app-bg text-fg">
      <AppSidebar />
      <main
        className={
          currentTrack
            ? "min-h-screen min-w-0 flex-1 bg-[#181818] pb-[77px] text-white"
            : "min-h-screen min-w-0 flex-1 bg-[#181818] text-white"
        }
      >
        <div className="mx-auto w-full max-w-[1240px] px-6 py-10">
          <header className="mb-[37px] flex items-center justify-between gap-4">
            <div className="w-full">
              <AppMobileNav />
              <HeaderSearch />
            </div>
            <LogoutButton />
          </header>
          <Outlet />
        </div>

        {currentTrack ? (
          <PlayerBar
            track={currentTrack}
            queue={queue}
            onTrackChange={selectTrack}
            onDismiss={dismiss}
          />
        ) : null}
      </main>
    </div>
  );
}
