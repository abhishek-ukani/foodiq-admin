import { useState } from 'react'
import { Image as ImageIcon, MoreHorizontal, Plus } from 'lucide-react'
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
import { ImageUpload } from '@/components/common/image-upload'
import { useBannerMutations, useBanners } from '@/features/content/hooks/use-content'
import type { BannerPlacement, Tables } from '@/types/database.types'

type Banner = Tables<'banners'>

const EMPTY_FORM = {
  placement: 'hero' as BannerPlacement,
  title: '',
  subtitle: '',
  image_url: '' as string | null,
  cta_label: '',
  cta_url: '',
}

export function BannersTab() {
  const { data: banners, isPending } = useBanners()
  const { create, update, remove } = useBannerMutations()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [deleting, setDeleting] = useState<Banner | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const openCreateForm = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }
  const openEditForm = (banner: Banner) => {
    setEditing(banner)
    setForm({
      placement: banner.placement,
      title: banner.title ?? '',
      subtitle: banner.subtitle ?? '',
      image_url: banner.image_url,
      cta_label: banner.cta_label ?? '',
      cta_url: banner.cta_url ?? '',
    })
    setFormOpen(true)
  }

  const handleSave = () => {
    if (!form.image_url) return
    const payload = {
      placement: form.placement,
      title: form.title || null,
      subtitle: form.subtitle || null,
      image_url: form.image_url,
      cta_label: form.cta_label || null,
      cta_url: form.cta_url || null,
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
        <p className="text-muted-foreground text-sm">Hero and promo images shown on the customer site.</p>
        <Button size="sm" onClick={openCreateForm}>
          <Plus className="size-4" aria-hidden />
          Add banner
        </Button>
      </div>

      {!isPending && !banners?.length ? (
        <EmptyState icon={ImageIcon} title="No banners yet" className="border-none py-10" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banner</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners?.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell className="flex items-center gap-3">
                    <img src={banner.image_url} alt="" className="size-10 rounded-md object-cover" />
                    <span className="font-medium">{banner.title ?? 'Untitled'}</span>
                  </TableCell>
                  <TableCell className="capitalize">{banner.placement.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Badge variant={banner.is_active ? 'secondary' : 'outline'}>
                      {banner.is_active ? 'Active' : 'Inactive'}
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
                        <DropdownMenuItem onClick={() => openEditForm(banner)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            update.mutate({ id: banner.id, input: { is_active: !banner.is_active } })
                          }
                        >
                          {banner.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(banner)}>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit banner' : 'Add banner'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ImageUpload
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
              bucket="banners"
            />
            <Select
              value={form.placement}
              onValueChange={(v) => setForm({ ...form, placement: v as BannerPlacement })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hero">Hero</SelectItem>
                <SelectItem value="promo_strip">Promo strip</SelectItem>
                <SelectItem value="menu_top">Menu top</SelectItem>
                <SelectItem value="popup">Popup</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Title (optional)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="Subtitle (optional)"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="CTA label"
                value={form.cta_label}
                onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
              />
              <Input
                placeholder="CTA link"
                value={form.cta_url}
                onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.image_url || create.isPending || update.isPending}>
              {editing ? 'Save changes' : 'Add banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this banner?"
        description="It will be removed from the site immediately."
        confirmLabel="Delete"
        isLoading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  )
}
