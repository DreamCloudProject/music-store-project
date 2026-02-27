import { Link, useParams } from 'react-router-dom'
import { PLAYLISTS, PLAYLIST_DAY_TRACKS } from '@/data/tracks'
import TrackRow from '@/components/TrackRow'
import { Input } from '@/components/ui/input'
import { Search, Clock, LogOut } from 'lucide-react'

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>()
  const playlist = PLAYLISTS.find(p => p.id === Number(id)) ?? PLAYLISTS[0]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border px-6 h-[60px] flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск"
            readOnly
            className="pl-9 bg-transparent border-0 border-b rounded-none focus-visible:ring-0 cursor-default"
          />
        </div>
        <Link
          to="/tracks"
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <LogOut size={16} />
        </Link>
      </header>

      <div className="px-6 py-6 flex flex-col gap-5 flex-1 overflow-hidden">
        <h1 className="font-display text-4xl font-bold tracking-tight">{playlist.title}</h1>

        {/* Table head */}
        <div className="grid grid-cols-[44px_1fr_1fr_1fr_auto] gap-3 px-3 pb-2 border-b border-border">
          <div />
          <div className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">ТРЕК</div>
          <div className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">ИСПОЛНИТЕЛЬ</div>
          <div className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">АЛЬБОМ</div>
          <div className="flex justify-end pr-2">
            <Clock size={13} className="text-muted-foreground" />
          </div>
        </div>

        <div className="flex flex-col">
          {PLAYLIST_DAY_TRACKS.map(t => <TrackRow key={t.id} track={t} />)}
        </div>
      </div>
    </div>
  )
}
