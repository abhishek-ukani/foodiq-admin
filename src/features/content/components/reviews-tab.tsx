import dayjs from 'dayjs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { MessageSquareText, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { supabase } from '@/lib/supabase'
import type { ReviewStatus, Tables } from '@/types/database.types'

type ReviewWithFoodItem = Tables<'reviews'> & { food_items: { name: string } | null }

const KEY = ['admin', 'cms', 'reviews'] as const

function useAdminReviews() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, food_items(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as ReviewWithFoodItem[]
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
    onError: (error) => toast.error(error.message),
  })
}

const STATUS_TONE: Record<ReviewStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-destructive/10 text-destructive',
}

export function ReviewsTab() {
  const { data: reviews, isPending } = useAdminReviews()
  const updateStatus = useUpdateReviewStatus()

  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!reviews?.length) {
    return <EmptyState icon={MessageSquareText} title="No reviews yet" className="border-none py-10" />
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="space-y-2 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{review.food_items?.name ?? 'Unknown item'}</p>
                <div className="mt-1 flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={
                        i < review.rating
                          ? 'size-3.5 fill-current text-amber-500'
                          : 'text-muted size-3.5'
                      }
                      aria-hidden
                    />
                  ))}
                </div>
              </div>
              <Badge className={STATUS_TONE[review.status]}>{review.status}</Badge>
            </div>
            {review.title ? <p className="text-sm font-medium">{review.title}</p> : null}
            {review.comment ? <p className="text-muted-foreground text-sm">{review.comment}</p> : null}
            <p className="text-muted-foreground text-xs">{dayjs(review.created_at).format('D MMM YYYY')}</p>
            {review.status === 'pending' ? (
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => updateStatus.mutate({ id: review.id, status: 'approved' })}
                  disabled={updateStatus.isPending}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateStatus.mutate({ id: review.id, status: 'rejected' })}
                  disabled={updateStatus.isPending}
                >
                  Reject
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
