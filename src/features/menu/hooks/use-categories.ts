import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ADMIN_QUERY_KEYS } from '@/constants'
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from '@/features/menu/services/categories-service'
import { broadcastCatalogUpdate } from '@/lib/realtime-sync'
import type { TablesInsert, TablesUpdate } from '@/types/database.types'

export function useCategories() {
  return useQuery({ queryKey: ADMIN_QUERY_KEYS.categories, queryFn: fetchCategories })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TablesInsert<'categories'>) => createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.categories })
      broadcastCatalogUpdate('category_created')
      toast.success('Category created')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TablesUpdate<'categories'> }) =>
      updateCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.categories })
      broadcastCatalogUpdate('category_updated')
      toast.success('Category updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.categories })
      broadcastCatalogUpdate('category_deleted')
      toast.success('Category deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}
