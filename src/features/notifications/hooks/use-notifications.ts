import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  fetchSentNotifications,
  sendBroadcast,
  type BroadcastInput,
} from '@/features/notifications/services/notifications-service'

const KEY = ['admin', 'notifications', 'sent'] as const

export interface SentBroadcast {
  title: string
  body: string | null
  type: string
  audience: string
  createdAt: string
  recipientCount: number
}

export function useSentBroadcasts() {
  const query = useQuery({ queryKey: KEY, queryFn: fetchSentNotifications })

  const broadcasts = useMemo<SentBroadcast[]>(() => {
    if (!query.data) return []
    const groups = new Map<string, SentBroadcast>()
    for (const row of query.data) {
      const key = `${row.created_at}|${row.title}|${row.body ?? ''}`
      const existing = groups.get(key)
      if (existing) {
        existing.recipientCount += 1
      } else {
        groups.set(key, {
          title: row.title,
          body: row.body,
          type: row.type,
          audience: row.audience,
          createdAt: row.created_at,
          recipientCount: 1,
        })
      }
    }
    return Array.from(groups.values())
  }, [query.data])

  return { ...query, broadcasts }
}

export function useSendBroadcast() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BroadcastInput) => sendBroadcast(input),
    onSuccess: (count) => {
      toast.success(`Sent to ${count} recipient${count === 1 ? '' : 's'}`)
      queryClient.invalidateQueries({ queryKey: KEY })
    },
    onError: (error) => toast.error(error.message),
  })
}
