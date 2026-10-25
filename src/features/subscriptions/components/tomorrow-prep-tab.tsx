import { useState } from 'react'
import { ChefHat, Sparkles, Utensils, Calendar, RefreshCcw, CheckCircle2 } from 'lucide-react'
import dayjs from 'dayjs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/common/empty-state'
import { useTomorrowPrep } from '../hooks/use-subscriptions'

export function TomorrowPrepTab() {
  const tomorrowStr = dayjs().add(1, 'day').format('YYYY-MM-DD')
  const [selectedDate, setSelectedDate] = useState(tomorrowStr)

  const { data: prep, isLoading, refetch } = useTomorrowPrep(selectedDate)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Kitchen Prep List (Subscriptions)</h2>
          <p className="text-sm text-muted-foreground">
            Aggregated subscription meal preparation counts and complimentary sweets for any target date.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40 text-xs"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-1.5 text-xs shrink-0"
          >
            <RefreshCcw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Aggregate Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/20 bg-card">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Total Meals</span>
              <ChefHat className="size-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {prep?.totalMeals ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            For {dayjs(selectedDate).format('ddd, MMM D')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Lunch Meals</span>
              <Utensils className="size-4 text-amber-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {prep?.lunchCount ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Midday delivery window
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Dinner Meals</span>
              <Utensils className="size-4 text-indigo-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {prep?.dinnerCount ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Evening delivery window
          </CardContent>
        </Card>

        <Card className="border-amber-300/40 bg-amber-50/40 dark:bg-amber-950/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <span>Complimentary Sweets</span>
              <Sparkles className="size-4 text-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {prep?.sweetsCount ?? 0} 🍬
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-amber-700 dark:text-amber-400">
            Weekly rewards to pack
          </CardContent>
        </Card>
      </div>

      {/* Production Breakdown by Thali Meal Choice */}
      {prep && prep.mealBreakdown && Object.keys(prep.mealBreakdown).length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Utensils className="size-4 text-primary" />
              Production Breakdown by Thali
            </CardTitle>
            <CardDescription className="text-xs">
              Exact meal portions to cook for tomorrow's scheduled subscribers (Classic &amp; Deluxe require Dal-Bhat).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(prep.mealBreakdown).map(([thaliName, count]) => (
                <Badge
                  key={thaliName}
                  variant="outline"
                  className="px-3 py-1.5 text-xs font-semibold bg-background border-primary/30 text-foreground flex items-center gap-2 shadow-2xs"
                >
                  <span>{thaliName}:</span>
                  <span className="font-mono font-bold text-primary text-sm">{count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deliveries Detail Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="size-4.5 text-primary" />
                Scheduled Deliveries for {dayjs(selectedDate).format('dddd, MMMM D, YYYY')}
              </CardTitle>
              <CardDescription className="text-xs">
                Showing all scheduled subscription deliveries and required kitchen prep counts for {selectedDate}.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="gap-1 text-xs">
              <RefreshCcw className="size-3.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted/60 rounded-lg" />
              ))}
            </div>
          ) : !prep?.deliveries || prep.deliveries.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No subscription deliveries scheduled"
                description={`There are no active subscription meals scheduled for delivery on ${dayjs(selectedDate).format('MMM D, YYYY')}.`}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subscription #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Meal Choice</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Sweet Reward</TableHead>
                    <TableHead className="text-right">Order Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prep.deliveries.map((d: any) => (
                    <TableRow key={d.id} className="text-xs">
                      <TableCell className="font-mono font-semibold">
                        {d.subscriptions?.subscription_number}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">
                          {d.subscriptions?.profiles?.full_name || 'Subscriber'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {d.subscriptions?.profiles?.phone || '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs font-semibold bg-primary/5 text-primary border-primary/20"
                        >
                          {d.meal_thalis?.name ||
                            d.subscriptions?.meal_thalis?.name ||
                            d.subscriptions?.thali_snapshot?.name ||
                            'Regular Thali'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize font-semibold text-xs">
                          {d.meal_slot}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {d.subscriptions?.addresses?.address_line1},{' '}
                        {d.subscriptions?.addresses?.city}
                      </TableCell>
                      <TableCell>
                        {d.includes_sweet ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Sparkles className="size-3 text-amber-500" /> Yes 🍬
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {d.order_id ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <CheckCircle2 className="size-3.5" /> Order Placed
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Ready to cook</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
