import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { signOut, toFriendlyAuthMessage } from '@/features/auth/services/auth-service'
import { ADMIN_ROUTES } from '@/constants'

export function Topbar() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate(ADMIN_ROUTES.login)
    } catch (error) {
      toast.error(toFriendlyAuthMessage(error))
    }
  }

  return (
    <header className="bg-card/80 sticky top-0 z-40 flex items-center justify-between gap-2 border-b px-4 py-3 backdrop-blur-xl lg:justify-end lg:px-6">
      <MobileNav />
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <User className="size-4" aria-hidden />
              {profile?.full_name ?? user?.email}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="size-4" aria-hidden />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
