import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BusinessProfileForm } from '@/features/settings/components/business-profile-form'
import { OrderSettingsForm } from '@/features/settings/components/order-settings-form'
import { PaymentSettingsForm } from '@/features/settings/components/payment-settings-form'
import { SocialSeoForm } from '@/features/settings/components/social-seo-form'
import { BrandingForm } from '@/features/settings/components/branding-form'
import { MaintenanceForm } from '@/features/settings/components/maintenance-form'
import { DeliveryAreasTab } from '@/features/settings/components/delivery-areas-tab'
import { HolidaysTab } from '@/features/settings/components/holidays-tab'

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'business'

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val }, { replace: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">Business details, delivery rules, and site content.</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="social-seo">Social & SEO</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="holidays">Holidays &amp; Closures</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-6">
          <BusinessProfileForm />
        </TabsContent>
        <TabsContent value="orders" className="mt-6">
          <OrderSettingsForm />
        </TabsContent>
        <TabsContent value="payments" className="mt-6">
          <PaymentSettingsForm />
        </TabsContent>
        <TabsContent value="delivery" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery &amp; Pricing Management</CardTitle>
              <CardDescription>
                Configure Zone A &amp; Zone B pincodes, dynamic distance pricing rules, and serviceability.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeliveryAreasTab />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="social-seo" className="mt-6">
          <SocialSeoForm />
        </TabsContent>
        <TabsContent value="branding" className="mt-6">
          <BrandingForm />
        </TabsContent>
        <TabsContent value="holidays" className="mt-6">
          <HolidaysTab />
        </TabsContent>
        <TabsContent value="maintenance" className="mt-6">
          <MaintenanceForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
