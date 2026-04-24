import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  ARTISTS,
  GENRES,
  PLAYLISTS,
  TRACKS,
} from "@/entities/track/model/data";
import TrackRow from "@/entities/track/ui/TrackRow";
import TracksTableHeader from "@/entities/track/ui/TracksTableHeader";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Separator } from "@/shared/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/ui/dropdown-menu";
import { Search, ChevronDown, LogOut } from "lucide-react";
import type { SortYear } from "@/entities/track/model/types";

export default function TracksPage() {
  const tracks = useMemo(() => TRACKS || [], []);

  const [search, setSearch] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sortYear] = useState<SortYear>("newer");

  const filtered = useMemo(() => {
    let list = [...tracks];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q),
      );
    }

    if (selectedArtist) {
      list = list.filter((t) =>
        t.artist.toLowerCase().includes(selectedArtist.toLowerCase()),
      );
    }

    if (selectedGenre) {
      list = list.filter((t) => t.genre === selectedGenre);
    }

    list.sort((a, b) =>
      sortYear === "newer" ? b.year - a.year : a.year - b.year,
    );

    return list;
  }, [tracks, search, selectedArtist, selectedGenre, sortYear]);

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-10 bg-background border-b border-border px-6 h-[60px] flex items-center gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={15}
          />
          <Input
            placeholder="Поиск"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-transparent border-0 border-b rounded-none focus-visible:ring-0"
          />
        </div>
        <button className="w-9 h-9 rounded-full border flex items-center justify-center">
          <LogOut size={16} />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden px-6 py-6 gap-6">
        <div className="flex-1 flex flex-col gap-5">
          <h1 className="text-3xl font-bold">Треки</h1>

          <div className="flex gap-2 flex-wrap">
            {/* Artist */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="border px-3 py-1 rounded">
                  Исполнитель <ChevronDown size={12} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {ARTISTS?.map((a) => (
                  <DropdownMenuItem
                    key={a}
                    onClick={() => setSelectedArtist(a)}
                  >
                    {a}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Genre */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="border px-3 py-1 rounded">
                  Жанр <ChevronDown size={12} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {GENRES?.map((g) => (
                  <DropdownMenuItem key={g} onClick={() => setSelectedGenre(g)}>
                    {g}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedArtist && (
              <Badge onClick={() => setSelectedArtist(null)}>
                {selectedArtist} ×
              </Badge>
            )}
            {selectedGenre && (
              <Badge onClick={() => setSelectedGenre(null)}>
                {selectedGenre} ×
              </Badge>
            )}
          </div>

          <TracksTableHeader />

          <ScrollArea className="flex-1">
            {filtered.length === 0 ? (
              <p className="text-center py-10">Ничего не найдено</p>
            ) : (
              filtered.map((t) => <TrackRow key={t.id} track={t} />)
            )}
          </ScrollArea>
        </div>

        <Separator orientation="vertical" />

        <div className="w-48 flex flex-col gap-3">
          {PLAYLISTS?.map((pl) => (
            <Link key={pl.id} to="/playlist/$id" params={{ id: String(pl.id) }}>
              {pl.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
