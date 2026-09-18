import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  addItemToMenu,
  autoPopulateDailyMenuWithActiveItems,
  copyPreviousMenu,
  ensureDailyMenu,
  fetchMenuItems,
  removeItemFromMenu,
  setMenuPublished,
  toggleMenuItemAvailable,
  toggleMenuItemSpecial,
  toggleMenuItemStandalone,
  toggleMenuItemThaliOption,
  updateMenuCutoffTime,
  updateMenuItemInventory,
} from '@/features/menu/services/daily-menu-service'
import { broadcastCatalogUpdate } from '@/lib/realtime-sync'
import type { MealType } from '@/types/database.types'

function menuKey(date: string, meal: MealType) {
  return ['admin', 'daily-menu', date, meal] as const
}

export function useDailyMenu(date: string, meal: MealType) {
  return useQuery({
    queryKey: menuKey(date, meal),
    queryFn: () => ensureDailyMenu(date, meal),
  })
}

export function useMenuItems(dailyMenuId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'daily-menu-items', dailyMenuId],
    queryFn: () => fetchMenuItems(dailyMenuId!),
    enabled: Boolean(dailyMenuId),
  })
}

function useInvalidateMenuItems(dailyMenuId: string | undefined) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'daily-menu-items', dailyMenuId] })
    broadcastCatalogUpdate('daily_menu_items_updated')
  }
}

export function useCopyPreviousMenu(dailyMenuId: string | undefined) {
  const invalidate = useInvalidateMenuItems(dailyMenuId)
  return useMutation({
    mutationFn: ({ sourceDate, meal }: { sourceDate: string; meal: MealType }) =>
      copyPreviousMenu(sourceDate, dailyMenuId!, meal),
    onSuccess: (count) => {
      invalidate()
      toast.success(count > 0 ? `Copied ${count} items from previous menu!` : 'All items were already on today\'s menu.')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useTogglePublish(date: string, meal: MealType) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_published }: { id: string; is_published: boolean }) =>
      setMenuPublished(id, is_published),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: menuKey(date, meal) })
      broadcastCatalogUpdate('daily_menu_publish_toggled')
      toast.success(variables.is_published ? 'Menu published' : 'Menu unpublished')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateMenuCutoff(date: string, meal: MealType) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cutoff_time }: { id: string; cutoff_time: string | null }) =>
      updateMenuCutoffTime(id, cutoff_time),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKey(date, meal) })
      broadcastCatalogUpdate('daily_menu_cutoff_updated')
      toast.success('Order cutoff time updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useAddMenuItem(dailyMenuId: string | undefined) {
  const invalidate = useInvalidateMenuItems(dailyMenuId)
  return useMutation({
    mutationFn: ({
      foodItemId,
      options,
    }: {
      foodItemId: string
      options?: { is_standalone_sale?: boolean; is_thali_option?: boolean }
    }) => addItemToMenu(dailyMenuId!, foodItemId, options),
    onSuccess: () => {
      invalidate()
      toast.success('Item added to menu')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useRemoveMenuItem(dailyMenuId: string | undefined) {
  const invalidate = useInvalidateMenuItems(dailyMenuId)
  return useMutation({
    mutationFn: (id: string) => removeItemFromMenu(id),
    onSuccess: () => {
      invalidate()
      toast.success('Item removed from menu')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useToggleMenuItemSpecial(dailyMenuId: string | undefined) {
  const invalidate = useInvalidateMenuItems(dailyMenuId)
  return useMutation({
    mutationFn: ({ id, is_special }: { id: string; is_special: boolean }) =>
      toggleMenuItemSpecial(id, is_special),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  })
}

export function useToggleMenuItemAvailable(dailyMenuId: string | undefined) {
  const invalidate = useInvalidateMenuItems(dailyMenuId)
  return useMutation({
    mutationFn: ({ id, is_available }: { id: string; is_available: boolean }) =>
      toggleMenuItemAvailable(id, is_available),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  })
}

export function useToggleMenuItemStandalone(dailyMenuId: string | undefined) {
  const invalidate = useInvalidateMenuItems(dailyMenuId)
  return useMutation({
    mutationFn: ({ id, is_standalone_sale }: { id: string; is_standalone_sale: boolean }) =>
      toggleMenuItemStandalone(id, is_standalone_sale),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  })
}

export function useToggleMenuItemThaliOption(dailyMenuId: string | undefined) {
  const invalidate = useInvalidateMenuItems(dailyMenuId)
  return useMutation({
    mutationFn: ({ id, is_thali_option }: { id: string; is_thali_option: boolean }) =>
      toggleMenuItemThaliOption(id, is_thali_option),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  })
}

export function useAutoPopulateMenu(dailyMenuId: string | undefined) {
  const invalidate = useInvalidateMenuItems(dailyMenuId)
  return useMutation({
    mutationFn: () => autoPopulateDailyMenuWithActiveItems(dailyMenuId!),
    onSuccess: (count) => {
      invalidate()
      toast.success(count > 0 ? `Auto-populated ${count} Thali packages!` : 'Thali packages are already in the daily menu.')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateMenuItemInventory(dailyMenuId: string | undefined) {
  const invalidate = useInvalidateMenuItems(dailyMenuId)
  return useMutation({
    mutationFn: ({
      id,
      available_quantity,
      cutoff_time,
    }: {
      id: string
      available_quantity: number | null
      cutoff_time: string | null
    }) => updateMenuItemInventory(id, { available_quantity, cutoff_time }),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  })
}
