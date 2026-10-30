import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Check, MessageSquareText, Star, Trash2, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/common/empty-state'
import { supabase } from '@/lib/supabase'
import type { ReviewStatus, Tables } from '@/types/database.types'

type ReviewWithDetails = Tables<'reviews'> & {
  food_items: { name: string } | null
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null
}

const KEY = ['admin', 'cms', 'reviews'] as const

function useAdminReviews() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, food_items(name), profiles(full_name, email, phone)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as unknown as ReviewWithDetails[]
    },
  })
}

function useUpdateReviewStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReviewStatus }) => {
      const { error } = await supabase.from('reviews').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: KEY })
      queryClient.invalidateQueries({ queryKey: ['admin', 'food_items'] })
      toast.success(`Review ${vars.status === 'approved' ? 'approved' : 'rejected'}`)
    },
    onError: (error) => toast.error(error.message),
  })
}

function useDeleteReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      queryClient.invalidateQueries({ queryKey: ['admin', 'food_items'] })
      toast.success('Review removed')
    },
    onError: (error) => toast.error(error.message),
  })
}

const STATUS_TONE: Record<ReviewStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300',
}

export function ReviewsTab() {
  const { data: reviews, isPending } = useAdminReviews()
  const updateStatus = useUpdateReviewStatus()
  const deleteReview = useDeleteReview()
  const [filter, setFilter] = useState<'all' | ReviewStatus>('all')

  const counts = useMemo(() => {
    const map = { all: reviews?.length ?? 0, pending: 0, approved: 0, rejected: 0 }
    reviews?.forEach((r) => {
      if (r.status in map) map[r.status]++
    })
    return map
  }, [reviews])

  const filteredReviews = useMemo(() => {
    if (!reviews) return []
    if (filter === 'all') return reviews
    return reviews.filter((r) => r.status === filter)
  }, [reviews, filter])

  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <Tabs value={filter} onValueChange={(val) => setFilter(val as any)} className="w-full">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto h-11 rounded-xl p-1">
            <TabsTrigger value="all" className="rounded-lg text-xs font-semibold gap-1.5 min-h-[36px]">
              All <span className="opacity-70">({counts.all})</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg text-xs font-semibold gap-1.5 min-h-[36px]">
              Pending {counts.pending > 0 && <span className="text-amber-600 font-bold">({counts.pending})</span>}
            </TabsTrigger>
            <TabsTrigger value="approved" className="rounded-lg text-xs font-semibold gap-1.5 min-h-[36px]">
              Approved <span className="opacity-70">({counts.approved})</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg text-xs font-semibold gap-1.5 min-h-[36px]">
              Rejected <span className="opacity-70">({counts.rejected})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {!filteredReviews.length ? (
        <EmptyState
          icon={MessageSquareText}
          title={filter === 'all' ? 'No customer reviews yet' : `No ${filter} reviews`}
          description={
            filter === 'pending'
              ? 'Great news! All submitted reviews have been moderated.'
              : 'Reviews written by customers will appear here.'
          }
          className="border border-dashed py-12 rounded-2xl"
        />
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review) => (
            <Card key={review.id} className="rounded-2xl border transition-all hover:shadow-xs">
              <CardContent className="space-y-3 p-4 sm:p-5">
                {/* Header: Item & Status */}
                <div className="flex flex-wrap items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-base text-foreground leading-snug">
                      {review.food_items?.name ?? 'Unknown item'}
                    </p>

                    {/* Customer Profile & Date */}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <User className="size-3 text-muted-foreground" />
                        {review.profiles?.full_name || 'Anonymous Customer'}
                      </span>
                      {review.profiles?.email && (
                        <span>· {review.profiles.email}</span>
                      )}
                      <span>· {dayjs(review.created_at).format('D MMM YYYY, h:mm A')}</span>
                    </div>

                    {/* Star Rating & Sub-Category Pills */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={
                              i < review.rating
                                ? 'size-4 fill-amber-400 text-amber-500'
                                : 'size-4 text-neutral-200 fill-neutral-100'
                            }
                            aria-hidden
                          />
                        ))}
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-300 ml-1">
                          {review.rating}/5
                        </span>
                      </div>

                      {/* Sub-category breakdowns */}
                      {(review.food_rating || review.packaging_rating || review.delivery_rating) && (
                        <div className="flex flex-wrap items-center gap-1.5 ml-0 sm:ml-2">
                          {review.food_rating && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                              🍲 Food: {review.food_rating}★
                            </span>
                          )}
                          {review.packaging_rating && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-900">
                              📦 Packaging: {review.packaging_rating}★
                            </span>
                          )}
                          {review.delivery_rating && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-900">
                              🚀 Delivery: {review.delivery_rating}★
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <Badge variant="outline" className={`capitalize font-semibold text-xs px-2.5 py-1 rounded-lg ${STATUS_TONE[review.status]}`}>
                    {review.status}
                  </Badge>
                </div>

                {/* Review Comment */}
                {review.comment && (
                  <div className="rounded-xl bg-muted/40 p-3 text-sm border border-border/50">
                    <p className="text-foreground text-xs sm:text-sm leading-relaxed">{review.comment}</p>
                  </div>
                )}


                {/* Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
                  <div className="flex flex-wrap items-center gap-2">
                    {review.status !== 'approved' && (
                      <Button
                        size="sm"
                        className="min-h-[40px] rounded-xl gap-1.5 font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => updateStatus.mutate({ id: review.id, status: 'approved' })}
                        disabled={updateStatus.isPending}
                      >
                        <Check className="size-3.5" />
                        Approve
                      </Button>
                    )}
                    {review.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-[40px] rounded-xl gap-1.5 text-rose-700 hover:text-rose-800 border-rose-200 hover:bg-rose-50 dark:border-rose-900"
                        onClick={() => updateStatus.mutate({ id: review.id, status: 'rejected' })}
                        disabled={updateStatus.isPending}
                      >
                        <X className="size-3.5" />
                        Reject
                      </Button>
                    )}
                    {review.status !== 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="min-h-[40px] text-xs text-muted-foreground rounded-xl"
                        onClick={() => updateStatus.mutate({ id: review.id, status: 'pending' })}
                        disabled={updateStatus.isPending}
                      >
                        Reset to Pending
                      </Button>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="min-h-[40px] text-xs text-destructive hover:bg-destructive/10 rounded-xl gap-1"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this review?')) {
                        deleteReview.mutate(review.id)
                      }
                    }}
                    disabled={deleteReview.isPending}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

