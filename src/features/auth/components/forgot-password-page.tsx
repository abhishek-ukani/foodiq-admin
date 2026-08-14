import { useState } from 'react'
import { Link } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ArrowLeft, MailCheck, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { AuthLayout } from '@/layouts/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/features/auth/schemas/auth-schemas'
import { sendPasswordResetEmail, toFriendlyAuthMessage } from '@/features/auth/services/auth-service'
import { ADMIN_ROUTES } from '@/constants'

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: ForgotPasswordInput) => {
    try {
      await sendPasswordResetEmail(values.email)
      setSentTo(values.email)
    } catch (error) {
      toast.error(toFriendlyAuthMessage(error))
    }
  }

  if (sentTo) {
    return (
      <AuthLayout title="Check your email" description="We've sent you a password reset link.">
        <div className="space-y-6 text-center">
          <div className="bg-primary/10 text-primary mx-auto flex size-14 items-center justify-center rounded-full">
            <MailCheck className="size-7" aria-hidden />
          </div>
          <p className="text-muted-foreground text-sm">
            If an admin account exists for{' '}
            <span className="text-foreground font-medium">{sentTo}</span>, a reset link is on its
            way.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to={ADMIN_ROUTES.login}>
              <ArrowLeft className="size-4" aria-hidden />
              Back to sign in
            </Link>
          </Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter your admin email and we'll send you a reset link."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="admin@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
            <Send className="size-4" aria-hidden />
            {form.formState.isSubmitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      </Form>

      <Link
        to={ADMIN_ROUTES.login}
        className="text-muted-foreground hover:text-foreground mt-4 flex items-center justify-center gap-1 text-sm"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to sign in
      </Link>
    </AuthLayout>
  )
}
