import { describe, expect, it } from 'vitest'
import { categorySchema, slugify } from './category-schema'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Gujarati Thali')).toBe('gujarati-thali')
  })

  it('strips non-alphanumeric characters', () => {
    expect(slugify("Chef's Special!!")).toBe('chef-s-special')
  })

  it('trims leading/trailing hyphens', () => {
    expect(slugify('  -Sweets-  ')).toBe('sweets')
  })
})

describe('categorySchema', () => {
  const valid = {
    name: 'Gujarati',
    slug: 'gujarati',
    description: '',
    image_url: null,
    display_order: 0,
    is_active: true,
  }

  it('accepts a valid category', () => {
    expect(categorySchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a name shorter than 2 characters', () => {
    expect(categorySchema.safeParse({ ...valid, name: 'G' }).success).toBe(false)
  })

  it('rejects a negative display_order', () => {
    expect(categorySchema.safeParse({ ...valid, display_order: -1 }).success).toBe(false)
  })
})
