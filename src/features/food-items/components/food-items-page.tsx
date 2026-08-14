import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Plus, Search, UtensilsCrossed, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/data-table/data-table'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { FoodItemFormSheet } from '@/features/food-items/components/food-item-form-sheet'
import {
  useDeleteFoodItem,
  useFoodItems,
  useUpdateFoodItem,
} from '@/features/food-items/hooks/use-food-items'
import { useCategories } from '@/features/menu/hooks/use-categories'
import type { FoodItemWithCategory } from '@/features/food-items/services/food-items-service'
import { CURRENCY_SYMBOL } from '@/constants'

export function FoodItemsPage() {
  const { data: items, isPending } = useFoodItems()
  const { data: categories } = useCategories()
  const updateMutation = useUpdateFoodItem()
  const deleteMutation = useDeleteFoodItem()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FoodItemWithCategory | null>(null)
  const [deletingItem, setDeletingItem] = useState<FoodItemWithCategory | null>(null)

  const filtered = useMemo(() => {
    if (!items) return []
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      const matchesSearch = !query || item.name.toLowerCase().includes(query)
      const matchesCategory =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'uncategorized'
          ? !item.category_id
          : item.category_id === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [items, search, selectedCategory])

  const columns = useMemo<ColumnDef<FoodItemWithCategory>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Item',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-9 rounded-lg">
              <AvatarImage src={row.original.image_url ?? undefined} className="object-cover" />
              <AvatarFallback className="rounded-lg">
                <UtensilsCrossed className="size-4" aria-hidden />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-muted-foreground text-xs">
                {row.original.categories?.name ?? 'Uncategorized'}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => (
          <div>
            {row.original.offer_price ? (
              <>
                <span className="font-medium">
                  {CURRENCY_SYMBOL}
                  {row.original.offer_price}
                </span>
                <span className="text-muted-foreground ml-1.5 text-xs line-through">
                  {CURRENCY_SYMBOL}
                  {row.original.price}
                </span>
              </>
            ) : (
              <span className="font-medium">
                {CURRENCY_SYMBOL}
                {row.original.price}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'special_prep',
        header: 'Dietary Options',
        cell: ({ row }) => {
          const item = row.original as any
          const preps = []
          if (item.is_swaminarayan_available) preps.push('Swaminarayan')
          if (item.is_vaishnav_available) preps.push('Vaishnav')
          if (item.is_jain_available) preps.push('Jain')

          if (preps.length === 0) {
            return <span className="text-muted-foreground text-xs font-medium">Standard Veg</span>
          }

          return (
            <div className="flex flex-wrap gap-1">
              {preps.map((p) => (
                <Badge key={p} variant="outline" className="text-xs bg-amber-50 text-amber-900 border-amber-200">
                  {p}
                </Badge>
              ))}
            </div>
          )
        },
      },
      {
        accessorKey: 'is_available',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.is_available ? 'secondary' : 'outline'}>
            {row.original.is_available ? 'Available' : 'Unavailable'}
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
                  setEditingItem(row.original)
                  setFormOpen(true)
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  updateMutation.mutate({
                    id: row.original.id,
                    input: { is_available: !row.original.is_available },
                  })
                }
              >
                {row.original.is_available ? 'Mark unavailable' : 'Mark available'}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeletingItem(row.original)}
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
          <h1 className="font-display text-2xl font-semibold">Food Items</h1>
          <p className="text-muted-foreground text-sm">Manage the dishes available across your menu.</p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" aria-hidden />
          Add item
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground hidden sm:inline-block" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isPending}
        emptyTitle={search ? 'No matching items' : 'No food items yet'}
        emptyDescription={search ? 'Try a different search term.' : 'Add your first dish to get started.'}
      />

      <FoodItemFormSheet open={formOpen} onOpenChange={setFormOpen} item={editingItem} />

      <ConfirmDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        title="Delete this food item?"
        description={`"${deletingItem?.name}" will be permanently removed from your catalog.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={() =>
          deletingItem &&
          deleteMutation.mutate(deletingItem.id, { onSuccess: () => setDeletingItem(null) })
        }
      />
    </div>
  )
}
