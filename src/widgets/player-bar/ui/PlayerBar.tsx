import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type Dispatch,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
} from "react";

import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Slider } from "@/shared/ui/slider";

import { pickSiblingTrack } from "../lib/player-queue";

export interface PlayerBarTrack {
  id?: string;
  title: string;
  artist: string;
  coverUrl?: string;
  /** CMS documentURLs; без URL — DEMO_AUDIO_SRC. */
  audioUrl?: string;
  favorite?: boolean;
}

export interface PlayerBarProps {
  track?: PlayerBarTrack;
  /** Текущий видимый список (поиск / фильтры / плейлист). */
  queue?: PlayerBarTrack[];
  onTrackChange?: (track: PlayerBarTrack) => void;
  onDismiss?: (() => void) | undefined;
  className?: string;
}

const PLAYER_HEIGHT_PX = 77;
const DISMISS_DRAG_PX = 56;
/** Визуальный зазор между иконками управления; hit-area = gap/3 с каждой стороны. */
const CONTROL_GAP_PX = 25;
const CONTROL_HIT_PAD_PX = CONTROL_GAP_PX / 3;
const CONTROL_GAP_REMAIN_PX = CONTROL_GAP_PX / 3;
/** Как между обложкой и названием. */
const META_GAP_PX = 17;
/** Фолбек, если у трека нет audioUrl (локальный каталог / нет documentURLs). */
const DEMO_AUDIO_SRC =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

function resolveAudioSrc(track: PlayerBarTrack): string {
  return track.audioUrl?.trim() || DEMO_AUDIO_SRC;
}

function VolumeGlyph({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="18"
      fill="none"
      aria-hidden="true"
      className={cn("block h-[18px] w-[14px] shrink-0", className)}
      viewBox="-2.5 -3 17 24"
    >
      <path
        fill="currentColor"
        d="M3 5v1h.4l.3-.3zm5-5h1v-2.4L7.3-.7zM0 5V4h-1v1zm0 8h-1v1h1zm3 0 .7-.7-.3-.3H3zm5 5-.7.7L9 20.4V18zM3.7 5.7l5-5L7.3-.7l-5 5zM0 6h3V4H0zm1 7V5h-2v8zm2-1H0v2h3zm5.7 5.3-5-5-1.4 1.4 5 5zM7 0v18h2V0z"
      />
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        d="M11 13c1.1 0 2-1.8 2-4s-.9-4-2-4"
      />
    </svg>
  );
}

function VolumeSlider({
  volume,
  onVolumeChange,
  orientation = "horizontal",
  className,
  style,
}: {
  volume: number;
  onVolumeChange: (value: number) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Slider
      min={0}
      max={100}
      step={1}
      orientation={orientation}
      value={[volume]}
      onValueChange={([next]) => onVolumeChange(next ?? 0)}
      aria-label="Громкость"
      className={cn("player-bar-volume-slider", className)}
      style={style}
      trackClassName="rounded-[6px] bg-volume-track"
      rangeClassName="bg-volume-range"
      thumbClassName="size-3 border-2 border-volume-track bg-volume-thumb-bg shadow-none focus-visible:ring-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-volume-track"
    />
  );
}

function NoteCover({ coverUrl }: { coverUrl?: string }) {
  const [broken, setBroken] = useState(false);

  return (
    <div className="flex size-[51px] shrink-0 items-center justify-center bg-cover-bg">
      {coverUrl && !broken ? (
        <img
          src={coverUrl}
          alt=""
          className="size-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="19"
          height="19"
          fill="none"
          aria-hidden="true"
          viewBox="0 0 19 19"
        >
          <path
            stroke="var(--cover-icon)"
            strokeWidth="1.5"
            d="M7.5 15.6v-14m0-.1 11-1m0 .1v12"
          />
          <ellipse
            cx="4"
            cy="15.547"
            stroke="var(--cover-icon)"
            strokeWidth="1.5"
            rx="3.5"
            ry="2"
          />
          <ellipse
            cx="15"
            cy="12.547"
            stroke="var(--cover-icon)"
            strokeWidth="1.5"
            rx="3.5"
            ry="2"
          />
        </svg>
      )}
    </div>
  );
}

