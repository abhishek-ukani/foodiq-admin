import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  createBanner,
  createFaq,
  createTestimonial,
  deleteBanner,
  deleteFaq,
  deleteTestimonial,
  fetchBanners,
  fetchContactMessages,
  fetchFaqs,
  fetchPolicies,
  fetchTestimonials,
  updateBanner,
  updateContactMessageStatus,
  updateFaq,
  updatePolicy,
  updateTestimonial,
} from '@/features/content/services/content-service'
import type { ContactStatus, Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

const KEYS = {
  banners: ['admin', 'cms', 'banners'] as const,
  testimonials: ['admin', 'cms', 'testimonials'] as const,
  faqs: ['admin', 'cms', 'faqs'] as const,
  policies: ['admin', 'cms', 'policies'] as const,
  messages: ['admin', 'cms', 'messages'] as const,
}

function useEntityMutations<TInsert, TUpdate>(
  key: readonly unknown[],
  api: {
    create: (input: TInsert) => Promise<void>
    update: (id: string, input: TUpdate) => Promise<void>
    remove: (id: string) => Promise<void>
  },
  label: string,
) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key })

  const create = useMutation({
    mutationFn: api.create,
    onSuccess: () => {
      invalidate()
      toast.success(`${label} created`)
    },
    onError: (error) => toast.error(error.message),
  })
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: TUpdate }) => api.update(id, input),
    onSuccess: () => {
      invalidate()
      toast.success(`${label} updated`)
    },
    onError: (error) => toast.error(error.message),
  })
  const remove = useMutation({
    mutationFn: api.remove,
    onSuccess: () => {
      invalidate()
      toast.success(`${label} deleted`)
    },
    onError: (error) => toast.error(error.message),
  })

  return { create, update, remove }
}

export function useBanners() {
  return useQuery({ queryKey: KEYS.banners, queryFn: fetchBanners })
}
export function useBannerMutations() {
  return useEntityMutations<TablesInsert<'banners'>, TablesUpdate<'banners'>>(
    KEYS.banners,
    { create: createBanner, update: updateBanner, remove: deleteBanner },
    'Banner',
  )
}

export function useTestimonials() {
  return useQuery({ queryKey: KEYS.testimonials, queryFn: fetchTestimonials })
}
export function useTestimonialMutations() {
  return useEntityMutations<TablesInsert<'testimonials'>, TablesUpdate<'testimonials'>>(
    KEYS.testimonials,
    { create: createTestimonial, update: updateTestimonial, remove: deleteTestimonial },
    'Testimonial',
  )
}

export function useFaqs() {
  return useQuery({ queryKey: KEYS.faqs, queryFn: fetchFaqs })
}
export function useFaqMutations() {
  return useEntityMutations<TablesInsert<'faqs'>, TablesUpdate<'faqs'>>(
    KEYS.faqs,
    { create: createFaq, update: updateFaq, remove: deleteFaq },
    'FAQ',
  )
}

export function usePolicies() {
  return useQuery({ queryKey: KEYS.policies, queryFn: fetchPolicies })
}
export function useUpdatePolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TablesUpdate<'policies'> }) =>
      updatePolicy(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.policies })
      toast.success('Policy saved')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useContactMessages() {
  return useQuery({ queryKey: KEYS.messages, queryFn: fetchContactMessages })
}
export function useUpdateContactMessageStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactStatus }) =>
      updateContactMessageStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.messages }),
    onError: (error) => toast.error(error.message),
  })
}

export type { Tables }
