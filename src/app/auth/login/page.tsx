"use client"

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import AuthLayout from '@/components/auth/AuthLayout'
import FormInput from '@/components/ui/FormInput'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      console.log("result",result)

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message === 'CredentialsSignin' ? 'Invalid email or password' : message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Log in to your FindGarden account"
      footer={
        <p className="text-white/50">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="font-medium hover:underline text-white hover:text-white transition-colors">
            Sign Up
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl text-center">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <FormInput
            id="email"
            name="email"
            type="email"
            label="Email address"
            placeholder="name@example.com"
            required
          />
          
          <div>
            <FormInput
              id="password"
              name="password"
              type="password"
              label="Password"
              required
            />
          </div>
          <div className="flex items-center justify-end mb-2">
            <Link href="/auth/forgot-password" className="text-xs text-white/40 hover:text-white transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
