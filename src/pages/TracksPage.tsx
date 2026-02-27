import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { usePlayer } from '@/hooks/usePlayer'
import { ARTISTS, GENRES, PLAYLISTS } from '@/data/tracks'
import TrackRow from '@/components/TrackRow'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Search, Clock, ChevronDown, LogOut } from 'lucide-react'
import type { SortYear } from '@/types'
import { cn } from '@/lib/utils'

type FilterType = 'artist' | 'year' | 'genre' | null

export default function TracksPage() {
  const { tracks } = usePlayer()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>(null)
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [sortYear, setSortYear] = useState<SortYear>('newer')

  const filtered = useMemo(() => {
    let list = [...tracks]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
      )
    }
    if (selectedArtist) list = list.filter(t => t.artist.toLowerCase().includes(selectedArtist.toLowerCase()))
    if (selectedGenre) list = list.filter(t => t.genre === selectedGenre)
    list.sort((a, b) => sortYear === 'newer' ? b.year - a.year : a.year - b.year)
    return list
  }, [tracks, search, selectedArtist, selectedGenre, sortYear])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border px-6 h-[60px] flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-transparent border-0 border-b rounded-none focus-visible:ring-0 focus-visible:border-primary"
          />
        </div>
        <button className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <LogOut size={16} />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden px-6 py-6 gap-6">
        {/* Left: track list */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          <h1 className="font-display text-4xl font-bold tracking-tight">Треки</h1>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground mr-1">Искать по:</span>

            {/* Artist filter */}
            <DropdownMenu
              open={activeFilter === 'artist'}
              onOpenChange={open => setActiveFilter(open ? 'artist' : null)}
            >
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm transition-all',
                  (activeFilter === 'artist' || selectedArtist)
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}>
                  исполнителю
                  {selectedArtist && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  <ChevronDown size={12} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {ARTISTS.map((a, i) => (
                  <DropdownMenuItem
                    key={a}
                    active={selectedArtist === a}
                    className={i === 0 ? 'text-primary font-medium' : ''}
                    onClick={() => { setSelectedArtist(selectedArtist === a ? null : a); setActiveFilter(null) }}
                  >
                    {a}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Year filter */}
            <DropdownMenu
              open={activeFilter === 'year'}
              onOpenChange={open => setActiveFilter(open ? 'year' : null)}
            >
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm transition-all',
                  activeFilter === 'year'
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}>
                  году выпуска
                  <ChevronDown size={12} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  active={sortYear === 'newer'}
                  onClick={() => { setSortYear('newer'); setActiveFilter(null) }}
                >
                  Более новые
                </DropdownMenuItem>
                <DropdownMenuItem
                  active={sortYear === 'older'}
                  onClick={() => { setSortYear('older'); setActiveFilter(null) }}
                >
                  Более старые
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Genre filter */}
            <DropdownMenu
              open={activeFilter === 'genre'}
              onOpenChange={open => setActiveFilter(open ? 'genre' : null)}
            >
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm transition-all',
                  (activeFilter === 'genre' || selectedGenre)
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}>
                  жанру
                  {selectedGenre && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  <ChevronDown size={12} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {GENRES.map(g => (
                  <DropdownMenuItem
                    key={g}
                    active={selectedGenre === g}
                    onClick={() => { setSelectedGenre(selectedGenre === g ? null : g); setActiveFilter(null) }}
                  >
                    {g}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Active filter badges */}
            {selectedArtist && (
              <Badge variant="active" className="cursor-pointer" onClick={() => setSelectedArtist(null)}>
                {selectedArtist} ×
              </Badge>
            )}
            {selectedGenre && (
              <Badge variant="active" className="cursor-pointer" onClick={() => setSelectedGenre(null)}>
                {selectedGenre} ×
              </Badge>
            )}
          </div>

          {/* Table */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="grid grid-cols-[44px_1fr_1fr_1fr_auto] gap-3 px-3 pb-2 border-b border-border">
              <div />
              <div className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">ТРЕК</div>
              <div className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">ИСПОЛНИТЕЛЬ</div>
              <div className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">АЛЬБОМ</div>
              <div className="flex justify-end pr-2">
                <Clock size={13} className="text-muted-foreground" />
              </div>
            </div>

            <ScrollArea className="flex-1 mt-1">
              {filtered.length === 0
                ? <p className="text-center py-10 text-muted-foreground text-sm">Ничего не найдено</p>
                : filtered.map(t => <TrackRow key={t.id} track={t} />)
              }
            </ScrollArea>
          </div>
        </div>

        {/* Right: playlists */}
        <Separator orientation="vertical" />
        <div className="w-48 shrink-0 flex flex-col gap-3 pt-[72px]">
          {PLAYLISTS.map(pl => (
            <Link
              key={pl.id}
              to={`/playlist/${pl.id}`}
              className="h-20 rounded-xl flex items-end p-3 transition-transform hover:scale-[1.02] overflow-hidden relative"
              style={{ background: pl.gradient }}
            >
              {pl.cover && (
                <img src={pl.cover} alt={pl.title} className="absolute inset-0 w-full h-full object-cover opacity-40" />
              )}
              <span className="font-display text-[13px] font-bold text-white leading-tight relative z-10">{pl.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
