import { z } from 'zod'
import { slugify } from '@/features/menu/schemas/category-schema'

export const foodItemSchema = z
  .object({
    category_id: z.string().nullable(),
    name: z.string().trim().min(2, 'Enter an item name'),
    name_gujarati: z.string().trim().optional().or(z.literal('')),
    slug: z.string().trim().min(2, 'Enter a URL slug'),
    description: z.string().trim().optional().or(z.literal('')),
    food_type: z.enum(['veg', 'jain', 'vegan', 'egg', 'non_veg']),
    price: z.number().min(0, 'Price must be 0 or more'),
    offer_price: z.number().nullable(),
    image_url: z.string().nullable(),
    is_available: z.boolean(),
    is_featured: z.boolean(),
    is_swaminarayan_available: z.boolean().default(false),
    is_vaishnav_available: z.boolean().default(false),
    is_jain_available: z.boolean().default(false),
    track_stock: z.boolean(),
    stock_quantity: z.number().int().min(0),
  })
  .refine((data) => data.offer_price === null || data.offer_price <= data.price, {
    message: 'Offer price must be less than or equal to the regular price',
    path: ['offer_price'],
  })
export type FoodItemInput = z.infer<typeof foodItemSchema>

export { slugify }
