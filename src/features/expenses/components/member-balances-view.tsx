import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { FamilyFinancialSummary } from '../types'
import { CURRENCY_SYMBOL } from '@/constants'
import {
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Landmark,
  ChefHat,
  ShoppingBag,
} from 'lucide-react'

interface MemberBalancesViewProps {
  summary: FamilyFinancialSummary
  onOpenSetBalances: () => void
  onAddIncomeForMember: (memberId: string) => void
  onAddExpenseForMember: (memberId: string) => void
}

export function MemberBalancesView({
  summary,
  onOpenSetBalances,
  onAddIncomeForMember,
  onAddExpenseForMember,
}: MemberBalancesViewProps) {
  const isFamilySurplus = summary.netFamilyBalance >= 0

  return (
    <div className="space-y-6">
      {/* 1. Family Net Worth / Outstanding Balance Master Card */}
      <Card className="overflow-hidden border-primary/30 shadow-xs bg-gradient-to-br from-primary/5 via-card to-card">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xs">
                <Users className="size-6" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">
                  Family Treasury & Outstanding Balance
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-0.5">
                  Consolidated financial position across all {summary.members.length} family members.
                </CardDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenSetBalances}
              className="min-h-[44px] gap-1.5 shadow-2xs font-semibold self-start sm:self-auto"
            >
              <Landmark className="size-4 text-primary" />
              Configure Opening Balances
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Net Outstanding Balance */}
            <div className="rounded-2xl border bg-card p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Net Outstanding Balance
              </span>
              <div
                className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-1 ${
                  isFamilySurplus
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-destructive'
                }`}
              >
                {CURRENCY_SYMBOL}
                {summary.netFamilyBalance.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isFamilySurplus ? 'Healthy Family Surplus' : 'Deficit / Needs Inflow'}
              </p>
            </div>

            {/* Total Inflow */}
            <div className="rounded-2xl border bg-card p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="size-3.5 text-emerald-600" /> Total Inflow (Income)
              </span>
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
                +{CURRENCY_SYMBOL}
                {summary.totalIncome.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Earned by family members</p>
            </div>

            {/* Total Personal Outflow */}
            <div className="rounded-2xl border bg-card p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ShoppingBag className="size-3.5 text-purple-600" /> Personal & Family Spend
              </span>
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400 mt-1">
                -{CURRENCY_SYMBOL}
                {summary.totalPersonalExpense.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Food, clothes, bills, medical</p>
            </div>

            {/* Kitchen Business Outflow */}
            <div className="rounded-2xl border bg-card p-3.5 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ChefHat className="size-3.5 text-primary" /> Kitchen Business Spend
              </span>
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-primary mt-1">
                -{CURRENCY_SYMBOL}
                {summary.totalKitchenExpense.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Mandi stock, LPG, packaging</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Individual Member Balances Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Member Balances & Wallets ({summary.members.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Individual earnings, expenses, and current balances for each family member.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.members.map((member) => {
            const isPositive = member.currentBalance >= 0
            const initials = member.memberName
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()

            return (
              <Card
                key={member.memberId}
                className="overflow-hidden shadow-2xs transition-all hover:border-primary/40 flex flex-col justify-between"
              >
                <CardHeader className="p-4 pb-3 border-b bg-muted/20">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm sm:text-base font-bold truncate">
                          {member.memberName}
                        </CardTitle>
                        <p className="text-[11px] text-muted-foreground">{member.role || 'Admin User'}</p>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        isPositive
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-destructive/30 bg-destructive/10 text-destructive'
                      }`}
                    >
                      {isPositive ? 'In Surplus' : 'In Deficit'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  {/* Highlighted Current Balance */}
                  <div className="rounded-xl p-3 bg-muted/40 border">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Current Outstanding Balance
                    </span>
                    <div
                      className={`text-2xl font-extrabold tracking-tight mt-0.5 ${
                        isPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-destructive'
                      }`}
                    >
                      {CURRENCY_SYMBOL}
                      {member.currentBalance.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Financial Breakdown Rows */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>🏦 Opening Reserve:</span>
                      <span className="font-semibold text-foreground">
                        {CURRENCY_SYMBOL}
                        {member.openingBalance.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <ArrowUpRight className="size-3" /> Income Earned:
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{CURRENCY_SYMBOL}
                        {member.totalIncome.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                        <ArrowDownRight className="size-3" /> Personal Spend:
                      </span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        -{CURRENCY_SYMBOL}
                        {member.totalPersonalExpense.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {member.totalKitchenExpense > 0 && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 text-primary">
                          <ChefHat className="size-3" /> Kitchen Spend:
                        </span>
                        <span className="font-bold text-primary">
                          -{CURRENCY_SYMBOL}
                          {member.totalKitchenExpense.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t pt-1.5 font-semibold text-foreground">
                      <span>Total Outflows:</span>
                      <span className="text-destructive font-bold">
                        -{CURRENCY_SYMBOL}
                        {member.totalExpense.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons (Touch targets >= 44px) */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t mt-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onAddIncomeForMember(member.memberId)}
                      className="min-h-[44px] text-xs font-semibold gap-1 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      <Plus className="size-3.5" />
                      Add Income
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onAddExpenseForMember(member.memberId)}
                      className="min-h-[44px] text-xs font-semibold gap-1"
                    >
                      <Plus className="size-3.5" />
                      Log Expense
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
