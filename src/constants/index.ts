import type { OrderStatus } from '@/types/database.types'

export const ADMIN_ROUTES = {
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  dashboard: '/',
  orders: '/orders',
  orderDetail: (id: string) => `/orders/${id}`,
  dailyMenu: '/menu/daily',
  foodItems: '/menu/items',
  foodItemDetail: (id: string) => `/menu/items/${id}`,
  thalis: '/menu/thalis',
  categories: '/menu/categories',
  pricing: '/pricing',
  customers: '/customers',
  customerDetail: (id: string) => `/customers/${id}`,
  reviews: '/reviews',
  reports: '/reports',
  payments: '/payments',
  notifications: '/notifications',
  content: '/content',
  banners: '/cms/banners',
  cms: '/cms/pages',
  faqs: '/cms/faqs',
  contactMessages: '/cms/messages',
  settings: '/settings',
  deliveryAreas: '/settings/delivery-areas',
  deliverySlots: '/settings/delivery-slots',
  auditLogs: '/audit-logs',
} as const

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; description: string; tone: 'neutral' | 'info' | 'success' | 'danger' }
> = {
  pending: {
    label: 'Pending',
    description: 'Waiting for the kitchen to confirm your order.',
    tone: 'neutral',
  },
  accepted: {
    label: 'Accepted',
    description: 'Your order is confirmed.',
    tone: 'info',
  },
  preparing: {
    label: 'Preparing',
    description: 'Your meal is being cooked fresh.',
    tone: 'info',
  },
  ready: {
    label: 'Ready',
    description: 'Packed and waiting for pickup.',
    tone: 'info',
  },
  out_for_delivery: {
    label: 'Out for delivery',
    description: 'On the way to your address.',
    tone: 'info',
  },
  delivered: {
    label: 'Delivered',
    description: 'Enjoy your meal!',
    tone: 'success',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'This order was cancelled.',
    tone: 'danger',
  },
  rejected: {
    label: 'Rejected',
    description: 'The kitchen could not accept this order.',
    tone: 'danger',
  },
}

/** The forward-only path an order travels; used to render progress timelines. */
export const ORDER_TIMELINE: OrderStatus[] = [
  'pending',
  'accepted',
  'ready',
  'out_for_delivery',
  'delivered',
]

/**
 * Which states an admin may move an order into from its current state.
 * Mirrors the constraints enforced by the database guard triggers.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['ready', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
  rejected: [],
}

export const ADMIN_QUERY_KEYS = {
  dashboardSummary: ['admin', 'dashboard-summary'] as const,
  salesSeries: (days: number) => ['admin', 'sales-series', days] as const,
  topSellingItems: (days: number, limit: number) =>
    ['admin', 'top-selling-items', days, limit] as const,
  recentOrders: (limit: number) => ['admin', 'recent-orders', limit] as const,
  retention: (from: string, to: string) => ['admin', 'retention', from, to] as const,
  orders: (filters?: Record<string, unknown>) => ['admin', 'orders', filters ?? {}] as const,
  order: (id: string) => ['admin', 'order', id] as const,
  customers: (filters?: Record<string, unknown>) => ['admin', 'customers', filters ?? {}] as const,
  customer: (id: string) => ['admin', 'customer', id] as const,
  foodItems: (filters?: Record<string, unknown>) => ['admin', 'food-items', filters ?? {}] as const,
  foodItem: (id: string) => ['admin', 'food-item', id] as const,
  categories: ['admin', 'categories'] as const,
  dailyMenu: (date: string) => ['admin', 'daily-menu', date] as const,
  deliveryAreas: ['admin', 'delivery-areas'] as const,
  deliveryZones: ['admin', 'delivery-zones'] as const,
  deliveryFeeRules: ['admin', 'delivery-fee-rules'] as const,
  deliverySlots: ['admin', 'delivery-slots'] as const,
  reviews: (status?: string) => ['admin', 'reviews', status ?? 'all'] as const,
  systemConfig: ['admin', 'system-config'] as const,
  auditLogs: (filters?: Record<string, unknown>) => ['admin', 'audit-logs', filters ?? {}] as const,
  contactMessages: (status?: string) => ['admin', 'contact-messages', status ?? 'all'] as const,
  upiQr: ['admin', 'upi-qr'] as const,
  banners: ['admin', 'banners'] as const,
  thaliOptionGroups: (foodItemId?: string) => ['admin', 'thali-option-groups', foodItemId] as const,
} as const

export const CURRENCY_SYMBOL = '₹'
export const DATE_FORMAT = 'DD MMM YYYY'
export const DATE_TIME_FORMAT = 'DD MMM YYYY, h:mm A'
export const API_DATE_FORMAT = 'YYYY-MM-DD'
