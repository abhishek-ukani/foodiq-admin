import { z } from 'zod'

export const businessProfileSchema = z.object({
  name: z.string().trim().min(1, 'Business name is required'),
  tagline: z.string().trim().optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  whatsapp: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  city: z.string().trim().optional().or(z.literal('')),
  state: z.string().trim().optional().or(z.literal('')),
  pincode: z.string().trim().optional().or(z.literal('')),
})
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>

export const orderSettingsSchema = z.object({
  default_min_order_amount: z.number().min(0),
  default_delivery_charge: z.number().min(0),
  free_delivery_above: z.number().min(0),
  max_advance_days: z.number().int().min(1).max(30),
  allow_same_day: z.boolean(),
  auto_accept_orders: z.boolean(),
})
export type OrderSettingsInput = z.infer<typeof orderSettingsSchema>

export const paymentSettingsSchema = z.object({
  cash_enabled: z.boolean(),
  upi_enabled: z.boolean(),
  require_upi_reference: z.boolean(),
})
export type PaymentSettingsInput = z.infer<typeof paymentSettingsSchema>

export const socialLinksSchema = z.object({
  instagram: z.string().trim().optional().or(z.literal('')),
  facebook: z.string().trim().optional().or(z.literal('')),
  whatsapp: z.string().trim().optional().or(z.literal('')),
  youtube: z.string().trim().optional().or(z.literal('')),
})
export type SocialLinksInput = z.infer<typeof socialLinksSchema>

export const seoSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional().or(z.literal('')),
  keywords: z.string().trim().optional().or(z.literal('')),
  og_image: z.string().nullable().optional(),
})
export type SeoInput = z.infer<typeof seoSchema>

export const brandingSchema = z.object({
  logo_url: z.string().nullable().optional(),
  favicon_url: z.string().nullable().optional(),
  hero_image_url: z.string().nullable().optional(),
})
export type BrandingInput = z.infer<typeof brandingSchema>

export const maintenanceSchema = z.object({
  enabled: z.boolean(),
  message: z.string().trim().optional().or(z.literal('')),
})
export type MaintenanceInput = z.infer<typeof maintenanceSchema>