function ControlButton({
  className,
  tone = "primary",
  pressed,
  style,
  ...props
}: Omit<ComponentProps<"button">, "type"> & {
  tone?: "primary" | "alt";
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      data-pressed={pressed ? "true" : "false"}
      className={cn(
        "player-bar-control flex size-[22px] shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent select-none box-content",
        tone === "primary" && "player-bar-control--primary",
        tone === "alt" && "player-bar-control--alt",
        className,
      )}
      style={{ padding: CONTROL_HIT_PAD_PX, ...style }}
      {...props}
    />
  );
}

export function PlayerBar({
  track = {
    title: "Ты та...",
    artist: "Баста",
    favorite: false,
  },
  queue = [],
  onTrackChange,
  onDismiss,
  className,
}: PlayerBarProps) {
  const [playing, setPlaying] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [favorite, setFavorite] = useState(track.favorite ?? false);
  const [volume, setVolume] = useState(50);
  const [volumeMenuOpen, setVolumeMenuOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const historyRef = useRef<PlayerBarTrack[]>([]);
  const navRef = useRef({
    track,
    queue,
    shuffle,
    repeat,
    onTrackChange,
  });

  useEffect(() => {
    navRef.current = { track, queue, shuffle, repeat, onTrackChange };
  });

  useEffect(() => {
    const audio = new Audio(resolveAudioSrc(navRef.current.track));
    audio.preload = "auto";
    audio.loop = false;
    audio.volume = 0.5;
    audioRef.current = audio;

    const onEnded = () => {
      const {
        track: current,
        queue: list,
        shuffle: isShuffle,
        repeat: isRepeat,
        onTrackChange: changeTrack,
      } = navRef.current;
      const next = pickSiblingTrack(list, current, 1, isShuffle, isRepeat);
      if (!next) {
        setPlaying(false);
        return;
      }
      historyRef.current.push(current);
      if (
        (next.id && next.id === current.id) ||
        (next.title === current.title && next.artist === current.artist)
      ) {
        const same = audioRef.current;
        if (same) {
          same.currentTime = 0;
          void same.play().catch(() => setPlaying(false));
        }
        setPlaying(true);
        return;
      }
      changeTrack?.(next);
    };
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.min(1, Math.max(0, volume / 100));
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      void audio.play().catch(() => {
        setPlaying(false);
      });
      return;
    }
    audio.pause();
  }, [playing]);

  useEffect(() => {
    // Reset playback UI when the current track identity changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional track sync
    setFavorite(track.favorite ?? false);
    setPlaying(true);
    setDragY(0);
    setIsDragging(false);
    const audio = audioRef.current;
    if (!audio) return;
    const nextSrc = resolveAudioSrc(track);
    if (audio.getAttribute("src") !== nextSrc) {
      audio.src = nextSrc;
      audio.load();
    }
    audio.currentTime = 0;
    void audio.play().catch(() => {
      setPlaying(false);
    });
  }, [track.id, track.title, track.artist, track.audioUrl, track.favorite]);

  const stopAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  };

  const goToTrack = (next: PlayerBarTrack | null, pushHistory: boolean) => {
    if (!next) {
      setPlaying(false);
      return;
    }
    if (pushHistory) historyRef.current.push(track);
    onTrackChange?.(next);
  };

  const goNext = () => {
    goToTrack(pickSiblingTrack(queue, track, 1, shuffle, repeat), true);
  };

  const goPrev = () => {
    const fromHistory = historyRef.current.pop();
    if (fromHistory) {
      onTrackChange?.(fromHistory);
      return;
    }
    goToTrack(pickSiblingTrack(queue, track, -1, shuffle, repeat), false);
  };

  const toggle =
    (setter: Dispatch<SetStateAction<boolean>>) =>
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setter((prev) => !prev);
    };

  const onDismissHandlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (typeof e.currentTarget.setPointerCapture === "function") {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    dragStartY.current = e.clientY;
    setIsDragging(true);
    setDragY(0);
  };

  const onDismissHandlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartY.current == null) return;
    setDragY(Math.max(0, e.clientY - dragStartY.current));
  };

  const endDismissDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartY.current == null) return;
    const delta = Math.max(0, e.clientY - dragStartY.current);
    dragStartY.current = null;
    setIsDragging(false);
    if (
      typeof e.currentTarget.hasPointerCapture === "function" &&
      typeof e.currentTarget.releasePointerCapture === "function" &&
      e.currentTarget.hasPointerCapture(e.pointerId)
    ) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (delta >= DISMISS_DRAG_PX) {
      setDragY(PLAYER_HEIGHT_PX + 24);
      stopAudio();
      historyRef.current = [];
      onDismiss?.();
      return;
    }
    setDragY(0);
  };

  const opacity = Math.max(
    0.35,
    1 - dragY / (PLAYER_HEIGHT_PX + DISMISS_DRAG_PX),
  );

  return (
    <footer
      className={cn(
        "player-bar fixed inset-x-0 bottom-0 z-50 flex h-[77px] items-center gap-[33px] border-t-[5px] border-[var(--player-border)] bg-player-bg px-9 py-3 shadow-[0_-44px_40px_-10px_var(--player-shadow)]",
        isDragging
          ? "transition-none"
          : "transition-[transform,opacity] duration-200 ease-out",
        className,
      )}
      style={{ transform: `translateY(${dragY}px)`, opacity }}
      aria-label="Плеер"
    >
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Скрыть плеер — потяните границу вниз"
        title="Потяните вниз, чтобы скрыть плеер"
        className="absolute inset-x-0 -top-[5px] z-10 h-[14px] cursor-row-resize touch-none"
        onPointerDown={onDismissHandlePointerDown}
        onPointerMove={onDismissHandlePointerMove}
        onPointerUp={endDismissDrag}
        onPointerCancel={endDismissDrag}
      />

      <div className="flex items-center" style={{ gap: CONTROL_GAP_REMAIN_PX }}>
        <ControlButton
          tone="primary"
          aria-label="Предыдущий трек"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            goPrev();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="14"
            fill="none"
            aria-hidden="true"
            viewBox="0 0 16 14"
          >
            <path stroke="currentColor" d="M.5 2v10.5" />
            <path fill="currentColor" d="m2.5 7 9.8-6v12z" />
          </svg>
        </ControlButton>

        <ControlButton
          tone="primary"
          className="player-bar-control--play"
          data-playing={playing ? "true" : "false"}
          aria-label={playing ? "Пауза" : "Воспроизвести"}
          aria-pressed={playing}
          onClick={toggle(setPlaying)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="20"
            fill="none"
            aria-hidden="true"
            className="player-bar-play-icon"
            viewBox="0 0 15 20"
          >
            <path fill="currentColor" d="M15 9.5 0 0v19z" />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="19"
            fill="none"
            aria-hidden="true"
            className="player-bar-pause-icon"
            viewBox="0 0 15 19"
          >
            <path fill="currentColor" d="M0 0h5v19H0zm10 0h5v19h-5z" />
          </svg>
        </ControlButton>

        <ControlButton
          tone="primary"
          aria-label="Следующий трек"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            goNext();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="14"
            fill="none"
            aria-hidden="true"
            viewBox="0 0 16 14"
          >
            <path stroke="currentColor" d="M15 2v10.5" />
            <path fill="currentColor" d="M13 7 3.3 1v12z" />
          </svg>
        </ControlButton>

        <ControlButton
          tone="alt"
          pressed={shuffle}
          aria-label="Перемешать"
          aria-pressed={shuffle}
          onClick={toggle(setShuffle)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="19"
            height="18"
            fill="none"
            aria-hidden="true"
            viewBox="-0.5 0 20 18"
          >
            <path
              fill="currentColor"
              stroke="currentColor"
              strokeWidth=".5"
              d="M9.5 2.9 4.5 0v5.8zm-3 11.5c-3 0-5.5-2.5-5.5-5.5H0c0 3.6 3 6.5 6.5 6.5zM1 8.9c0-3 2.5-5.5 5.5-5.5v-1A6.5 6.5 0 0 0 0 8.9zm8.5 6 5 2.9V12zm3-11.5c3 0 5.5 2.4 5.5 5.5h1c0-3.6-3-6.5-6.5-6.5zM18 8.9c0 3-2.5 5.5-5.5 5.5v1c3.6 0 6.5-3 6.5-6.5z"
              paintOrder="stroke fill"
            />
          </svg>
        </ControlButton>

        <ControlButton
          tone="alt"
          pressed={repeat}
          aria-label="Повторить"
          aria-pressed={repeat}
          onClick={toggle(setRepeat)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="19"
            height="18"
            fill="none"
            aria-hidden="true"
            viewBox="-0.5 0 20 18"
          >
            <path
              fill="currentColor"
              stroke="currentColor"
              strokeWidth=".5"
              d="M19 14.9 14 12v5.8zm-9.3-3-.5.3zm-2.9-6-.4.2zM0 3.4h2.3v-1H0zM6.4 6l2.8 6.2 1-.4-3-6.2zm7.8 9.4h.3v-1h-.3zm-5-3.2c.9 2 2.9 3.2 5 3.2v-1q-2.8-.1-4-2.6zm-7-8.8q3 .1 4.2 2.6l.9-.4c-.9-2-2.9-3.2-5-3.2z"
              paintOrder="stroke fill"
            />
            <path
              fill="currentColor"
              stroke="currentColor"
              strokeWidth=".5"
              d="m19 2.9-5 2.9V0zM9.7 5.8l-.5-.2zM6.8 12l-.4-.2zM0 14.4h2.3v1H0zm6.4-2.6 2.8-6.2 1 .4-3 6.2zm7.8-9.4h.3v1h-.3zm-5 3.2c.9-2 2.9-3.2 5-3.2v1q-2.8.1-4 2.6zm-7 8.8q3-.1 4.2-2.6l.9.4c-.9 2-2.9 3.2-5 3.2z"
              paintOrder="stroke fill"
            />
          </svg>
        </ControlButton>
      </div>

      <div
        className="flex min-w-0 flex-1 items-center"
        style={{ gap: META_GAP_PX }}
      >
        <NoteCover coverUrl={track.coverUrl} />
        <div className="flex min-w-0 items-center" style={{ gap: META_GAP_PX }}>
          <div className="min-w-0 max-w-full overflow-hidden">
            <p className="mb-1 truncate text-[16px] leading-[1.1] tracking-[0.001em] text-fg">
              {track.title}
            </p>
            <p className="truncate text-[16px] leading-[1.1] tracking-[0.001em] text-fg">
              {track.artist}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={
              favorite ? "Убрать из избранного" : "Добавить в избранное"
            }
            aria-pressed={favorite}
            data-favorite={favorite ? "true" : "false"}
            onClick={toggle(setFavorite)}
            className={cn(
              "track-fav-toggle size-[22px] shrink-0 rounded-full border-0 bg-transparent p-0 shadow-none",
              "hover:bg-transparent active:bg-transparent",
              "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
              "[&_svg]:pointer-events-none [&_svg]:!h-[13px] [&_svg]:!w-[15px] [&_svg]:shrink-0",
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="13"
              fill="none"
              aria-hidden="true"
              className="fav-icon"
              viewBox="0 0 15 13"
            >
              <path
                d="M7.5 1.8c1-.9 3.4-2.1 5.6-.5 3.4 2.4.3 7.7-5.6 11.2m0-10.7C6.5.9 4-.3 1.9 1.3-1.5 3.7 1.6 9 7.5 12.5"
                className="fav-icon__heart"
              />
              <path d="M.3.4 14 12.5" className="fav-icon__cross" />
            </svg>
          </Button>
        </div>

        <div className="player-bar-volume ml-auto flex shrink-0 items-center text-volume-icon md:min-w-[140px] md:w-[180px] md:max-w-[220px] md:gap-[8px]">
          <div className="hidden w-full items-center gap-[8px] md:flex">
            <VolumeGlyph />
            <VolumeSlider
              volume={volume}
              onVolumeChange={setVolume}
              className="min-w-0 flex-1"
            />
          </div>

          <DropdownMenu open={volumeMenuOpen} onOpenChange={setVolumeMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-[22px] cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-volume-icon md:hidden"
                aria-label="Громкость"
                aria-expanded={volumeMenuOpen}
              >
                <VolumeGlyph />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="center"
              sideOffset={10}
              style={{ minWidth: 60, width: 60, height: 164 }}
              className="z-[60] flex flex-col items-center justify-center overflow-visible border-[var(--player-border)] bg-player-bg p-3 shadow-md"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <VolumeSlider
                volume={volume}
                onVolumeChange={setVolume}
                orientation="vertical"
                className="shrink-0"
                style={{ height: 140, width: 36 }}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </footer>
  );
}
