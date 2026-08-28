import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PlayerBar, type PlayerBarTrack } from "../../";

type MockAudio = {
  src: string;
  volume: number;
  currentTime: number;
  loop: boolean;
  preload: string;
  paused: boolean;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
  getAttribute: ReturnType<typeof vi.fn>;
  removeAttribute: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEnded: () => void;
};

const queue: PlayerBarTrack[] = [
  {
    id: "1",
    title: "Трек один",
    artist: "Артист А",
    audioUrl: "https://cdn.example/1.mp3",
  },
  {
    id: "2",
    title: "Трек два",
    artist: "Артист Б",
    audioUrl: "https://cdn.example/2.mp3",
  },
  {
    id: "3",
    title: "Трек три",
    artist: "Артист В",
    audioUrl: "https://cdn.example/3.mp3",
  },
];

let latestAudio: MockAudio | null = null;
let endedHandler: ((event: Event) => void) | null = null;

function createMockAudio(src = ""): MockAudio {
  const audio: MockAudio = {
    src,
    volume: 1,
    currentTime: 0,
    loop: false,
    preload: "",
    paused: true,
    play: vi.fn(async () => {
      audio.paused = false;
    }),
    pause: vi.fn(() => {
      audio.paused = true;
    }),
    load: vi.fn(),
    getAttribute: vi.fn((name: string) =>
      name === "src" ? audio.src || null : null,
    ),
    removeAttribute: vi.fn((name: string) => {
      if (name === "src") audio.src = "";
    }),
    addEventListener: vi.fn((type: string, handler: (event: Event) => void) => {
      if (type === "ended") endedHandler = handler;
    }),
    removeEventListener: vi.fn(),
    dispatchEnded: () => {
      endedHandler?.(new Event("ended"));
    },
  };
  latestAudio = audio;
  return audio;
}

function renderPlayerBar(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const view = render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
  return {
    ...view,
    rerender: (next: ReactElement) =>
      view.rerender(
        <QueryClientProvider client={queryClient}>{next}</QueryClientProvider>,
      ),
  };
}

