import { Clock } from "lucide-react";

export default function TracksTableHeader() {
  return (
    <div className="grid grid-cols-[44px_1fr_1fr_1fr_auto] gap-3 px-3 pb-2 border-b border-border">
      <div />
      <div className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
        Трек
      </div>
      <div className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
        Исполнитель
      </div>
      <div className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
        Альбом
      </div>
      <div className="flex justify-end pr-2">
        <Clock size={13} className="text-muted-foreground" />
      </div>
    </div>
  );
}