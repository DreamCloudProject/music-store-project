import {
  useState,
  type ComponentProps,
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
} from "react";

import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Slider } from "@/shared/ui/slider";

export interface PlayerBarTrack {
  title: string;
  artist: string;
  coverUrl?: string;
  favorite?: boolean;
}

export interface PlayerBarProps {
  track?: PlayerBarTrack;
  className?: string;
}

function NoteCover({ coverUrl }: { coverUrl?: string }) {
  const [broken, setBroken] = useState(false);

  return (
    <div className="flex size-[51px] shrink-0 items-center justify-center bg-[#313131]">
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
            stroke="#4e4e4e"
            strokeWidth="1.5"
            d="M7.5 15.6v-14m0-.1 11-1m0 .1v12"
          />
          <ellipse
            cx="4"
            cy="15.547"
            stroke="#4e4e4e"
            strokeWidth="1.5"
            rx="3.5"
            ry="2"
          />
          <ellipse
            cx="15"
            cy="12.547"
            stroke="#4e4e4e"
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
        "player-bar-control flex size-[22px] shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 select-none",
        tone === "primary" && "player-bar-control--primary",
        tone === "alt" && "player-bar-control--alt",
        className,
      )}
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
  className,
}: PlayerBarProps) {
  const [playing, setPlaying] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [favorite, setFavorite] = useState(track.favorite ?? false);
  const [volume, setVolume] = useState(50);

  const toggle =
    (setter: Dispatch<SetStateAction<boolean>>) =>
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setter((prev) => !prev);
    };

  return (
    <footer
      className={cn(
        "player-bar fixed inset-x-0 bottom-0 z-50 flex h-[77px] items-center gap-[33px] border-t-[5px] border-gray-500 bg-[#181818] px-9 py-3 shadow-[0_-44px_40px_-10px_#181818d9]",
        className,
      )}
      aria-label="Плеер"
    >
      <div className="flex items-center gap-[25px]">
        <ControlButton tone="primary" aria-label="Предыдущий трек">
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

        <ControlButton tone="primary" aria-label="Следующий трек">
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

      <div className="flex min-w-0 flex-1 items-center gap-[17px]">
        <NoteCover coverUrl={track.coverUrl} />
        <div className="flex min-w-0 flex-col overflow-hidden">
          <p className="mb-1 truncate text-[16px] leading-[1.1] tracking-[0.001em] text-white">
            {track.title}
          </p>
          <p className="truncate text-[16px] leading-[1.1] tracking-[0.001em] text-white">
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

      <div className="player-bar-volume ml-auto flex min-w-[140px] max-w-[220px] flex-1 items-center gap-[8px] pl-[33px]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="18"
          fill="none"
          aria-hidden="true"
          className="block h-[18px] w-[14px] shrink-0"
          viewBox="-2.5 -3 17 24"
        >
          <path
            fill="#fff"
            d="M3 5v1h.4l.3-.3zm5-5h1v-2.4L7.3-.7zM0 5V4h-1v1zm0 8h-1v1h1zm3 0 .7-.7-.3-.3H3zm5 5-.7.7L9 20.4V18zM3.7 5.7l5-5L7.3-.7l-5 5zM0 6h3V4H0zm1 7V5h-2v8zm2-1H0v2h3zm5.7 5.3-5-5-1.4 1.4 5 5zM7 0v18h2V0z"
          />
          <path
            stroke="#fff"
            strokeWidth="1.5"
            d="M11 13c1.1 0 2-1.8 2-4s-.9-4-2-4"
          />
        </svg>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[volume]}
          onValueChange={([next]) => setVolume(next ?? 0)}
          aria-label="Громкость"
          className="player-bar-volume-slider w-full"
          trackClassName="h-[2px] rounded-[6px] bg-[#797979]"
          rangeClassName="bg-white"
          thumbClassName="size-3 border-2 border-white bg-[#1a1a1a] shadow-none focus-visible:ring-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        />
      </div>
    </footer>
  );
}
