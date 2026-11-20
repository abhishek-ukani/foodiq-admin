import { MobileNav } from '@/components/layout/mobile-nav'
import { ThemeToggle } from '@/components/layout/theme-toggle'

export function Topbar() {
  return (
    <header className="bg-card/80 sticky top-0 z-40 flex items-center justify-between gap-2 border-b px-4 py-3 backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-2">
        <MobileNav />
        <span className="font-display font-semibold">FoodIQ</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
