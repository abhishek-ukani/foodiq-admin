import { z } from 'zod'

export const broadcastSchema = z.object({
  audience: z.enum(['all', 'customers']),
  type: z.enum(['announcement', 'offer', 'maintenance']),
  title: z.string().min(1, 'Title is required').max(120),
  body: z.string().min(1, 'Message is required').max(500),
  actionUrl: z.string().max(300).optional(),
})

export type BroadcastFormInput = z.infer<typeof broadcastSchema>
