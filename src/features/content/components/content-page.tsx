import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BannersTab } from '@/features/content/components/banners-tab'
import { TestimonialsTab } from '@/features/content/components/testimonials-tab'
import { ReviewsTab } from '@/features/content/components/reviews-tab'
import { FaqsTab } from '@/features/content/components/faqs-tab'
import { PoliciesTab } from '@/features/content/components/policies-tab'
import { ContactMessagesTab } from '@/features/content/components/contact-messages-tab'

export function ContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Content</h1>
        <p className="text-muted-foreground text-sm">
          Banners, testimonials, reviews, FAQs, policy pages, and customer messages.
        </p>
      </div>

      <Tabs defaultValue="banners">
        <TabsList className="flex-wrap">
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="mt-6">
          <BannersTab />
        </TabsContent>
        <TabsContent value="testimonials" className="mt-6">
          <TestimonialsTab />
        </TabsContent>
        <TabsContent value="reviews" className="mt-6">
          <ReviewsTab />
        </TabsContent>
        <TabsContent value="faqs" className="mt-6">
          <FaqsTab />
        </TabsContent>
        <TabsContent value="policies" className="mt-6">
          <PoliciesTab />
        </TabsContent>
        <TabsContent value="messages" className="mt-6">
          <ContactMessagesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
