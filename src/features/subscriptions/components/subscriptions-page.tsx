import { useSearchParams } from 'react-router-dom'
import {
  CalendarCheck,
  ChefHat,
  Sliders,
  Settings2,
  MessageSquare,
  History,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SubscriptionsListTab } from './subscriptions-list-tab'
import { TomorrowPrepTab } from './tomorrow-prep-tab'
import { PlanVariantsTab } from './plan-variants-tab'
import { GlobalSettingsTab } from './global-settings-tab'
import { PlanEnquiriesTab } from './plan-enquiries-tab'
import { AuditLogsTab } from './audit-logs-tab'

export function SubscriptionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'subscriptions'

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val }, { replace: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Subscriptions Management
        </h1>
        <p className="text-muted-foreground text-sm">
          Customer tiffin subscriptions, daily kitchen prep, plan variants, and operational policies.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex-wrap bg-muted/60 p-1 border">
          <TabsTrigger value="subscriptions" className="gap-1.5 text-xs">
            <CalendarCheck className="size-3.5" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="prep" className="gap-1.5 text-xs">
            <ChefHat className="size-3.5" />
            Tomorrow's Prep
          </TabsTrigger>
          <TabsTrigger value="variants" className="gap-1.5 text-xs">
            <Sliders className="size-3.5" />
            Plan Variants
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs">
            <Settings2 className="size-3.5" />
            Global Settings
          </TabsTrigger>
          <TabsTrigger value="enquiries" className="gap-1.5 text-xs">
            <MessageSquare className="size-3.5" />
            Enquiries
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5 text-xs">
            <History className="size-3.5" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="mt-6">
          <SubscriptionsListTab />
        </TabsContent>
        <TabsContent value="prep" className="mt-6">
          <TomorrowPrepTab />
        </TabsContent>
        <TabsContent value="variants" className="mt-6">
          <PlanVariantsTab />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <GlobalSettingsTab />
        </TabsContent>
        <TabsContent value="enquiries" className="mt-6">
          <PlanEnquiriesTab />
        </TabsContent>
        <TabsContent value="audit" className="mt-6">
          <AuditLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
