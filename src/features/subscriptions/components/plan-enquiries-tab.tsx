import { useState } from 'react'
import { Phone, Users, MapPin, Clock } from 'lucide-react'
import dayjs from 'dayjs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/common/empty-state'
import { usePlanEnquiries, useUpdatePlanEnquiryStatus } from '../hooks/use-subscriptions'
import type { PlanEnquiryRow } from '@/types/database.types'

export function PlanEnquiriesTab() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedEnquiry, setSelectedEnquiry] = useState<PlanEnquiryRow | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<'new' | 'in_progress' | 'resolved' | 'closed'>('new')
  const [adminNotes, setAdminNotes] = useState('')

  const { data: enquiries, isLoading } = usePlanEnquiries(statusFilter)
  const updateMutation = useUpdatePlanEnquiryStatus()

  const handleOpenEdit = (enquiry: PlanEnquiryRow) => {
    setSelectedEnquiry(enquiry)
    setNewStatus(enquiry.status)
    setAdminNotes(enquiry.admin_notes || '')
    setDialogOpen(true)
  }

  const handleSaveStatus = async () => {
    if (!selectedEnquiry) return
    await updateMutation.mutateAsync({
      id: selectedEnquiry.id,
      status: newStatus,
      notes: adminNotes,
    })
    setDialogOpen(false)
  }

  const getStatusBadge = (status: PlanEnquiryRow['status']) => {
    switch (status) {
      case 'new':
        return <Badge variant="default" className="bg-blue-600 text-white">New</Badge>
      case 'in_progress':
        return <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300">In Progress</Badge>
      case 'resolved':
        return <Badge className="bg-emerald-600 text-white">Resolved</Badge>
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Custom & Group Plan Enquiries</h2>
          <p className="text-sm text-muted-foreground">
            Leads and requests from customers asking for custom office lunch plans or bulk group orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'new', 'in_progress', 'resolved', 'closed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted/60 rounded-lg" />
              ))}
            </div>
          ) : !enquiries || enquiries.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No enquiries found"
                description={
                  statusFilter !== 'all'
                    ? `No enquiries with status "${statusFilter}".`
                    : 'Customer custom inquiries submitted via the web contact form will appear here.'
                }
              />
            </div>
          ) : (
            <div className="divide-y">
              {enquiries.map((enquiry: PlanEnquiryRow) => {
                const whatsappUrl = `https://wa.me/${enquiry.phone.replace(/[^0-9]/g, '')}`

                return (
                  <div
                    key={enquiry.id}
                    className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-base text-foreground">
                          {enquiry.contact_name || 'Prospect'}
                        </span>
                        {getStatusBadge(enquiry.status)}
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {enquiry.enquiry_type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          • {dayjs(enquiry.created_at).format('MMM D, YYYY h:mm A')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Users className="size-3.5 text-primary" />
                          <span>
                            Headcount: <strong>{enquiry.headcount || 'Not stated'}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-primary" />
                          <span>
                            Days/Week: <strong>{enquiry.days_per_week || 'Flexible'}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-primary" />
                          <span className="truncate">{enquiry.area_or_office}</span>
                        </div>
                      </div>

                      {enquiry.message && (
                        <p className="text-xs text-foreground/80 bg-muted/40 p-2.5 rounded-lg border">
                          "{enquiry.message}"
                        </p>
                      )}

                      {enquiry.admin_notes && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                          Note: {enquiry.admin_notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="text-xs gap-1.5 text-emerald-700 hover:text-emerald-800"
                      >
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                          <Phone className="size-3.5" />
                          WhatsApp
                        </a>
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenEdit(enquiry)}
                        className="text-xs"
                      >
                        Update Status
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Enquiry Status Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Update Enquiry Status</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="status-select">Status</Label>
              <Select value={newStatus} onValueChange={(val: any) => setNewStatus(val)}>
                <SelectTrigger id="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress (Contacted)</SelectItem>
                  <SelectItem value="resolved">Resolved (Quoted / Won)</SelectItem>
                  <SelectItem value="closed">Closed (Lost / Ineligible)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-notes">Internal Admin Notes</Label>
              <Textarea
                id="admin-notes"
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Details of call with customer, custom quote given..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStatus} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
