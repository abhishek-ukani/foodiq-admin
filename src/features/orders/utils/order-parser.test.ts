import { describe, it, expect } from 'vitest'
import {
  calculateKitchenProduction,
  parseOrderItemDetails,
  getBreadPiecesPerServing,
  detectMealVariant,
} from './order-parser'
import type { AdminOrder } from '@/features/orders/services/orders-service'

describe('order-parser: Kitchen Production & Order Accuracy', () => {
  it('correctly resolves bread pieces per serving', () => {
    expect(getBreadPiecesPerServing('rotli')).toBe(5)
    expect(getBreadPiecesPerServing('bhakhri')).toBe(2)
    expect(getBreadPiecesPerServing('thepla')).toBe(4)
    expect(getBreadPiecesPerServing('puri')).toBe(5)
    expect(getBreadPiecesPerServing('rotla')).toBe(2)

    // With explicit text
    expect(getBreadPiecesPerServing('rotli', '5 Roti / 2 Bhakhri')).toBe(5)
    expect(getBreadPiecesPerServing('bhakhri', '5 Roti / 2 Bhakhri')).toBe(2)
    expect(getBreadPiecesPerServing('rotli', 'Rotli (5 pcs)')).toBe(5)
    expect(getBreadPiecesPerServing('bhakhri', 'Bhakhri (2 pcs)')).toBe(2)
  })

  it('correctly detects meal variants including Deluxe', () => {
    expect(detectMealVariant({ item_name: 'Regular Thali' } as any)).toBe('Regular')
    expect(detectMealVariant({ item_name: 'Classic Thali' } as any)).toBe('Classic')
    expect(detectMealVariant({ item_name: 'Premium Thali' } as any)).toBe('Premium')
    expect(detectMealVariant({ item_name: 'Deluxe Thali' } as any)).toBe('Deluxe')
  })

  it('calculates 5 rotlis per thali for standard orders (replicating the user screenshot)', () => {
    const mockOrders: AdminOrder[] = [
      {
        id: 'ord-1',
        order_number: 'FIQ-THL-L261015-1001',
        status: 'accepted',
        meal_type: 'lunch',
        delivery_date: '2026-10-15',
        subtotal: 80,
        total_amount: 80,
        contact_name: 'Customer 1',
        order_items: [
          {
            id: 'item-1',
            order_id: 'ord-1',
            item_name: 'Regular Thali',
            item_kind: 'thali',
            unit_price: 80,
            quantity: 1,
            line_total: 80,
            item_snapshot: null,
            customizations: [
              { group_name: 'Bread Choice', option_name: 'Rotli', price_delta: 0 },
              { group_name: 'Sabji Choice', option_name: 'Sev-tameta', price_delta: 0 },
            ],
          } as any,
        ],
      } as any,
      {
        id: 'ord-2',
        order_number: 'FIQ-THL-L261015-1002',
        status: 'accepted',
        meal_type: 'lunch',
        delivery_date: '2026-10-15',
        subtotal: 80,
        total_amount: 80,
        contact_name: 'Customer 2',
        order_items: [
          {
            id: 'item-2',
            order_id: 'ord-2',
            item_name: 'Regular Thali',
            item_kind: 'thali',
            unit_price: 80,
            quantity: 1,
            line_total: 80,
            item_snapshot: null,
            customizations: [
              { group_name: 'Bread Choice', option_name: 'Rotli', price_delta: 0 },
              { group_name: 'Sabji Choice', option_name: 'Sev-tameta', price_delta: 0 },
            ],
          } as any,
        ],
      } as any,
      {
        id: 'ord-3',
        order_number: 'FIQ-THL-L261015-1003',
        status: 'accepted',
        meal_type: 'lunch',
        delivery_date: '2026-10-15',
        subtotal: 110,
        total_amount: 110,
        contact_name: 'Customer 3',
        order_items: [
          {
            id: 'item-3',
            order_id: 'ord-3',
            item_name: 'Classic Thali',
            item_kind: 'thali',
            unit_price: 110,
            quantity: 1,
            line_total: 110,
            item_snapshot: [
              { name: 'Gujarati Dal', category: 'rice_dal', quantity: 1 },
              { name: 'Steamed Rice', category: 'rice_dal', quantity: 1 },
            ],
            customizations: [
              { group_name: 'Bread Choice', option_name: 'Rotli', price_delta: 0 },
              { group_name: 'Sabji Choice', option_name: 'Sev-tameta', price_delta: 0 },
            ],
          } as any,
        ],
      } as any,
      {
        id: 'ord-4',
        order_number: 'FIQ-THL-L261015-1004',
        status: 'accepted',
        meal_type: 'lunch',
        delivery_date: '2026-10-15',
        subtotal: 110,
        total_amount: 110,
        contact_name: 'Customer 4',
        order_items: [
          {
            id: 'item-4',
            order_id: 'ord-4',
            item_name: 'Classic Thali',
            item_kind: 'thali',
            unit_price: 110,
            quantity: 1,
            line_total: 110,
            item_snapshot: [
              { name: 'Gujarati Dal', category: 'rice_dal', quantity: 1 },
              { name: 'Steamed Rice', category: 'rice_dal', quantity: 1 },
            ],
            customizations: [
              { group_name: 'Bread Choice', option_name: 'Rotli', price_delta: 0 },
              { group_name: 'Sabji Choice', option_name: 'dudhi-dal', price_delta: 0 },
            ],
          } as any,
        ],
      } as any,
    ]

    const production = calculateKitchenProduction(mockOrders)

    // Meals check
    expect(production.totalOrders).toBe(4)
    expect(production.totalMeals).toBe(4)
    expect(production.totalRegularThalis).toBe(2)
    expect(production.totalClassicThalis).toBe(2)
    expect(production.totalPremiumThalis).toBe(0)

    // Rotli check: 4 thalis * 5 rotlis = 20 Rotlis (NOT 4!)
    expect(production.breads.rotli.base).toBe(20)
    expect(production.breads.rotli.addOn).toBe(0)
    expect(production.breads.rotli.total).toBe(20)
    expect(production.breads.totalAllBreads).toBe(20)

    // Sabjis check: 3 Sev-tameta, 1 dudhi-dal = 4 bowls
    expect(production.totalSabjiPortions).toBe(4)
    expect(production.sabjis['sev-tameta']?.totalPortions).toBe(3)
    expect(production.sabjis['dudhi-dal']?.totalPortions).toBe(1)

    // Dal / Rice check: ONLY the 2 Classic Thalis with Dal & Rice components have Dal & Rice
    expect(production.mealsWithDalRice).toBe(2)
    expect(production.dalKadhiRice['gujarati dal']?.portions).toBe(2)
    expect(production.dalKadhiRice['steamed rice']?.portions).toBe(2)

    // Salads check: No salads in mock orders -> 0 portions (no static fallback!)
    expect(production.salads.totalPortions).toBe(0)
    expect(Object.keys(production.salads.items).length).toBe(0)

    // Packaging: 4 5-CP trays
    expect(production.packaging.regular5CpTrays).toBe(4)
    expect(production.packaging.premium8CpTrays).toBe(0)
    expect(production.packaging.totalPackages).toBe(4)
  })

  it('handles Bhakhri choice, add-ons, and standalone breads correctly', () => {
    const mockOrder: AdminOrder = {
      id: 'ord-combo',
      order_number: 'FIQ-THL-L261015-9999',
      status: 'accepted',
      meal_type: 'lunch',
      delivery_date: '2026-10-15',
      subtotal: 250,
      total_amount: 250,
      contact_name: 'Bhakta',
      order_items: [
        // 1 meal with Bhakhri (2 pcs) and Extra Rotli (2 pcs)
        {
          id: 'item-combo-1',
          order_id: 'ord-combo',
          item_name: 'Regular Thali',
          item_kind: 'thali',
          unit_price: 80,
          quantity: 1,
          line_total: 100,
          item_snapshot: null,
          customizations: [
            { group_name: 'Bread Choice', option_name: 'Bhakhri', price_delta: 0 },
            { group_name: 'Sabji Choice', option_name: 'Sev-tameta', price_delta: 0 },
            { group_name: 'Add-on', option_name: 'Extra Rotli (2 pcs)', price_delta: 20 },
          ],
        } as any,
        // Standalone a la carte Rotli (5 pcs)
        {
          id: 'item-combo-2',
          order_id: 'ord-combo',
          item_name: 'Rotli (5 pcs)',
          item_kind: 'single',
          unit_price: 50,
          quantity: 1,
          line_total: 50,
          item_snapshot: null,
          customizations: [],
        } as any,
      ],
    } as any

    const production = calculateKitchenProduction([mockOrder])

    // Bhakhri base = 2 pcs
    expect(production.breads.bhakhri.base).toBe(2)
    expect(production.breads.bhakhri.total).toBe(2)

    // Rotli: 0 base (since meal chose Bhakhri), +2 addon (from thali addon) + 5 (standalone) = 7
    expect(production.breads.rotli.base).toBe(0)
    expect(production.breads.rotli.addOn).toBe(7)
    expect(production.breads.rotli.total).toBe(7)

    // Total breads = 2 + 7 = 9 pcs
    expect(production.breads.totalAllBreads).toBe(9)
  })

  it('correctly parses and counts both sabjis (Sev-tameta + Dudhi-dal) for Premium and Deluxe thalis', () => {
    const mockOrder: AdminOrder = {
      id: 'ord-deluxe-1',
      order_number: 'FIQ-THL-L261015-8888',
      status: 'accepted',
      meal_type: 'lunch',
      delivery_date: '2026-10-15',
      subtotal: 150,
      total_amount: 150,
      contact_name: 'Harshil',
      order_items: [
        {
          id: 'item-deluxe-1',
          order_id: 'ord-deluxe-1',
          item_name: 'Deluxe Gujarati Thali',
          item_kind: 'thali',
          unit_price: 150,
          quantity: 1,
          line_total: 150,
          item_snapshot: null,
          customizations: [
            { group_name: 'Bread Choice', name: 'Rotli', price_delta: 0 },
            { group_name: 'Sabji Choice', name: 'Sev-tameta', price_delta: 0 },
            { group_name: 'Sabji Choice', name: 'dudhi-dal', price_delta: 0 },
          ],
        } as any,
      ],
    } as any

    const parsed = parseOrderItemDetails(mockOrder.order_items[0])
    expect(parsed.variantName).toBe('Deluxe')
    expect(parsed.baseBreadCount).toBe(5) // 5 rotlis
    
    // Both sabjis should be recognized as components of type 'sabji'
    const sabjiComps = parsed.components.filter((c) => c.categoryType === 'sabji')
    expect(sabjiComps.length).toBe(2)
    expect(sabjiComps.map((c) => c.name.toLowerCase())).toContain('sev-tameta')
    expect(sabjiComps.map((c) => c.name.toLowerCase())).toContain('dudhi-dal')

    const production = calculateKitchenProduction([mockOrder])
    expect(production.totalMeals).toBe(1)
    expect(production.totalDeluxeThalis).toBe(1)
    expect(production.totalSabjiPortions).toBe(2)
    expect(production.sabjis['sev-tameta']?.totalPortions).toBe(1)
    expect(production.sabjis['dudhi-dal']?.totalPortions).toBe(1)
    expect(production.packaging.premium8CpTrays).toBe(1)
  })

  it('guarantees ZERO static or synthetic fallback data when items are omitted', () => {
    // An order with an a-la-carte snack only
    const snackOnlyOrder: AdminOrder = {
      id: 'ord-snack-only',
      order_number: 'FIQ-SNK-001',
      status: 'accepted',
      meal_type: 'lunch',
      delivery_date: '2026-10-15',
      subtotal: 50,
      total_amount: 50,
      contact_name: 'Snack Fan',
      order_items: [
        {
          id: 'item-snk-1',
          order_id: 'ord-snack-only',
          item_name: 'Khaman (250g)',
          item_kind: 'single',
          unit_price: 50,
          quantity: 2,
          line_total: 100,
          item_snapshot: null,
          customizations: [],
        } as any,
      ],
    } as any

    const production = calculateKitchenProduction([snackOnlyOrder])

    // Strictly 0 meals, 0 breads, 0 sabjis, 0 dal/rice, 0 salads
    expect(production.totalMeals).toBe(0)
    expect(production.breads.totalAllBreads).toBe(0)
    expect(production.totalSabjiPortions).toBe(0)
    expect(Object.keys(production.sabjis).length).toBe(0)
    expect(production.mealsWithDalRice).toBe(0)
    expect(Object.keys(production.dalKadhiRice).length).toBe(0)
    expect(production.salads.totalPortions).toBe(0)
    expect(Object.keys(production.salads.items).length).toBe(0)

    // Snacks count strictly matches 2 portions of Khaman
    expect(production.snacksFarsan['khaman (250g)']?.count).toBe(2)
  })

  it('correctly attributes Bhakhari when user selects Bhakhari (not Rotli)', () => {
    // Order replicating user screenshot: Classic Thali with Bhakhari (spelled Bhakhari)
    const userOrder: AdminOrder = {
      id: 'ord-user-bhakhari',
      order_number: 'FIQ-THL-L261023-2796',
      status: 'accepted',
      meal_type: 'lunch',
      delivery_date: '2026-10-23',
      subtotal: 125,
      total_amount: 125,
      contact_name: 'Admin',
      order_items: [
        {
          id: 'item-user-1',
          order_id: 'ord-user-bhakhari',
          item_name: 'Classic Thali',
          item_kind: 'thali',
          unit_price: 125,
          quantity: 1,
          line_total: 125,
          item_snapshot: [
            { name: 'Dal-Bhat', category: 'rice_dal', quantity: 1 },
            { name: 'Bhakhari', category: 'bread', quantity: 1 },
            { name: 'Bhinda Masala', category: 'sabji', quantity: 1 },
            { name: 'Aachar (Pickle)', category: 'salad_pickle', quantity: 1 },
            { name: 'Mamra no Chewdo', category: 'farsan', quantity: 1 },
          ],
          customizations: [
            { group_name: 'Bread Choice', option_name: 'Bhakhari', price_delta: 0 },
            { group_name: 'Sabji Choice', option_name: 'Bhinda Masala', price_delta: 0 },
          ],
        } as any,
      ],
    } as any

    const parsed = parseOrderItemDetails(userOrder.order_items[0])
    expect(parsed.breadType).toBe('bhakhri')
    expect(parsed.baseBreadCount).toBe(2) // 2 pcs Bhakhari, NOT 5!

    const production = calculateKitchenProduction([userOrder])

    // Rotli must be 0!
    expect(production.breads.rotli.base).toBe(0)
    expect(production.breads.rotli.total).toBe(0)

    // Bhakhri must be 2
    expect(production.breads.bhakhri.base).toBe(2)
    expect(production.breads.bhakhri.total).toBe(2)

    // Direct food items mapping in production.foodItems
    const bhakhariItem = Object.values(production.foodItems).find(
      (item) => item.name.toLowerCase().includes('bhakh')
    )
    expect(bhakhariItem).toBeDefined()
    expect(bhakhariItem?.totalCount).toBe(2)
    expect(bhakhariItem?.baseCount).toBe(2)
    expect(bhakhariItem?.unit).toBe('pcs')

    // Unordered items must NOT exist in production.foodItems
    expect(production.foodItems['sev-tameta']).toBeUndefined()
    expect(production.foodItems['chhash']).toBeUndefined()
    expect(production.foodItems['mahaprashad']).toBeUndefined()
  })
})
