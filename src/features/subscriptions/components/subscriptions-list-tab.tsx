import { useState } from 'react'
import { Search, Eye, CheckCircle, RefreshCcw, Filter, DollarSign } from 'lucide-react'
import dayjs from 'dayjs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/common/empty-state'
import { CustomerLedgerDialog } from './customer-ledger-dialog'
import { useSubscriptions, useConfirmSubscriptionPayment } from '../hooks/use-subscriptions'
import type { AdminSubscriptionWithDetails } from '../services/subscriptions-service'

export function SubscriptionsListTab() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedSub, setSelectedSub] = useState<AdminSubscriptionWithDetails | null>(null)
  const [ledgerOpen, setLedgerOpen] = useState(false)

  // Payment confirmation dialog
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [paymentSub, setPaymentSub] = useState<AdminSubscriptionWithDetails | null>(null)
  const [paymentNotes, setPaymentNotes] = useState('')

  const { data: subscriptions, isLoading, refetch } = useSubscriptions(statusFilter, search)
  const confirmPaymentMutation = useConfirmSubscriptionPayment()

  const handleOpenLedger = (sub: AdminSubscriptionWithDetails) => {
    setSelectedSub(sub)
    setLedgerOpen(true)
  }

  const handleOpenPayment = (sub: AdminSubscriptionWithDetails) => {
    setPaymentSub(sub)
    setPaymentNotes(`Verified via UPI / Cash on ${dayjs().format('MMM D, YYYY')}`)
    setPayDialogOpen(true)
  }

  const handleConfirmPayment = async () => {
    if (!paymentSub) return
    await confirmPaymentMutation.mutateAsync({
      id: paymentSub.id,
      notes: paymentNotes,
    })
    setPayDialogOpen(false)
    setPaymentSub(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Active</Badge>
      case 'pending_payment':
        return (
          <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300">
            Pending Payment
          </Badge>
        )
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Customer Subscriptions</h2>
          <p className="text-sm text-muted-foreground">
            Manage active meal plans, verify payments, and inspect live customer delivery ledgers.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCcw className="size-4" />
          Refresh
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name, phone, email, or SUB#..."
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="size-4 text-muted-foreground ml-1" />
          {[
            { id: 'all', label: 'All' },
            { id: 'pending_payment', label: 'Pending Payment' },
            { id: 'active', label: 'Active' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted/60 rounded-lg" />
              ))}
            </div>
          ) : !subscriptions || subscriptions.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No subscriptions found"
                description={
                  search || statusFilter !== 'all'
                    ? 'No subscriptions match your search and filter criteria.'
                    : 'Customer subscription purchases will appear here.'
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subscription #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Meal Choice</TableHead>
                    <TableHead>Plan Variant</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price Paid</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub: AdminSubscriptionWithDetails) => (
                    <TableRow key={sub.id} className="text-xs hover:bg-muted/30">
                      <TableCell className="font-mono font-semibold text-foreground">
                        {sub.subscription_number}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {sub.profiles?.full_name || 'Guest / Customer'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {sub.profiles?.phone || sub.profiles?.email || '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs font-semibold bg-primary/5 text-primary border-primary/20"
                        >
                          {sub.meal_thalis?.name || (sub.thali_snapshot as any)?.name || 'Regular Thali'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{sub.plan_variants?.name}</span>
                        <span className="text-[11px] text-muted-foreground ml-1.5">
                          ({sub.duration_meal_days} meals)
                        </span>
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground font-medium">
                        {sub.meal_slot}
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell className="font-semibold text-foreground">
                        ₹{sub.final_price_paid}
                        {sub.discount_percentage > 0 && (
                          <span className="text-[10px] text-emerald-600 block">
                            Saved {sub.discount_percentage}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {dayjs(sub.start_date).format('MMM D, YYYY')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {sub.status === 'pending_payment' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleOpenPayment(sub)}
                              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            >
                              <CheckCircle className="size-3.5" />
                              Confirm Pay
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenLedger(sub)}
                            className="text-xs h-8 gap-1"
                          >
                            <Eye className="size-3.5" />
                            Ledger
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Ledger Dialog */}
      <CustomerLedgerDialog
        open={ledgerOpen}
        onOpenChange={setLedgerOpen}
        subscription={selectedSub}
      />

      {/* Confirm Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <DollarSign className="size-5 text-emerald-600" />
              Confirm Subscription Payment
            </DialogTitle>
          </DialogHeader>

          {paymentSub && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg bg-muted/60 p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subscription:</span>
                  <span className="font-semibold">{paymentSub.subscription_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-semibold">{paymentSub.profiles?.full_name}</span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1 text-sm">
                  <span className="font-medium">Total Amount Due:</span>
                  <span className="font-bold text-emerald-700">₹{paymentSub.final_price_paid}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay-notes" className="text-xs">
                  Payment Verification Notes
                </Label>
                <Input
                  id="pay-notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid via UPI ref #12345 or Cash to delivery team"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={confirmPaymentMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {confirmPaymentMutation.isPending ? 'Confirming...' : 'Mark as Paid & Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
