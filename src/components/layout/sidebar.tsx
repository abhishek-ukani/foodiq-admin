import { NavLink } from 'react-router-dom'
import {
  ChefHat,
  LayoutDashboard,
  Tag,
  UtensilsCrossed,
  CalendarDays,
  Sliders,
  ShoppingBag,
  Users,
  Image,
  BarChart3,
  Settings,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ADMIN_ROUTES } from '@/constants'

/** Add each section's nav item here as it ships — keep this list honest with what's actually built. */
export const NAV_ITEMS = [
  { to: ADMIN_ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: ADMIN_ROUTES.orders, label: 'Orders', icon: ShoppingBag, end: false },
  { to: ADMIN_ROUTES.categories, label: 'Categories', icon: Tag, end: false },
  { to: ADMIN_ROUTES.foodItems, label: 'Food Items', icon: UtensilsCrossed, end: false },
  { to: ADMIN_ROUTES.dailyMenu, label: 'Daily Menu', icon: CalendarDays, end: false },
  { to: ADMIN_ROUTES.thalis, label: 'Thali Options', icon: Sliders, end: false },
  { to: ADMIN_ROUTES.customers, label: 'Customers', icon: Users, end: false },
  { to: ADMIN_ROUTES.content, label: 'Content', icon: Image, end: false },
  { to: ADMIN_ROUTES.reports, label: 'Reports', icon: BarChart3, end: false },
  { to: ADMIN_ROUTES.notifications, label: 'Notifications', icon: Bell, end: false },
  { to: ADMIN_ROUTES.settings, label: 'Settings', icon: Settings, end: false },
]

export function Sidebar() {
  return (
    <aside className="bg-card hidden w-64 shrink-0 flex-col border-r lg:flex">
      <div className="flex items-center gap-2.5 border-b px-6 py-5">
        <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg">
          <ChefHat className="size-4.5" aria-hidden />
        </div>
        <span className="font-display text-lg font-semibold">FoodIQ</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
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
    </aside>
  )
}
