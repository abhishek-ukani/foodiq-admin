import { describe, expect, it } from 'vitest'
import { foodItemSchema } from './food-item-schema'

const valid = {
  category_id: null,
  name: 'Gujarati Thali',
  slug: 'gujarati-thali',
  description: '',
  food_type: 'veg' as const,
  price: 150,
  offer_price: null,
  image_url: null,
  is_available: true,
  is_featured: false,
  track_stock: false,
  stock_quantity: 0,
}

describe('foodItemSchema', () => {
  it('accepts a valid item with no offer price', () => {
    expect(foodItemSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts an offer price below the regular price', () => {
    const result = foodItemSchema.safeParse({ ...valid, offer_price: 129 })
    expect(result.success).toBe(true)
  })

  it('rejects an offer price above the regular price, attributed to offer_price', () => {
    const result = foodItemSchema.safeParse({ ...valid, offer_price: 200 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['offer_price'])
  })

  it('rejects a negative price', () => {
    expect(foodItemSchema.safeParse({ ...valid, price: -10 }).success).toBe(false)
  })

  it('rejects an invalid food_type', () => {
    expect(foodItemSchema.safeParse({ ...valid, food_type: 'meat' }).success).toBe(false)
  })
})
