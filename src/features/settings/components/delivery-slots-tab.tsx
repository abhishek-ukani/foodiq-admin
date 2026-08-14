import { useState } from 'react'
import { Clock, MoreHorizontal, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/common/empty-state'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import {
  useCreateDeliverySlot,
  useDeleteDeliverySlot,
  useDeliverySlots,
  useUpdateDeliverySlot,
} from '@/features/settings/hooks/use-delivery'
import type { MealType, Tables } from '@/types/database.types'

type Slot = Tables<'delivery_slots'>

const EMPTY_FORM = {
  label: '',
  meal_type: 'lunch' as MealType,
  start_time: '12:00',
  end_time: '14:00',
  cutoff_time: '10:00',
}

export function DeliverySlotsTab() {
  const { data: slots, isPending } = useDeliverySlots()
  const createSlot = useCreateDeliverySlot()
  const updateSlot = useUpdateDeliverySlot()
  const deleteSlot = useDeleteDeliverySlot()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Slot | null>(null)
  const [deleting, setDeleting] = useState<Slot | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const openCreateForm = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEditForm = (slot: Slot) => {
    setEditing(slot)
    setForm({
      label: slot.label,
      meal_type: slot.meal_type,
      start_time: slot.start_time.slice(0, 5),
      end_time: slot.end_time.slice(0, 5),
      cutoff_time: slot.cutoff_time.slice(0, 5),
    })
    setFormOpen(true)
  }

  const handleSave = () => {
    const payload = { ...form, display_order: editing?.display_order ?? 0 }
    if (editing) {
      updateSlot.mutate({ id: editing.id, input: payload }, { onSuccess: () => setFormOpen(false) })
    } else {
      createSlot.mutate(payload, { onSuccess: () => setFormOpen(false) })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Delivery windows customers can choose at checkout.</p>
        <Button size="sm" onClick={openCreateForm}>
          <Plus className="size-4" aria-hidden />
          Add slot
        </Button>
      </div>

      {!isPending && !slots?.length ? (
        <EmptyState icon={Clock} title="No delivery slots yet" className="border-none py-10" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Meal</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Cutoff</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {slots?.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell className="font-medium">{slot.label}</TableCell>
                  <TableCell className="capitalize">{slot.meal_type}</TableCell>
                  <TableCell>
                    {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                  </TableCell>
                  <TableCell>{slot.cutoff_time.slice(0, 5)}</TableCell>
                  <TableCell>
                    <Badge variant={slot.is_active ? 'secondary' : 'outline'}>
                      {slot.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions">
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditForm(slot)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateSlot.mutate({ id: slot.id, input: { is_active: !slot.is_active } })
                          }
                        >
                          {slot.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(slot)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit delivery slot' : 'Add delivery slot'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Label (e.g. Lunch 12–2 PM)"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
            <Select
              value={form.meal_type}
              onValueChange={(v) => setForm({ ...form, meal_type: v as MealType })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="mb-1.5 text-sm">Start</p>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div>
                <p className="mb-1.5 text-sm">End</p>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
              <div>
                <p className="mb-1.5 text-sm">Cutoff</p>
                <Input
                  type="time"
                  value={form.cutoff_time}
                  onChange={(e) => setForm({ ...form, cutoff_time: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.label || createSlot.isPending || updateSlot.isPending}
            >
              {editing ? 'Save changes' : 'Add slot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this delivery slot?"
        description={`"${deleting?.label}" will no longer be selectable at checkout.`}
        confirmLabel="Delete"
        isLoading={deleteSlot.isPending}
        onConfirm={() => deleting && deleteSlot.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  )
}
