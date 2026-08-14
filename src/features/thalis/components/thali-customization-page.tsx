import { useState } from 'react'
import {
  Plus,
  Trash2,
  Edit2,
  Utensils,
  Search,
  Sparkles,
  Layers,
  SlidersHorizontal,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { useFoodItems, useUpdateFoodItem, useDeleteFoodItem } from '@/features/food-items/hooks/use-food-items'
import { useThaliOptionGroups } from '../services/thali-admin-service'
import { ThaliEditorSheet } from './thali-editor-sheet'
import { DailyThaliChoicesCard } from './daily-thali-choices-card'
import { CURRENCY_SYMBOL } from '@/constants'
import type { FoodItemWithCategory } from '@/features/food-items/services/food-items-service'

function ThaliCard({
  item,
  onEdit,
  onDelete,
  onToggleAvailable,
}: {
  item: FoodItemWithCategory
  onEdit: () => void
  onDelete: () => void
  onToggleAvailable: (checked: boolean) => void
}) {
  const { data: optionGroups } = useThaliOptionGroups(item.id)

  return (
    <Card className={`overflow-hidden transition-all ${item.is_available ? '' : 'opacity-70 bg-muted/30'}`}>
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">{item.name}</CardTitle>
              <Badge variant={item.is_available ? 'secondary' : 'outline'} className="text-[10px] h-5">
                {item.is_available ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
            {item.description && (
              <CardDescription className="text-xs line-clamp-2">
                {item.description}
              </CardDescription>
            )}
          </div>
          <div className="text-right shrink-0">
            <span className="text-base font-bold text-primary tabular-nums">
              {CURRENCY_SYMBOL}{item.offer_price ?? item.price}
            </span>
            {item.offer_price && (
              <span className="text-xs text-muted-foreground line-through block tabular-nums">
                {CURRENCY_SYMBOL}{item.price}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-2 space-y-2 border-t bg-muted/10">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1">
            <Layers className="size-3.5 text-muted-foreground" />
            Customization Groups ({optionGroups?.length || 0})
          </span>
        </div>

        {!optionGroups?.length ? (
          <p className="text-xs text-muted-foreground italic">
            No customization groups configured yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {optionGroups.map((grp) => (
              <Badge
                key={grp.id}
                variant="outline"
                className="text-[11px] font-normal bg-background"
              >
                {grp.name}
                {grp.group_type === 'daily_menu_choice' && (
                  <Sparkles className="size-3 text-amber-500 ml-1 inline" />
                )}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 border-t flex items-center justify-between gap-2 bg-background">
        <div className="flex items-center gap-2">
          <Switch
            id={`switch-${item.id}`}
            checked={item.is_available}
            onCheckedChange={onToggleAvailable}
          />
          <label htmlFor={`switch-${item.id}`} className="text-xs text-muted-foreground cursor-pointer">
            {item.is_available ? 'Active' : 'Disabled'}
          </label>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={onEdit}>
            <Edit2 className="size-3.5" />
            Manage Thali
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export function ThaliCustomizationPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [editorSheetOpen, setEditorSheetOpen] = useState(false)
  const [selectedThali, setSelectedThali] = useState<FoodItemWithCategory | null>(null)
  const [activeTab, setActiveTab] = useState('daily-choices')

  const { data: foodItems, isPending } = useFoodItems()
  const updateMutation = useUpdateFoodItem()
  const deleteMutation = useDeleteFoodItem()

  // Filter items to show Thalis
  const thaliItems = (foodItems || []).filter((item) => {
    const isThali =
      (item.categories as any)?.category_type === 'thali' ||
      item.name.toLowerCase().includes('thali') ||
      item.categories?.name.toLowerCase().includes('thali')
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return isThali && matchesSearch
  })

  // Fallback to search query across all food items if no specific thali matches
  const displayItems =
    thaliItems.length > 0
      ? thaliItems
      : (foodItems || []).filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )

  const handleOpenCreate = () => {
    setSelectedThali(null)
    setEditorSheetOpen(true)
  }

  const handleOpenEdit = (item: FoodItemWithCategory) => {
    setSelectedThali(item)
    setEditorSheetOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Standard Admin Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Thali Options & Management</h1>
          <p className="text-muted-foreground text-sm">
            Manage daily Thali sub-options (Sabjis, Rotis, Sweets) and configure Thali customization rules.
          </p>
        </div>
        {activeTab === 'templates' && (
          <Button onClick={handleOpenCreate}>
            <Plus className="size-4" aria-hidden />
            Add Thali Package
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid max-w-md grid-cols-2">
          <TabsTrigger value="daily-choices" className="gap-2">
            <SlidersHorizontal className="size-4" />
            Daily Items
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Layers className="size-4" />
            Thali Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily-choices" className="space-y-6">
          <DailyThaliChoicesCard />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {/* Standard Admin Search Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
              <Input
                placeholder="Search Thalis…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline-block">
              {displayItems.length} Thali(s)
            </span>
          </div>

          {/* Thali Grid */}
          {isPending ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-xl" />
              ))}
            </div>
          ) : displayItems.length === 0 ? (
            <EmptyState
              icon={Utensils}
              title="No Thalis found"
              description="Click 'Add Thali Package' above to create your first Thali dish and configure its customization options."
              action={
                <Button onClick={handleOpenCreate}>
                  <Plus className="size-4 mr-2" /> Add Thali Package
                </Button>
              }
              className="border-dashed py-12"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayItems.map((item) => (
                <ThaliCard
                  key={item.id}
                  item={item}
                  onEdit={() => handleOpenEdit(item)}
                  onDelete={() => deleteMutation.mutate(item.id)}
                  onToggleAvailable={(checked) =>
                    updateMutation.mutate({
                      id: item.id,
                      input: { is_available: checked },
                    })
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Standard Form Sheet */}
      <ThaliEditorSheet
        open={editorSheetOpen}
        onOpenChange={setEditorSheetOpen}
        thaliItem={selectedThali}
      />
    </div>
  )
}

