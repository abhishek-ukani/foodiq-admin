import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { KeyRound, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/layouts/auth-layout'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/common/password-input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { resetPasswordSchema, type ResetPasswordInput } from '@/features/auth/schemas/auth-schemas'
import { updatePassword, toFriendlyAuthMessage } from '@/features/auth/services/auth-service'
import { supabase } from '@/lib/supabase'
import { ADMIN_ROUTES } from '@/constants'
import { PageLoader } from '@/components/common/page-loader'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasRecoverySession(Boolean(session))
    })
  }, [])

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async (values: ResetPasswordInput) => {
    try {
      await updatePassword(values.password)
      toast.success('Password updated. Please sign in again.')
      await supabase.auth.signOut()
      navigate(ADMIN_ROUTES.login, { replace: true })
    } catch (error) {
      toast.error(toFriendlyAuthMessage(error))
    }
  }

  if (hasRecoverySession === null) {
    return <PageLoader />
  }

  if (!hasRecoverySession) {
    return (
      <AuthLayout title="Link expired" description="This password reset link is no longer valid.">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-7" aria-hidden />
          </div>
          <p className="text-sm text-muted-foreground">
            Reset links expire after a short time. Request a new one to continue.
          </p>
          <Button asChild className="w-full">
            <Link to={ADMIN_ROUTES.forgotPassword}>Request a new link</Link>
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Set a new password" description="Choose a strong password for your account.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder="Re-enter your new password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
            <KeyRound className="size-4" aria-hidden />
            {form.formState.isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
