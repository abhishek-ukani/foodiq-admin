import { useState } from 'react'
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePolicies, useUpdatePolicy } from '@/features/content/hooks/use-content'
import type { Tables } from '@/types/database.types'

function PolicyEditor({ policy }: { policy: Tables<'policies'> }) {
  const update = useUpdatePolicy()
  const [title, setTitle] = useState(policy.title)
  const [content, setContent] = useState(policy.content)
  const dirty = title !== policy.title || content !== policy.content

  return (
    <Card className="overflow-hidden border border-border shadow-xs">
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <Badge variant="outline" className="capitalize font-semibold text-xs tracking-wider">
            {policy.slug}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              {policy.is_published ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="size-3.5" /> Published
                </span>
              ) : (
                'Unpublished'
              )}
            </span>
            <Switch
              checked={policy.is_published}
              aria-label={`Toggle published state for ${policy.title}`}
              onCheckedChange={(checked) =>
                update.mutate({ id: policy.id, input: { is_published: checked } })
              }
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Document Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Policy Title"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">Content</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="font-mono text-xs leading-relaxed"
            placeholder="Policy content…"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            disabled={!dirty || update.isPending}
            onClick={() =>
              update.mutate({
                id: policy.id,
                input: { title, content },
              })
            }
          >
            {update.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function PoliciesTab() {
  const { data: policies, isPending } = usePolicies()

  if (isPending) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!policies?.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              Policies are 100% Static Frontend Pages
            </h3>
            <p className="text-xs text-muted-foreground">
              Zero database storage • High performance • Instant loading
            </p>
          </div>
        </div>

        <p className="text-sm text-foreground/80 leading-relaxed">
          The legal pages for FoodIQ are served directly from the static web bundle for maximum speed, security, and offline reliability. There are no policy records stored in the database.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border p-4 bg-muted/30">
            <h4 className="font-semibold text-sm text-foreground mb-1">Privacy Policy</h4>
            <p className="text-xs text-muted-foreground mb-3">
              DPDP Act 2023 compliance, partner disclosures, zero data selling, and user rights.
            </p>
            <span className="text-[11px] font-mono text-primary font-medium">/privacy-policy</span>
          </div>

          <div className="rounded-xl border p-4 bg-muted/30">
            <h4 className="font-semibold text-sm text-foreground mb-1">Terms &amp; Conditions</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Kitchen standards, twice-daily fresh rasoi, order cutoffs (10 AM / 6 PM), and COD rules.
            </p>
            <span className="text-[11px] font-mono text-primary font-medium">/terms</span>
          </div>

          <div className="rounded-xl border p-4 bg-muted/30">
            <h4 className="font-semibold text-sm text-foreground mb-1">Refund &amp; Cancellation</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Cancellation before cooking, packaging replacement within 2 hours, and UPI timeline.
            </p>
            <span className="text-[11px] font-mono text-primary font-medium">/refund-policy</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground rounded-lg border border-dashed p-3 font-mono">
          📁 Code location: foodIQ_web/src/features/static-pages/data/policies-data.ts
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {policies.map((policy) => (
        <PolicyEditor key={policy.id} policy={policy} />
      ))}
    </div>
  )
}
