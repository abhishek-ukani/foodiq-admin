export interface DeliverySettings {
  zone_a_pincodes: string[]
  zone_b_pincodes: string[]
  zone_b_enabled: boolean
  free_delivery_radius_km: number
  base_delivery_fee: number
  per_km_fee: number
  max_delivery_distance_km: number
  party_order_phone?: string
}
