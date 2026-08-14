import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * `FormControl` clones its single child and merges `id`/`aria-*` onto it via
 * Radix `Slot` — so that child must be the actual `<input>`, not a wrapper
 * div. Keep the relative-positioning wrapper and the toggle button *outside*
 * this component's own root so callers can put `<FormControl>` directly
 * around it: `<FormControl><PasswordInput {...field} /></FormControl>`.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'type'>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-9', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-3 flex items-center"
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  )
}
