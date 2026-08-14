import { useState } from 'react'
import { MessageSquareQuote, MoreHorizontal, Plus, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { useTestimonialMutations, useTestimonials } from '@/features/content/hooks/use-content'
import type { Tables } from '@/types/database.types'

type Testimonial = Tables<'testimonials'>

const EMPTY_FORM = { author_name: '', author_role: '', quote: '', rating: 5 }

export function TestimonialsTab() {
  const { data: testimonials, isPending } = useTestimonials()
  const { create, update, remove } = useTestimonialMutations()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Testimonial | null>(null)
  const [deleting, setDeleting] = useState<Testimonial | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const openCreateForm = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }
  const openEditForm = (t: Testimonial) => {
    setEditing(t)
    setForm({ author_name: t.author_name, author_role: t.author_role ?? '', quote: t.quote, rating: t.rating ?? 5 })
    setFormOpen(true)
  }

  const handleSave = () => {
    const payload = {
      author_name: form.author_name,
      author_role: form.author_role || null,
      quote: form.quote,
      rating: form.rating,
    }
    if (editing) {
      update.mutate({ id: editing.id, input: payload }, { onSuccess: () => setFormOpen(false) })
    } else {
      create.mutate(payload, { onSuccess: () => setFormOpen(false) })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Customer quotes shown on the homepage.</p>
        <Button size="sm" onClick={openCreateForm}>
          <Plus className="size-4" aria-hidden />
          Add testimonial
        </Button>
      </div>

      {!isPending && !testimonials?.length ? (
        <EmptyState icon={MessageSquareQuote} title="No testimonials yet" className="border-none py-10" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead>Quote</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonials?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.author_name}</TableCell>
                  <TableCell className="max-w-xs truncate">{t.quote}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Star className="size-3.5 fill-current text-amber-500" aria-hidden />
                      {t.rating ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.is_published ? 'secondary' : 'outline'}>
                      {t.is_published ? 'Published' : 'Hidden'}
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
                        <DropdownMenuItem onClick={() => openEditForm(t)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            update.mutate({ id: t.id, input: { is_published: !t.is_published } })
                          }
                        >
                          {t.is_published ? 'Hide' : 'Publish'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(t)}>
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
            <DialogTitle>{editing ? 'Edit testimonial' : 'Add testimonial'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Author name"
                value={form.author_name}
                onChange={(e) => setForm({ ...form, author_name: e.target.value })}
              />
              <Input
                placeholder="Role (e.g. Regular customer)"
                value={form.author_role}
                onChange={(e) => setForm({ ...form, author_role: e.target.value })}
              />
            </div>
            <Textarea
              placeholder="Quote"
              rows={3}
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
            />
            <Input
              type="number"
              min={1}
              max={5}
              placeholder="Rating (1-5)"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.valueAsNumber || 5 })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.author_name || !form.quote || create.isPending || update.isPending}
            >
              {editing ? 'Save changes' : 'Add testimonial'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this testimonial?"
        description="It will be removed from the homepage immediately."
        confirmLabel="Delete"
        isLoading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  )
}
