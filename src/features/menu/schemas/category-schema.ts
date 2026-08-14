import { z } from 'zod'

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Enter a category name'),
  name_gujarati: z.string().trim().optional().or(z.literal('')),
  slug: z.string().trim().min(2, 'Enter a URL slug'),
  description: z.string().trim().optional().or(z.literal('')),
  image_url: z.string().nullable().optional(),
  display_order: z.number().int().min(0),
  is_active: z.boolean(),
  category_type: z.string().optional().default('general'),
})
export type CategoryInput = z.infer<typeof categorySchema>

export { slugify }
