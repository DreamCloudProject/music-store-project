import React, { useState, useEffect, useRef } from "react";
import { usePlayer } from "@/hooks/usePlayer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Repeat,
  Shuffle,
  Heart,
  HeartOff,
  Volume2,
  Music2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parse } from "date-fns";

function formatTime(seconds: number) {
  const minute = Math.floor(seconds / 60);
  const second = Math.floor(seconds % 60);
  return `${minute}:${second.toString().padStart(2, "0")}`;
}

function parseDuration(duration: string) {
  const parsed = parse(duration, "mm:ss", new Date());
  return parsed.getMinutes() * 60 + parsed.getSeconds();
}

export default function Player() {
  const {
    currentTrack,
    isPlaying,
    isRepeat,
    isShuffle,
    volume,
    togglePlay,
    toggleRepeat,
    toggleShuffle,
    playNext,
    playPrev,
    toggleLike,
    setVolume,
  } = usePlayer();

  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = React.useMemo(() => {
    if (!currentTrack) return 0;
    return parseDuration(currentTrack.duration);
  }, [currentTrack]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    
    if (!isPlaying || totalSeconds <= 0) return;

    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= totalSeconds - 1) {
          clearInterval(intervalRef.current!);

          if (!isRepeat) {
            playNext();
          }

          return 0;
        }

        return prev + 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, totalSeconds, isRepeat, playNext]);

  useEffect(() => {
    setElapsed(0);
  }, [currentTrack?.id]);

  
  if (!currentTrack) return null;

  const progress = totalSeconds > 0 ? (elapsed / totalSeconds) * 100 : 0;

  const handleSeek = (val: number[]) => {
    setElapsed(Math.round((val[0] / 100) * totalSeconds));
  };

  return (
    <div className="border-t border-border bg-card shrink-0">
      <div className="px-4 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-7 text-right tabular-nums">
            {formatTime(elapsed)}
          </span>
          <Slider
            value={[progress]}
            min={0}
            max={100}
            step={0.1}
            onValueChange={handleSeek}
            className="flex-1"
          />
          <span className="text-[10px] text-muted-foreground w-7 tabular-nums">
            {currentTrack.duration}
          </span>
        </div>
      </div>

      <div className="h-14 flex items-center px-4 gap-3">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={playPrev}
          >
            <SkipBack size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-foreground bg-secondary hover:bg-secondary/80 rounded-full"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={playNext}
          >
            <SkipForward size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              isRepeat
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={toggleRepeat}
          >
            <Repeat size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              isShuffle
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={toggleShuffle}
          >
            <Shuffle size={15} />
          </Button>
        </div>

        <div className="flex items-center gap-3 flex-1 min-w-0 ml-2">
          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center shrink-0">
            <Music2 size={16} className="text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate leading-tight">
              {currentTrack.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              currentTrack.liked
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => toggleLike(currentTrack.id)}
          >
            <Heart
              size={15}
              fill={currentTrack.liked ? "currentColor" : "none"}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <HeartOff size={15} />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-28 shrink-0 ml-1">
          <Volume2 size={14} className="text-muted-foreground shrink-0" />
          <Slider
            value={[volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={([v]) => setVolume(v)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
