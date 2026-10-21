import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  fetchHolidaySettings,
  saveHolidaySettings,
} from '@/features/settings/services/holidays-service'
import type { HolidaySettings } from '@/features/settings/schemas/settings-schemas'

export const HOLIDAY_QUERY_KEY = ['kitchen-holidays']

export function useHolidaySettings() {
  return useQuery({
    queryKey: HOLIDAY_QUERY_KEY,
    queryFn: fetchHolidaySettings,
    staleTime: 10_000,
  })
}

export function useSaveHolidaySettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: HolidaySettings) => saveHolidaySettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOLIDAY_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      toast.success('Holiday updates saved')
    },
    onError: (error) => toast.error(error.message || 'Failed to save holiday updates'),
  })
}
