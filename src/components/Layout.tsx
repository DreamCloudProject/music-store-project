import { Outlet } from 'react-router-dom'
import Player from './Player'
import { Separator } from '@/components/ui/separator'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Layout() {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[60px] bg-card border-r border-border flex flex-col items-center py-4 gap-5 shrink-0">
          {/* Logo — real MusicLab app icon */}
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
            <img src="/assets/app-icon.png" alt="MusicLab" className="w-full h-full object-cover" />
          </div>

          <Separator className="w-8" />

          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Menu size={18} />
          </Button>
        </aside>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </div>
      </div>

      {/* Player */}
      <Player />
    </div>
  )
}
