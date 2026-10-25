import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import {
  Calendar,
  CalendarOff,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  PartyPopper,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import {
  useHolidaySettings,
  useSaveHolidaySettings,
} from '@/features/settings/hooks/use-holidays'
import type { KitchenHoliday, HolidaySettings } from '@/features/settings/schemas/settings-schemas'

type HolidayFormData = {
  id?: string
  title: string
  startDate: string
  endDate: string
  mealType: 'all' | 'lunch' | 'dinner'
  message: string
  isActive: boolean
  isRange: boolean
}

const EMPTY_FORM: HolidayFormData = {
  title: '',
  startDate: dayjs().format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
  mealType: 'all',
  message: '',
  isActive: true,
  isRange: false,
}

export function HolidaysTab() {
  const { data: settings, isPending } = useHolidaySettings()
  const saveMutation = useSaveHolidaySettings()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<HolidayFormData>(EMPTY_FORM)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const todayStr = dayjs().format('YYYY-MM-DD')

  const currentSettings: HolidaySettings = useMemo(() => {
    return settings || { enabled: true, holidays: [] }
  }, [settings])

  // Find if any holiday is currently active today
  const activeTodayHoliday = useMemo(() => {
    if (!currentSettings.enabled) return null
    return currentSettings.holidays.find(
      (h) => h.isActive && todayStr >= h.startDate && todayStr <= h.endDate,
    )
  }, [currentSettings, todayStr])

  // Sorted list: active today first, then upcoming, then past
  const sortedHolidays = useMemo(() => {
    return [...currentSettings.holidays].sort((a, b) => {
      const aIsActive = a.isActive && todayStr >= a.startDate && todayStr <= a.endDate
      const bIsActive = b.isActive && todayStr >= b.startDate && todayStr <= b.endDate
      if (aIsActive && !bIsActive) return -1
      if (!aIsActive && bIsActive) return 1
      return b.startDate.localeCompare(a.startDate)
    })
  }, [currentSettings.holidays, todayStr])

  const handleGlobalToggle = (enabled: boolean) => {
    saveMutation.mutate({
      ...currentSettings,
      enabled,
    })
  }

  const handleOpenAddDialog = () => {
    setFormData({
      ...EMPTY_FORM,
      startDate: todayStr,
      endDate: todayStr,
      isRange: false,
    })
    setDialogOpen(true)
  }

  const handleOpenEditDialog = (holiday: KitchenHoliday) => {
    setFormData({
      id: holiday.id,
      title: holiday.title,
      startDate: holiday.startDate,
      endDate: holiday.endDate,
      mealType: holiday.mealType,
      message: holiday.message || '',
      isActive: holiday.isActive,
      isRange: holiday.startDate !== holiday.endDate,
    })
    setDialogOpen(true)
  }

  const handleApplyPreset = (preset: 'today' | 'diwali' | 'maintenance') => {
    if (preset === 'today') {
      setFormData((prev) => ({
        ...prev,
        title: 'Closed Today',
        startDate: todayStr,
        endDate: todayStr,
        isRange: false,
        mealType: 'all',
        message: 'We are closed today. Pre-orders are open for tomorrow.',
      }))
    } else if (preset === 'diwali') {
      const start = dayjs().add(2, 'day').format('YYYY-MM-DD')
      const end = dayjs().add(7, 'day').format('YYYY-MM-DD')
      setFormData((prev) => ({
        ...prev,
        title: 'Diwali Vacation',
        startDate: start,
        endDate: end,
        isRange: true,
        mealType: 'all',
        message: `We will be closed for Diwali celebrations from ${dayjs(start).format('D MMM')} to ${dayjs(end).format('D MMM')}. Regular service resumes on ${dayjs(end).add(1, 'day').format('D MMM')}. Wishing you a Happy Diwali!`,
      }))
    } else if (preset === 'maintenance') {
      setFormData((prev) => ({
        ...prev,
        title: 'Kitchen Maintenance',
        startDate: todayStr,
        endDate: todayStr,
        isRange: false,
        mealType: 'all',
        message: 'Kitchen is undergoing scheduled deep cleaning and maintenance today. Ordering will resume tomorrow.',
      }))
    }
  }

  const handleSaveHoliday = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    const finalEndDate = formData.isRange ? formData.endDate : formData.startDate

    const newHoliday: KitchenHoliday = {
      id: formData.id || `hol_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: formData.title.trim(),
      startDate: formData.startDate,
      endDate: finalEndDate,
      mealType: formData.mealType,
      message: formData.message.trim(),
      isActive: formData.isActive,
      createdAt: new Date().toISOString(),
    }

    const updatedList = formData.id
      ? currentSettings.holidays.map((h) => (h.id === formData.id ? newHoliday : h))
      : [newHoliday, ...currentSettings.holidays]

    saveMutation.mutate(
      {
        ...currentSettings,
        holidays: updatedList,
      },
      {
        onSuccess: () => setDialogOpen(false),
      },
    )
  }

  const handleToggleHolidayActive = (id: string, active: boolean) => {
    const updated = currentSettings.holidays.map((h) =>
      h.id === id ? { ...h, isActive: active } : h,
    )
    saveMutation.mutate({
      ...currentSettings,
      holidays: updated,
    })
  }

  const handleDeleteHoliday = () => {
    if (!deleteTargetId) return
    const updated = currentSettings.holidays.filter((h) => h.id !== deleteTargetId)
    saveMutation.mutate(
      {
        ...currentSettings,
        holidays: updated,
      },
      {
        onSuccess: () => setDeleteTargetId(null),
      },
    )
  }

  // Days count helper
  const rangeDaysCount = useMemo(() => {
    if (!formData.isRange) return 1
    const s = dayjs(formData.startDate)
    const e = dayjs(formData.endDate)
    const diff = e.diff(s, 'day') + 1
    return diff > 0 ? diff : 1
  }, [formData.startDate, formData.endDate, formData.isRange])

  if (isPending) return <Skeleton className="h-64 w-full rounded-xl" />

  return (
    <div className="space-y-6">
      {/* ── CARD 1: GLOBAL CONTROL & ACTIVE NOTICE ── */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarOff className="size-5 text-amber-600" />
              <CardTitle className="text-xl">Kitchen Holidays &amp; Closure Updates</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Inform customers when the kitchen is closed for a single day or an extended date range (e.g. Diwali vacation, festival holidays, or deep cleaning). Active holidays automatically pause deliveries and extend all subscriber meal plans without penalty.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground">
              {currentSettings.enabled ? 'Holidays Active' : 'Holidays Disabled'}
            </span>
            <Switch
              checked={currentSettings.enabled}
              onCheckedChange={handleGlobalToggle}
              disabled={saveMutation.isPending}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Active Today Banner */}
          {activeTodayHoliday ? (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-950 shadow-xs">
              <span className="relative flex size-3 mt-0.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-3 bg-red-600" />
              </span>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-red-900">
                    Kitchen Closed Today: {activeTodayHoliday.title}
                  </span>
                  <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                    Active on Website
                  </Badge>
                  <span className="text-xs text-red-800 font-medium">
                    ({dayjs(activeTodayHoliday.startDate).format('D MMM')} – {dayjs(activeTodayHoliday.endDate).format('D MMM YYYY')})
                  </span>
                </div>
                <p className="text-xs text-red-800 leading-relaxed">
                  {activeTodayHoliday.message ||
                    `We are closed today. Meal service (${activeTodayHoliday.mealType === 'all' ? 'All Meals' : activeTodayHoliday.mealType}) is unavailable.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>
                No closure active today. Regular published menu ordering is active as normal.
              </span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Scheduled Holidays: <strong>{currentSettings.holidays.length}</strong>
            </p>
            <Button
              onClick={handleOpenAddDialog}
              size="sm"
              className="gap-2 bg-primary text-white"
            >
              <Plus className="size-4" />
              <span>Add Holiday / Closure</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── CARD 2: SCHEDULED HOLIDAYS LIST ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Scheduled Holiday List</CardTitle>
          <CardDescription>
            Upcoming and past closure dates. When active, customers will see clear closure notices and ordering will be disabled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedHolidays.length === 0 ? (
            <div className="py-12 text-center border border-dashed rounded-xl space-y-3">
              <div className="size-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xl">
                🗓️
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">No holidays scheduled</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                  Add planned holidays (like Diwali 5-6 days break, Holi, or kitchen cleaning) so your customers stay informed.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddDialog}
                className="gap-1.5"
              >
                <Plus className="size-3.5" />
                Add Your First Holiday
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedHolidays.map((h) => {
                const isActiveToday = h.isActive && todayStr >= h.startDate && todayStr <= h.endDate
                const isUpcoming = h.startDate > todayStr
                const isPast = h.endDate < todayStr
                const isSingleDay = h.startDate === h.endDate
                const durationDays = dayjs(h.endDate).diff(dayjs(h.startDate), 'day') + 1

                return (
                  <div
                    key={h.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                      isActiveToday
                        ? 'border-red-300 bg-red-50/50 shadow-xs'
                        : isPast
                        ? 'border-neutral-200 bg-neutral-50/70 opacity-75'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">{h.title}</span>

                        {isActiveToday && (
                          <Badge className="bg-red-600 text-white text-[10px] font-bold">
                            Active Today
                          </Badge>
                        )}
                        {isUpcoming && (
                          <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 text-[10px] font-bold">
                            Upcoming
                          </Badge>
                        )}
                        {isPast && (
                          <Badge variant="secondary" className="text-[10px] font-medium text-neutral-500">
                            Past
                          </Badge>
                        )}
                        {!h.isActive && (
                          <Badge variant="secondary" className="text-[10px] font-medium text-neutral-400">
                            Disabled
                          </Badge>
                        )}

                        <Badge variant="outline" className="text-[10px] font-semibold capitalize text-neutral-700">
                          {h.mealType === 'all' ? 'Full Day' : `${h.mealType} Only`}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Calendar className="size-3.5 text-primary" />
                          {isSingleDay ? (
                            dayjs(h.startDate).format('D MMMM YYYY')
                          ) : (
                            <>
                              {dayjs(h.startDate).format('D MMM')} – {dayjs(h.endDate).format('D MMM YYYY')} ({durationDays} days)
                            </>
                          )}
                        </span>
                      </div>

                      {h.message && (
                        <p className="text-xs text-muted-foreground italic line-clamp-2">
                          &ldquo;{h.message}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      <div className="flex items-center gap-1.5 mr-2">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {h.isActive ? 'Active' : 'Off'}
                        </span>
                        <Switch
                          checked={h.isActive}
                          onCheckedChange={(checked) => handleToggleHolidayActive(h.id, checked)}
                          disabled={saveMutation.isPending}
                        />
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleOpenEditDialog(h)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTargetId(h.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── DIALOG: ADD / EDIT HOLIDAY ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSaveHoliday} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PartyPopper className="size-5 text-primary" />
                <span>{formData.id ? 'Edit Holiday / Closure' : 'Schedule Holiday or Closure'}</span>
              </DialogTitle>
            </DialogHeader>

            {/* Quick Presets */}
            {!formData.id && (
              <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-amber-600" />
                  Quick Presets:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2.5"
                    onClick={() => handleApplyPreset('today')}
                  >
                    Close Today (1 Day)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2.5 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                    onClick={() => handleApplyPreset('diwali')}
                  >
                    Diwali Vacation (5–6 Days)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2.5"
                    onClick={() => handleApplyPreset('maintenance')}
                  >
                    Deep Cleaning
                  </Button>
                </div>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Holiday Title / Occasion <span className="text-destructive">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Diwali Vacation, Kitchen Maintenance, Sunday Off"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Single Day vs Date Range Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
              <div>
                <p className="text-xs font-bold text-foreground">Multi-Day Date Range?</p>
                <p className="text-[11px] text-muted-foreground">
                  Enable for long holidays like Diwali, vacation, or festivals lasting several days.
                </p>
              </div>
              <Switch
                checked={formData.isRange}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    isRange: checked,
                    endDate: checked ? dayjs(formData.startDate).add(5, 'day').format('YYYY-MM-DD') : formData.startDate,
                  })
                }
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {formData.isRange ? 'Start Date' : 'Closure Date'}
                </label>
                <Input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => {
                    const newStart = e.target.value
                    setFormData({
                      ...formData,
                      startDate: newStart,
                      endDate: formData.isRange && newStart > formData.endDate ? newStart : formData.endDate,
                    })
                  }}
                />
              </div>

              {formData.isRange ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">End Date</label>
                  <Input
                    type="date"
                    required
                    min={formData.startDate}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Duration</label>
                  <div className="h-9 px-3 rounded-md border bg-muted/50 text-xs flex items-center text-muted-foreground font-medium">
                    Single Day Closure (1 day)
                  </div>
                </div>
              )}
            </div>

            {formData.isRange && (
              <p className="text-[11px] font-semibold text-primary">
                Total Closure Duration: {rangeDaysCount} days ({dayjs(formData.startDate).format('D MMM')} to {dayjs(formData.endDate).format('D MMM YYYY')})
              </p>
            )}

            {/* Affected Meals */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Meals Affected</label>
              <Select
                value={formData.mealType}
                onValueChange={(v) => setFormData({ ...formData, mealType: v as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select affected meals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Full Day (All Meals: Lunch &amp; Dinner)</SelectItem>
                  <SelectItem value="lunch">Lunch Only</SelectItem>
                  <SelectItem value="dinner">Dinner Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Message to Customers */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Message Shown to Customers (Optional)
              </label>
              <Textarea
                rows={3}
                placeholder="e.g. We will remain closed for Diwali celebrations from 24 Oct to 29 Oct. Regular delivery resumes on 30 Oct. Wishing everyone a happy Diwali!"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground">
                This message will be shown on the menu page banner, homepage delivery schedule, and cards.
              </p>
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-xs font-semibold text-foreground">Enable this holiday immediately</span>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : formData.id ? 'Update Holiday' : 'Create Holiday'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── CONFIRM DELETE DIALOG ── */}
      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="Delete Holiday Notice?"
        description="Are you sure you want to remove this scheduled holiday? If active, regular ordering rules will apply immediately."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteHoliday}
      />
    </div>
  )
}
