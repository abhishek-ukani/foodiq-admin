import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit2, Check, FolderTree, ChefHat, User, Sparkles } from 'lucide-react'
import { CategoryIcon } from './category-icon'
import { AVAILABLE_ICONS, PRESET_COLORS } from './category-constants'
import type { ExpenseCategory, ExpenseRecord, ExpenseCategoryScope } from '../types'
import toast from 'react-hot-toast'

interface CategoryManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: ExpenseCategory[]
  expenses: ExpenseRecord[]
  onSaveCategory: (category: Omit<ExpenseCategory, 'createdAt'> & { createdAt?: string }) => void
  onDeleteCategory: (id: string) => { success: boolean; error?: string }
}

export function CategoryManagerDialog({
  open,
  onOpenChange,
  categories,
  expenses,
  onSaveCategory,
  onDeleteCategory,
}: CategoryManagerDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#10b981')
  const [iconName, setIconName] = useState('Carrot')
  const [scope, setScope] = useState<ExpenseCategoryScope>('kitchen')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [activeFilterScope, setActiveFilterScope] = useState<'all' | 'kitchen' | 'personal'>('all')

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setColor('#10b981')
    setIconName('Carrot')
    setScope('kitchen')
    setDescription('')
    setIsCreating(false)
  }

  const handleStartEdit = (cat: ExpenseCategory) => {
    setEditingId(cat.id)
    setName(cat.name)
    setColor(cat.color)
    setIconName(cat.iconName || 'Tag')
    setScope(cat.scope || 'kitchen')
    setDescription(cat.description || '')
    setIsCreating(true)
  }

  const handleStartCreate = () => {
    resetForm()
    // Default scope to currently active tab filter if not 'all'
    if (activeFilterScope !== 'all') {
      setScope(activeFilterScope)
    }
    setIsCreating(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Category name is required')
      return
    }

    onSaveCategory({
      id: editingId || `cat-${Date.now()}`,
      name: name.trim(),
      color,
      iconName,
      scope,
      description: description.trim() || undefined,
    })

    toast.success(editingId ? 'Category updated' : 'New category added')
    resetForm()
  }

  const handleDelete = (cat: ExpenseCategory) => {
    const result = onDeleteCategory(cat.id)
    if (!result.success) {
      toast.error(result.error || 'Failed to delete category')
    } else {
      toast.success(`Category "${cat.name}" deleted`)
      if (editingId === cat.id) {
        resetForm()
      }
    }
  }

  const getCategoryUsageCount = (categoryId: string) => {
    return expenses.filter((e) => e.categoryId === categoryId).length
  }

  const displayedCategories = categories.filter((cat) => {
    if (activeFilterScope === 'all') return true
    return cat.scope === activeFilterScope || cat.scope === 'both' || (!cat.scope && activeFilterScope === 'kitchen')
  })

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogHeader className="pr-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderTree className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-semibold">Expense Categories</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Add, customize, and manage categories for kitchen and personal expenses.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isCreating ? (
          <form onSubmit={handleSave} className="space-y-4 rounded-xl border bg-muted/30 p-3 sm:p-4 min-w-0 w-full">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-semibold text-sm">
                {editingId ? 'Edit Category' : 'Create New Category'}
              </h4>
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                Cancel
              </Button>
            </div>

            {/* Scope Selector: Kitchen vs Personal vs Both */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category Scope *
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setScope('kitchen')}
                  className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition-all ${
                    scope === 'kitchen'
                      ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-xs'
                      : 'border-border bg-card hover:bg-muted text-foreground'
                  }`}
                >
                  <ChefHat className="size-3.5" />
                  <span>Kitchen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScope('personal')}
                  className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition-all ${
                    scope === 'personal'
                      ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                      : 'border-border bg-card hover:bg-muted text-foreground'
                  }`}
                >
                  <User className="size-3.5" />
                  <span>Personal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScope('both')}
                  className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition-all ${
                    scope === 'both'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-border bg-card hover:bg-muted text-foreground'
                  }`}
                >
                  <Sparkles className="size-3.5" />
                  <span>Both</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-name">Category Name *</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={scope === 'personal' ? 'e.g. Clothes, Dining Out, Gym' : 'e.g. Spices & Masalas, Dairy Products'}
                className="h-11 text-base sm:text-sm"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Theme Color</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {PRESET_COLORS.map((item) => (
                  <button
                    key={item.hex}
                    type="button"
                    onClick={() => setColor(item.hex)}
                    style={{ backgroundColor: item.hex }}
                    aria-label={item.label}
                    className="relative flex size-8 sm:size-7 items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {color === item.hex && <Check className="size-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 pt-1">
                {AVAILABLE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setIconName(icon)}
                    className={`flex min-h-[44px] flex-col items-center justify-center rounded-lg border p-2 transition-all ${
                      iconName === icon
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                        : 'border-border bg-card hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <CategoryIcon name={icon} className="size-5" />
                    <span className="mt-1 text-[10px] truncate max-w-full">{icon}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description (Optional)</Label>
              <Input
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What kind of expenses fall into this category?"
                className="h-11 text-base sm:text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={resetForm} className="min-h-[44px]">
                Cancel
              </Button>
              <Button type="submit" className="min-h-[44px] px-5">
                {editingId ? 'Update Category' : 'Save Category'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 py-1 min-w-0 w-full">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Scope Filter Tabs */}
              <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 border">
                <button
                  type="button"
                  onClick={() => setActiveFilterScope('all')}
                  className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-all ${
                    activeFilterScope === 'all'
                      ? 'bg-card text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All ({categories.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterScope('kitchen')}
                  className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    activeFilterScope === 'kitchen'
                      ? 'bg-card text-primary shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ChefHat className="size-3" />
                  Kitchen ({categories.filter((c) => c.scope === 'kitchen' || !c.scope || c.scope === 'both').length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterScope('personal')}
                  className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    activeFilterScope === 'personal'
                      ? 'bg-card text-purple-600 dark:text-purple-400 shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <User className="size-3" />
                  Personal ({categories.filter((c) => c.scope === 'personal' || c.scope === 'both').length})
                </button>
              </div>

              <Button
                type="button"
                onClick={handleStartCreate}
                size="sm"
                className="min-h-[40px] sm:min-h-[36px] gap-1.5 shrink-0"
              >
                <Plus className="size-4" />
                Add Category
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2 min-w-0 w-full">
          {displayedCategories.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
              No categories found in this scope.
            </div>
          ) : (
            displayedCategories.map((cat) => {
              const usageCount = getCategoryUsageCount(cat.id)
              const scopeType = cat.scope || 'kitchen'

              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between gap-2 sm:gap-3 rounded-xl border bg-card p-2.5 sm:p-3 transition-colors hover:bg-muted/40 min-w-0 w-full"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div
                      className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-lg text-white shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.iconName} className="size-4.5 sm:size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-semibold text-xs sm:text-sm truncate max-w-[150px] sm:max-w-xs">{cat.name}</span>
                        {/* Scope Badge */}
                        <span
                          className={`text-[10px] rounded-full px-2 py-0.5 font-semibold shrink-0 ${
                            scopeType === 'personal'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                              : scopeType === 'both'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {scopeType === 'personal' ? 'Personal' : scopeType === 'both' ? 'Both' : 'Kitchen'}
                        </span>
                        <span className="text-[10px] sm:text-[11px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground shrink-0 font-medium">
                          {usageCount} {usageCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-[11px] sm:text-xs text-muted-foreground truncate max-w-full mt-0.5">{cat.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleStartEdit(cat)}
                      className="size-9 sm:size-10 min-h-[36px] min-w-[36px]"
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Edit2 className="size-4 text-muted-foreground hover:text-foreground" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(cat)}
                      className="size-9 sm:size-10 min-h-[36px] min-w-[36px]"
                      aria-label={`Delete ${cat.name}`}
                    >
                      <Trash2 className="size-4 text-destructive hover:text-destructive/80" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
