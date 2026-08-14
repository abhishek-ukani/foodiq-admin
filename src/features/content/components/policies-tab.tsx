import { useState } from 'react'
import { FileText } from 'lucide-react'
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
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="capitalize">
            {policy.slug}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              {policy.is_published ? 'Published' : 'Unpublished'}
            </span>
            <Switch
              checked={policy.is_published}
              onCheckedChange={(checked) =>
                update.mutate({ id: policy.id, input: { is_published: checked } })
              }
            />
          </div>
        </div>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          placeholder="Policy content…"
        />
        <Button
          size="sm"
          disabled={!dirty || update.isPending}
          onClick={() => update.mutate({ id: policy.id, input: { title, content } })}
        >
          {update.isPending ? 'Saving…' : 'Save changes'}
        </Button>
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
      <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center">
        <FileText className="size-8" aria-hidden />
        No policy pages found.
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
