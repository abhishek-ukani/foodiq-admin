import { useState } from 'react'
import { History, ChevronDown, ChevronRight, User, Clock, FileText } from 'lucide-react'
import dayjs from 'dayjs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/empty-state'
import { useSubscriptionAuditLogs } from '../hooks/use-subscriptions'
import type { AuditLogRow } from '@/types/database.types'

export function AuditLogsTab() {
  const { data: logs, isLoading } = useSubscriptionAuditLogs()
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Badge className="bg-emerald-600 text-white text-[10px]">CREATE</Badge>
      case 'UPDATE':
        return <Badge className="bg-blue-600 text-white text-[10px]">UPDATE</Badge>
      case 'DELETE':
        return <Badge variant="destructive" className="text-[10px]">DELETE</Badge>
      default:
        return <Badge variant="outline" className="text-[10px]">{action}</Badge>
    }
  }

  const getEntityLabel = (type: string) => {
    switch (type) {
      case 'plan_variants':
        return 'Plan Variant'
      case 'subscription_settings':
        return 'Global Settings'
      case 'kitchen_closed_dates':
        return 'Kitchen Closed Date'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-display text-xl font-semibold">Subscription Audit Log</h2>
        <p className="text-sm text-muted-foreground">
          Immutable tracking of every admin modification to plan variants, global settings, and kitchen closed dates.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="size-4.5 text-primary" />
            Audit History ({logs?.length ?? 0} events)
          </CardTitle>
          <CardDescription className="text-xs">
            Logged automatically via PostgreSQL triggers with before and after snapshots.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/60 rounded-lg" />
              ))}
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No audit entries recorded"
                description="Modifications to plan variants, settings, or closed dates will be permanently logged here."
              />
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log: AuditLogRow) => {
                const isExpanded = Boolean(expandedIds[log.id])
                const oldVals = log.old_values as Record<string, any> | null
                const newVals = log.new_values as Record<string, any> | null

                return (
                  <div key={log.id} className="p-4 hover:bg-muted/20 transition-colors text-xs">
                    <div
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 cursor-pointer select-none"
                      onClick={() => toggleExpand(log.id)}
                    >
                      <div className="flex items-center gap-2.5">
                        <button type="button" className="text-muted-foreground p-0.5">
                          {isExpanded ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </button>
                        <div className="flex items-center gap-2">
                          {getActionBadge(log.action)}
                          <span className="font-semibold text-foreground text-sm">
                            {getEntityLabel(log.entity_type)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-muted-foreground text-xs pl-6 sm:pl-0">
                        <span className="flex items-center gap-1">
                          <User className="size-3.5 text-primary" />
                          {log.actor_email || 'Admin / System'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {dayjs(log.created_at).format('MMM D, YYYY h:mm A')}
                        </span>
                      </div>
                    </div>

                    {/* Expandable JSON Snapshot View */}
                    {isExpanded && (
                      <div className="mt-3 pl-6 grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                        <div className="space-y-1">
                          <span className="font-medium text-muted-foreground flex items-center gap-1">
                            <FileText className="size-3.5" /> Previous Values (Before)
                          </span>
                          <pre className="rounded bg-muted/60 p-2.5 text-[11px] font-mono overflow-x-auto max-h-48 border">
                            {oldVals ? JSON.stringify(oldVals, null, 2) : '(None - New Record)'}
                          </pre>
                        </div>
                        <div className="space-y-1">
                          <span className="font-medium text-muted-foreground flex items-center gap-1">
                            <FileText className="size-3.5" /> New Values (After)
                          </span>
                          <pre className="rounded bg-muted/60 p-2.5 text-[11px] font-mono overflow-x-auto max-h-48 border">
                            {newVals ? JSON.stringify(newVals, null, 2) : '(None - Deleted)'}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
