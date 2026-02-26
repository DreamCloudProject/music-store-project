import React from 'react'
import { usePlayer } from '@/hooks/usePlayer'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import {
  SkipBack, SkipForward, Play, Pause,
  Repeat, Shuffle, Heart, Volume2, Music2
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Player() {
  const {
    currentTrack, isPlaying, isRepeat, isShuffle, volume,
    togglePlay, toggleRepeat, toggleShuffle,
    playNext, playPrev, toggleLike, setVolume
  } = usePlayer()

  if (!currentTrack) return null

  return (
    <div className="h-16 bg-card border-t border-border flex items-center px-4 gap-4 shrink-0">
      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={playPrev}>
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
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={playNext}>
          <SkipForward size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', isRepeat ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
          onClick={toggleRepeat}
        >
          <Repeat size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', isShuffle ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
          onClick={toggleShuffle}
        >
          <Shuffle size={14} />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Track info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center shrink-0">
          <Music2 size={16} className="text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate leading-tight">{currentTrack.title}</p>
          <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
        </div>
      </div>

      {/* Like */}
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8 shrink-0', currentTrack.liked ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
        onClick={() => toggleLike(currentTrack.id)}
      >
        <Heart size={15} fill={currentTrack.liked ? 'currentColor' : 'none'} />
      </Button>

      <Separator orientation="vertical" className="h-8" />

      {/* Volume */}
      <div className="flex items-center gap-2 w-28 shrink-0">
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
  )
}
