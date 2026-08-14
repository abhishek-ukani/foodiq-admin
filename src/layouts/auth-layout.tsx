import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ChefHat, ShieldCheck } from 'lucide-react'

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl">
            <ChefHat className="size-6" aria-hidden />
          </div>
          <div>
            <p className="font-display text-lg font-semibold">FoodIQ</p>
            <p className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
              <ShieldCheck className="size-3" aria-hidden />
              Admin dashboard
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border p-8 shadow-sm">
          <div className="mb-6 space-y-1">
            <h1 className="font-display text-2xl font-semibold">{title}</h1>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  )
}
