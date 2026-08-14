import { useMemo, useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Plus, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/data-table/data-table'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { CategoryFormDialog } from '@/features/menu/components/category-form-dialog'
import { useCategories, useDeleteCategory, useUpdateCategory } from '@/features/menu/hooks/use-categories'
import type { Tables } from '@/types/database.types'

type Category = Tables<'categories'>

export function CategoriesPage() {
  const { data: categories, isPending } = useCategories()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Category',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-9 rounded-lg">
              <AvatarImage src={row.original.image_url ?? undefined} className="object-cover" />
              <AvatarFallback className="rounded-lg">
                <Tag className="size-4" aria-hidden />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-muted-foreground text-xs">/{row.original.slug}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground line-clamp-1">
            {row.original.description || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'display_order',
        header: 'Order',
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? 'secondary' : 'outline'}>
            {row.original.is_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions">
                <MoreHorizontal className="size-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditingCategory(row.original)
                  setFormOpen(true)
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  updateMutation.mutate({
                    id: row.original.id,
                    input: { is_active: !row.original.is_active },
                  })
                }
              >
                {row.original.is_active ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeletingCategory(row.original)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [updateMutation],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Categories</h1>
          <p className="text-muted-foreground text-sm">Group dishes so customers can browse by cuisine.</p>
        </div>
        <Button
          onClick={() => {
            setEditingCategory(null)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" aria-hidden />
          Add category
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={categories ?? []}
        isLoading={isPending}
        emptyTitle="No categories yet"
        emptyDescription="Add your first category to start organizing the menu."
      />

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editingCategory} />

      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title="Delete this category?"
        description={`"${deletingCategory?.name}" will be removed. Food items in this category will become uncategorized, not deleted.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() =>
          deletingCategory &&
          deleteMutation.mutate(deletingCategory.id, { onSuccess: () => setDeletingCategory(null) })
        }
      />
    </div>
  )
}
