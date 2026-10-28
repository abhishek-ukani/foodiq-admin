import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ExpenseSpender } from '../types'
import { CURRENCY_SYMBOL } from '@/constants'
import { Landmark } from 'lucide-react'
import toast from 'react-hot-toast'

interface OpeningBalancesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spenders: ExpenseSpender[]
  initialBalances: Record<string, number>
  onSave: (balances: Record<string, number>) => void
}

export function OpeningBalancesDialog({
  open,
  onOpenChange,
  spenders,
  initialBalances,
  onSave,
}: OpeningBalancesDialogProps) {
  const [balances, setBalances] = useState<Record<string, string>>(() => {
    const res: Record<string, string> = {}
    for (const spender of spenders) {
      res[spender.id] = initialBalances[spender.id] ? String(initialBalances[spender.id]) : '0'
    }
    return res
  })

  const handleBalanceChange = (spenderId: string, val: string) => {
    setBalances((prev) => ({
      ...prev,
      [spenderId]: val,
    }))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const numericMap: Record<string, number> = {}

    for (const spender of spenders) {
      const parsed = parseFloat(balances[spender.id] || '0')
      numericMap[spender.id] = isNaN(parsed) ? 0 : parsed
    }

    onSave(numericMap)
    toast.success('Member opening balances saved')
    onOpenChange(false)
  }

  const totalOpening = spenders.reduce((sum, s) => {
    const val = parseFloat(balances[s.id] || '0')
    return sum + (isNaN(val) ? 0 : val)
  }, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pr-6">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Landmark className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                Member Starting Balances
              </DialogTitle>
              <DialogDescription className="text-sm">
                Set opening cash & bank balances for each family member to track true outstanding balances.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Total Opening Banner */}
          <div className="rounded-xl border bg-muted/40 p-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Total Family Opening Reserve:
            </span>
            <span className="text-lg font-bold text-foreground">
              {CURRENCY_SYMBOL}
              {totalOpening.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-3">
            {spenders.map((member) => {
              const initials = member.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()

              return (
                <div
                  key={member.id}
                  className="rounded-xl border p-3 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                      <p className="text-[11px] text-muted-foreground">{member.role || 'Family Member'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:w-44">
                    <Label htmlFor={`bal-${member.id}`} className="sr-only">
                      Opening balance for {member.name}
                    </Label>
                    <div className="relative w-full">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs font-bold text-muted-foreground">
                        {CURRENCY_SYMBOL}
                      </span>
                      <Input
                        id={`bal-${member.id}`}
                        type="number"
                        step="any"
                        value={balances[member.id] ?? '0'}
                        onChange={(e) => handleBalanceChange(member.id, e.target.value)}
                        placeholder="0"
                        className="pl-7 h-10 text-sm font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button type="submit" className="min-h-[44px] px-6">
              Save Balances
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