describe("PlayerBar", () => {
  beforeEach(() => {
    latestAudio = null;
    endedHandler = null;
    vi.stubGlobal(
      "Audio",
      vi.fn(function MockAudioConstructor(src?: string) {
        return createMockAudio(src ?? "");
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders skeletons instead of a placeholder track", () => {
    renderPlayerBar(<PlayerBar />);

    expect(screen.getByLabelText("Загрузка трека")).toBeInTheDocument();
    expect(screen.queryByText("Баста")).not.toBeInTheDocument();
    expect(screen.queryByText("Ты та...")).not.toBeInTheDocument();
    expect(latestAudio?.play).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Воспроизвести" }),
    ).toBeDisabled();
  });

  it("starts playback for the current track and toggles pause", async () => {
    const user = userEvent.setup();
    renderPlayerBar(<PlayerBar track={queue[0]!} queue={queue} />);

    expect(latestAudio?.play).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Пауза" }));
    expect(latestAudio?.pause).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Воспроизвести" }),
    ).toBeInTheDocument();
  });

  it("applies initial volume to the audio element", () => {
    renderPlayerBar(<PlayerBar track={queue[0]!} queue={queue} />);
    expect(latestAudio?.volume).toBe(0.5);
  });

  it("updates audio volume from the desktop slider keyboard", async () => {
    const user = userEvent.setup();
    renderPlayerBar(<PlayerBar track={queue[0]!} queue={queue} />);

    const slider = screen.getByRole("slider", { name: "Громкость" });
    expect(slider).toHaveAttribute("aria-valuenow", "50");

    slider.focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");

    expect(slider).toHaveAttribute("aria-valuenow", "52");
    expect(latestAudio?.volume).toBeCloseTo(0.52);

    await user.keyboard("{Home}");
    expect(slider).toHaveAttribute("aria-valuenow", "0");
    expect(latestAudio?.volume).toBe(0);

    await user.keyboard("{End}");
    expect(slider).toHaveAttribute("aria-valuenow", "100");
    expect(latestAudio?.volume).toBe(1);
  });

  it("opens a vertical volume slider from the mobile control", async () => {
    const user = userEvent.setup();
    renderPlayerBar(<PlayerBar track={queue[0]!} queue={queue} />);

    expect(screen.getAllByRole("slider", { name: "Громкость" })).toHaveLength(
      1,
    );

    await user.click(screen.getByRole("button", { name: "Громкость" }));

    const vertical = await waitFor(() => {
      const found = screen
        .getAllByRole("slider", { name: "Громкость" })
        .find((el) => el.getAttribute("aria-orientation") === "vertical");
      expect(found).toBeTruthy();
      return found!;
    });

    vertical.focus();
    await user.keyboard("{ArrowUp}{ArrowUp}");

    expect(vertical).toHaveAttribute("aria-valuenow", "52");
    expect(latestAudio?.volume).toBeCloseTo(0.52);
    expect(
      screen.getByRole("slider", {
        name: "Громкость",
        // testing-library runtime option; missing in local ByRoleOptions typings
        orientation: "horizontal",
      } as { name: string; orientation: "horizontal" }),
    ).toHaveAttribute("aria-valuenow", "52");
  });

  it("goes to the next and previous track in the queue", async () => {
    const user = userEvent.setup();
    const onTrackChange = vi.fn();
    const { rerender } = renderPlayerBar(
      <PlayerBar
        track={queue[0]!}
        queue={queue}
        onTrackChange={onTrackChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Следующий трек" }));
    expect(onTrackChange).toHaveBeenCalledWith(queue[1]);

    onTrackChange.mockClear();
    rerender(
      <PlayerBar
        track={queue[1]!}
        queue={queue}
        onTrackChange={onTrackChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Предыдущий трек" }));
    // history from next → previous returns queue[0]
    expect(onTrackChange).toHaveBeenCalledWith(queue[0]);
  });

  it("uses track audioUrl and does not play without it", () => {
    const cmsUrl = "https://music.example/cdn/track.mp3";
    const { rerender } = renderPlayerBar(
      <PlayerBar track={{ ...queue[0]!, audioUrl: cmsUrl }} queue={queue} />,
    );
    expect(latestAudio?.src).toBe(cmsUrl);

    rerender(
      <PlayerBar
        track={{ id: "2", title: "Трек два", artist: "Артист Б" }}
        queue={queue}
      />,
    );
    expect(latestAudio?.src).toBe("");
    expect(latestAudio?.pause).toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Воспроизвести" }),
    ).toBeDisabled();
  });

  it("restarts audio when the track changes", () => {
    const { rerender } = renderPlayerBar(
      <PlayerBar track={queue[0]!} queue={queue} />,
    );
    if (latestAudio) latestAudio.currentTime = 42;

    rerender(<PlayerBar track={queue[1]!} queue={queue} />);
    expect(latestAudio?.currentTime).toBe(0);
    expect(latestAudio?.play).toHaveBeenCalled();
  });

  it("advances on audio ended when repeat is enabled at the end of the list", async () => {
    const user = userEvent.setup();
    const onTrackChange = vi.fn();
    renderPlayerBar(
      <PlayerBar
        track={queue[2]!}
        queue={queue}
        onTrackChange={onTrackChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Повторить" }));
    act(() => {
      latestAudio?.dispatchEnded();
    });

    expect(onTrackChange).toHaveBeenCalledWith(queue[0]);
  });

  it("stops at the end of the list when repeat is off", () => {
    const onTrackChange = vi.fn();
    renderPlayerBar(
      <PlayerBar
        track={queue[2]!}
        queue={queue}
        onTrackChange={onTrackChange}
      />,
    );

    act(() => {
      latestAudio?.dispatchEnded();
    });

    expect(onTrackChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Воспроизвести" }),
    ).toBeInTheDocument();
  });

  it("dismisses via drag handle and stops audio", () => {
    const onDismiss = vi.fn();
    renderPlayerBar(
      <PlayerBar track={queue[0]!} queue={queue} onDismiss={onDismiss} />,
    );

    const handle = screen.getByRole("separator", {
      name: "Скрыть плеер — потяните границу вниз",
    });

    act(() => {
      handle.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          button: 0,
          clientY: 10,
          pointerId: 1,
        }),
      );
      handle.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          button: 0,
          clientY: 100,
          pointerId: 1,
        }),
      );
    });

    expect(onDismiss).toHaveBeenCalled();
    expect(latestAudio?.pause).toHaveBeenCalled();
  });
});
