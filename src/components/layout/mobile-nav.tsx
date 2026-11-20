import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ChefHat, Menu as MenuIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { NAV_ITEMS } from '@/components/layout/sidebar'
import { SidebarFooter } from '@/components/layout/sidebar-footer'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <MenuIcon className="size-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex h-full w-64 flex-col p-0">
        <div className="flex items-center gap-2.5 border-b px-6 py-5">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
            <ChefHat className="size-4.5" aria-hidden />
          </div>
          <div>
            <SheetTitle className="font-display text-lg font-semibold">FoodIQ</SheetTitle>
            <SheetDescription className="sr-only">Admin navigation menu</SheetDescription>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <item.icon className="size-4.5" aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <SidebarFooter onAction={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
