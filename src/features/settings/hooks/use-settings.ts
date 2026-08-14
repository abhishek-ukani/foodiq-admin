import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ADMIN_QUERY_KEYS } from '@/constants'
import { fetchSystemConfig, updateSystemConfigKey } from '@/features/settings/services/settings-service'
import type { Json } from '@/types/database.types'

export function useSystemConfig() {
  return useQuery({ queryKey: ADMIN_QUERY_KEYS.systemConfig, queryFn: fetchSystemConfig })
}

/** Reads one config key's value out of the system_config list, typed as T. */
export function useConfigValue<T>(key: string): T | undefined {
  const { data } = useSystemConfig()
  return data?.find((row) => row.key === key)?.value as T | undefined
}

export function useUpdateSystemConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: Json }) => updateSystemConfigKey(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.systemConfig })
      toast.success('Settings saved')
    },
    onError: (error) => toast.error(error.message),
  })
}
