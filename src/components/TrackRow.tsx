import { usePlayer } from '@/hooks/usePlayer'
import type { Track } from '@/types'
import { Button } from '@/components/ui/button'
import { Heart, Music2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrackRowProps {
  track: Track
}

export default function TrackRow({ track }: TrackRowProps) {
  const { currentTrack, playTrack, toggleLike } = usePlayer()
  const isActive = currentTrack?.id === track.id

  return (
    <div
      className={cn(
        'grid items-center gap-3 px-3 py-2 rounded-md cursor-default select-none group transition-colors',
        'grid-cols-[44px_1fr_1fr_1fr_auto]',
        isActive ? 'bg-primary/10' : 'hover:bg-secondary/50'
      )}
      onDoubleClick={() => playTrack(track)}
    >
      {/* Thumb */}
      <div className="w-9 h-9 bg-muted rounded flex items-center justify-center shrink-0">
        <Music2 size={14} className="text-muted-foreground" />
      </div>

      {/* Title */}
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className={cn('text-sm truncate', isActive ? 'text-primary font-medium' : 'text-foreground')}>
          {track.title}
        </span>
        {track.subtitle && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">{track.subtitle}</span>
        )}
      </div>

      {/* Artist */}
      <span className="text-sm text-muted-foreground truncate">{track.artist}</span>

      {/* Album */}
      <span className="text-sm text-muted-foreground/60 truncate">{track.album}</span>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-7 w-7 transition-opacity',
            track.liked ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground'
          )}
          onClick={() => toggleLike(track.id)}
        >
          <Heart size={13} fill={track.liked ? 'currentColor' : 'none'} />
        </Button>
        <span className="text-xs text-muted-foreground w-9 text-right">{track.duration}</span>
      </div>
    </div>
  )
}
