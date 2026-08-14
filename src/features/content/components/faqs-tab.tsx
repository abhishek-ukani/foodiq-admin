import { useState } from 'react'
import { HelpCircle, MoreHorizontal, Plus } from 'lucide-react'
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
import { useFaqMutations, useFaqs } from '@/features/content/hooks/use-content'
import type { Tables } from '@/types/database.types'

type Faq = Tables<'faqs'>

const EMPTY_FORM = { question: '', answer: '', category: '' }

export function FaqsTab() {
  const { data: faqs, isPending } = useFaqs()
  const { create, update, remove } = useFaqMutations()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Faq | null>(null)
  const [deleting, setDeleting] = useState<Faq | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const openCreateForm = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }
  const openEditForm = (faq: Faq) => {
    setEditing(faq)
    setForm({ question: faq.question, answer: faq.answer, category: faq.category ?? '' })
    setFormOpen(true)
  }

  const handleSave = () => {
    const payload = { question: form.question, answer: form.answer, category: form.category || null }
    if (editing) {
      update.mutate({ id: editing.id, input: payload }, { onSuccess: () => setFormOpen(false) })
    } else {
      create.mutate(payload, { onSuccess: () => setFormOpen(false) })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Shown on the FAQ page and homepage teaser.</p>
        <Button size="sm" onClick={openCreateForm}>
          <Plus className="size-4" aria-hidden />
          Add FAQ
        </Button>
      </div>

      {!isPending && !faqs?.length ? (
        <EmptyState icon={HelpCircle} title="No FAQs yet" className="border-none py-10" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs?.map((faq) => (
                <TableRow key={faq.id}>
                  <TableCell className="max-w-md font-medium">{faq.question}</TableCell>
                  <TableCell>
                    <Badge variant={faq.is_published ? 'secondary' : 'outline'}>
                      {faq.is_published ? 'Published' : 'Hidden'}
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
                        <DropdownMenuItem onClick={() => openEditForm(faq)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            update.mutate({ id: faq.id, input: { is_published: !faq.is_published } })
                          }
                        >
                          {faq.is_published ? 'Hide' : 'Publish'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(faq)}>
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
            <DialogTitle>{editing ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Question"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
            />
            <Textarea
              placeholder="Answer"
              rows={4}
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
            />
            <Input
              placeholder="Category (optional)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.question || !form.answer || create.isPending || update.isPending}
            >
              {editing ? 'Save changes' : 'Add FAQ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this FAQ?"
        description="It will be removed from the FAQ page immediately."
        confirmLabel="Delete"
        isLoading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  )
}
