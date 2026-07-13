import { Clock } from "lucide-react";
import { useState, type Ref } from "react";

import type { Track } from "@/entities/track";
import { TrackFavoriteToggle } from "@/features/toggle-track-favorite";
import { cn } from "@/shared/lib";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

export interface TracksTableProps {
  tracks: Track[];
  isPending?: boolean;
  isFetchingNextPage?: boolean;
  sentinelRef?: Ref<HTMLDivElement>;
  className?: string;
}

function TrackCover({ coverUrl }: { coverUrl?: string }) {
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

function SkeletonRow() {
  return (
    <TableRow className="cursor-default border-0 hover:bg-transparent">
      <TableCell className="flex items-center gap-[17px] border-0 p-0">
        <div className="size-[51px] shrink-0 bg-[#313131]" aria-hidden />
        <span
          className="h-3 max-w-[50%] flex-1 rounded-sm bg-[#313131]"
          aria-hidden
        />
      </TableCell>
      <TableCell className="flex items-center border-0 p-0">
        <span
          className="h-3 max-w-[50%] w-full rounded-sm bg-[#313131]"
          aria-hidden
        />
      </TableCell>
      <TableCell className="flex items-center border-0 p-0">
        <span
          className="h-3 max-w-[50%] w-full rounded-sm bg-[#313131]"
          aria-hidden
        />
      </TableCell>
      <TableCell className="flex items-center justify-end gap-[12.5px] border-0 p-0">
        <span
          className="h-[22px] w-[22px] rounded-sm bg-[#313131]"
          aria-hidden
        />
        <span className="h-3 w-10 rounded-sm bg-[#313131]" aria-hidden />
      </TableCell>
    </TableRow>
  );
}

const headCell =
  "flex items-center border-0 bg-transparent p-0 h-auto pb-3 font-normal text-base leading-[1.15] tracking-[0.001em] text-[#b0b0b0]";

const cellBase =
  "flex items-center border-0 bg-transparent p-0 font-normal text-[14px] leading-[1.7] text-[#696969]";

export function TracksTable({
  tracks,
  isPending = false,
  isFetchingNextPage = false,
  sentinelRef,
  className,
}: TracksTableProps) {
  return (
    <div className={cn("w-full", className)}>
      <Table
        className="grid [grid-template-columns:1fr_1fr_1fr_100px] auto-rows-[minmax(60px,auto)] gap-x-4 gap-y-3 border-collapse"
        aria-label="Список треков"
        aria-busy={isPending}
      >
        <TableHeader className="contents">
          <TableRow className="contents border-0 hover:bg-transparent">
            <TableHead className={headCell}>Трек</TableHead>
            <TableHead className={headCell}>Исполнитель</TableHead>
            <TableHead className={headCell}>Альбом</TableHead>
            <TableHead className={cn(headCell, "justify-end gap-[12.5px]")}>
              <Clock className="size-3 shrink-0 text-[#696969]" aria-hidden />
              <span
                className="invisible w-[2.5rem] text-right text-[16px] leading-[1.1] tracking-[0.001em] tabular-nums"
                aria-hidden
              >
                0:00
              </span>
              <span className="sr-only">Длительность</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="contents">
          {isPending
            ? Array.from({ length: 5 }, (_, i) => (
                <SkeletonRow key={`skeleton-${i}`} />
              ))
            : tracks.map((track) => (
                <TableRow
                  key={track.id}
                  className="contents cursor-pointer border-0 hover:bg-transparent"
                >
                  <TableCell
                    className={cn(cellBase, "gap-[17px]")}
                    tabIndex={0}
                    role="button"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-[17px]">
                      <TrackCover coverUrl={track.coverUrl} />
                      <p className="truncate text-[16px] leading-[1.1] tracking-[0.001em] text-white select-text">
                        {track.title}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      cellBase,
                      "text-[16px] leading-[1.1] tracking-[0.001em] text-white",
                    )}
                  >
                    <span className="truncate">{track.artist}</span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      cellBase,
                      "text-[16px] leading-[1.1] tracking-[0.001em] text-[#b0b0b0] select-text",
                    )}
                  >
                    <span className="truncate">{track.album}</span>
                  </TableCell>
                  <TableCell
                    className={cn(cellBase, "justify-end gap-[12.5px]")}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TrackFavoriteToggle
                      trackId={track.id}
                      favorite={track.favorite}
                    />
                    <p className="min-w-[2.5rem] text-right text-[16px] leading-[1.1] tracking-[0.001em] text-[#b0b0b0] tabular-nums">
                      {track.duration ?? ""}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {sentinelRef ? (
        <div ref={sentinelRef} className="h-4 shrink-0" aria-hidden />
      ) : null}
      {isFetchingNextPage ? (
        <p className="py-2 text-sm text-white/50">Подгрузка…</p>
      ) : null}
    </div>
  );
}
