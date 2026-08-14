import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { PageLoader } from '@/components/common/page-loader'
import { ProtectedRoute } from '@/components/common/protected-route'
import { GuestRoute } from '@/components/common/guest-route'
import { NotFoundPage } from '@/components/common/not-found-page'
import { AdminLayout } from '@/layouts/admin-layout'
import { ADMIN_ROUTES } from '@/constants'

const DashboardPage = lazy(() =>
  import('@/features/dashboard/components/dashboard-page').then((m) => ({
    default: m.DashboardPage,
  })),
)
const CategoriesPage = lazy(() =>
  import('@/features/menu/components/categories-page').then((m) => ({ default: m.CategoriesPage })),
)
const FoodItemsPage = lazy(() =>
  import('@/features/food-items/components/food-items-page').then((m) => ({
    default: m.FoodItemsPage,
  })),
)
const DailyMenuPage = lazy(() =>
  import('@/features/menu/components/daily-menu-page').then((m) => ({ default: m.DailyMenuPage })),
)
const ThaliCustomizationPage = lazy(() =>
  import('@/features/thalis/components/thali-customization-page').then((m) => ({
    default: m.ThaliCustomizationPage,
  })),
)
const OrdersPage = lazy(() =>
  import('@/features/orders/components/orders-page').then((m) => ({ default: m.OrdersPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/settings/components/settings-page').then((m) => ({ default: m.SettingsPage })),
)
const CustomersPage = lazy(() =>
  import('@/features/customers/components/customers-page').then((m) => ({ default: m.CustomersPage })),
)
const CustomerDetailPage = lazy(() =>
  import('@/features/customers/components/customer-detail-page').then((m) => ({
    default: m.CustomerDetailPage,
  })),
)
const ContentPage = lazy(() =>
  import('@/features/content/components/content-page').then((m) => ({ default: m.ContentPage })),
)
const ReportsPage = lazy(() =>
  import('@/features/reports/components/reports-page').then((m) => ({ default: m.ReportsPage })),
)
const NotificationsPage = lazy(() =>
  import('@/features/notifications/components/notifications-page').then((m) => ({
    default: m.NotificationsPage,
  })),
)
const LoginPage = lazy(() =>
  import('@/features/auth/components/login-page').then((m) => ({ default: m.LoginPage })),
)
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/components/forgot-password-page').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
)
const ResetPasswordPage = lazy(() =>
  import('@/features/auth/components/reset-password-page').then((m) => ({
    default: m.ResetPasswordPage,
  })),
)

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: ADMIN_ROUTES.dashboard, element: withSuspense(<DashboardPage />) },
      { path: ADMIN_ROUTES.categories, element: withSuspense(<CategoriesPage />) },
      { path: ADMIN_ROUTES.foodItems, element: withSuspense(<FoodItemsPage />) },
      { path: ADMIN_ROUTES.dailyMenu, element: withSuspense(<DailyMenuPage />) },
      { path: ADMIN_ROUTES.thalis, element: withSuspense(<ThaliCustomizationPage />) },
      { path: ADMIN_ROUTES.orders, element: withSuspense(<OrdersPage />) },
      { path: ADMIN_ROUTES.settings, element: withSuspense(<SettingsPage />) },
      { path: ADMIN_ROUTES.customers, element: withSuspense(<CustomersPage />) },
      { path: ADMIN_ROUTES.customerDetail(':id'), element: withSuspense(<CustomerDetailPage />) },
      { path: ADMIN_ROUTES.content, element: withSuspense(<ContentPage />) },
      { path: ADMIN_ROUTES.reports, element: withSuspense(<ReportsPage />) },
      { path: ADMIN_ROUTES.notifications, element: withSuspense(<NotificationsPage />) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: ADMIN_ROUTES.login,
    element: withSuspense(
      <GuestRoute>
        <LoginPage />
      </GuestRoute>,
    ),
  },
  {
    path: ADMIN_ROUTES.forgotPassword,
    element: withSuspense(
      <GuestRoute>
        <ForgotPasswordPage />
      </GuestRoute>,
    ),
  },
  {
    path: ADMIN_ROUTES.resetPassword,
    element: withSuspense(<ResetPasswordPage />),
  },
])
