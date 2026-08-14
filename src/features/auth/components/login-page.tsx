import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { LogIn, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/layouts/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/common/password-input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { loginSchema, type LoginInput } from '@/features/auth/schemas/auth-schemas'
import { signInWithEmail, signInWithGoogle, toFriendlyAuthMessage } from '@/features/auth/services/auth-service'
import { useAuth } from '@/hooks/use-auth'
import { ADMIN_ROUTES } from '@/constants'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { rejectedReason, clearRejectedReason } = useAuth()
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false)

  useEffect(() => {
    if (rejectedReason) {
      toast.error(rejectedReason)
      clearRejectedReason()
    }
  }, [rejectedReason, clearRejectedReason])

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginInput) => {
    try {
      await signInWithEmail(values)
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(from ?? ADMIN_ROUTES.dashboard, { replace: true })
    } catch (error) {
      toast.error(toFriendlyAuthMessage(error))
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleSigningIn(true)
      await signInWithGoogle()
    } catch (error) {
      toast.error(toFriendlyAuthMessage(error))
      setIsGoogleSigningIn(false)
    }
  }

  return (
    <AuthLayout title="Sign in" description="Manage menus, orders, and customers.">
      {rejectedReason ? (
        <div className="bg-destructive/10 text-destructive mb-4 flex items-start gap-2 rounded-lg p-3 text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {rejectedReason}
        </div>
      ) : null}

      <div className="space-y-4 mb-4">
        <Button
          type="button"
          variant="outline"
          className="w-full relative flex items-center justify-center gap-2 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          size="lg"
          onClick={handleGoogleSignIn}
          disabled={isGoogleSigningIn || form.formState.isSubmitting}
        >
          <GoogleIcon className="size-5 shrink-0" />
          {isGoogleSigningIn ? 'Redirecting to Google…' : 'Sign in with Google'}
        </Button>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-muted w-full" />
          <span className="bg-background px-3 text-xs text-muted-foreground uppercase font-medium absolute">
            Or sign in with email
          </span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="admin@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    to={ADMIN_ROUTES.forgotPassword}
                    className="text-primary text-xs font-medium hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput autoComplete="current-password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting || isGoogleSigningIn}>
            <LogIn className="size-4" aria-hidden />
            {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
