"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Logo } from "@/components/layout/logo"
import { Spinner } from "@/components/ui/spinner"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

function authErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: string }).code)
    if (code === "over_email_send_rate_limit") {
      return "Email rate limit hit. For local dev, disable “Confirm email” in Supabase → Authentication → Providers → Email, or wait ~1 hour and try again."
    }
    if (code === "user_already_registered") {
      return "An account with this email already exists. Try signing in."
    }
  }
  return err instanceof Error ? err.message : "Authentication failed"
}

function goToApp() {
  window.location.assign("/dashboard")
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [loading, setLoading] = useState(false)
  const [passwordMismatch, setPasswordMismatch] = useState(false)
  const isSignup = mode === "signup"

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setPasswordMismatch(false)

    const form = new FormData(e.currentTarget)
    const email = String(form.get("email") ?? "")
    const password = String(form.get("password") ?? "")
    const confirmPassword = String(form.get("confirmPassword") ?? "")
    const name = String(form.get("name") ?? "")

    if (isSignup && password !== confirmPassword) {
      setPasswordMismatch(true)
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        })
        if (error) throw error

        if (data.session) {
          toast.success("Account created — welcome to CertForge!")
          goToApp()
          return
        }

        // No session from sign-up (e.g. confirm email off but empty session) — sign in
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({ email, password })

        if (!signInError && signInData.session) {
          toast.success("Account created — welcome to CertForge!")
          goToApp()
          return
        }

        toast.success(
          "Account created. Check your email to confirm, then sign in.",
        )
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      if (!data.session) {
        throw new Error("Sign-in succeeded but no session was returned.")
      }

      toast.success("Signed in")
      goToApp()
    } catch (err) {
      toast.error(authErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              {isSignup
                ? "Start forging your certification readiness today."
                : "Sign in to continue your study streak."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {isSignup && (
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jordan Lee"
                  autoComplete="name"
                  required
                />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••••"
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                minLength={8}
              />
              {isSignup && (
                <FieldDescription>Use at least 8 characters.</FieldDescription>
              )}
            </Field>
            {isSignup && (
              <Field data-invalid={passwordMismatch}>
                <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  aria-invalid={passwordMismatch}
                />
                {passwordMismatch && (
                  <FieldDescription>Passwords do not match.</FieldDescription>
                )}
              </Field>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Spinner data-icon="inline-start" />}
              {isSignup ? "Create account" : "Sign in"}
            </Button>
          </FieldGroup>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account? " : "New to CertForge? "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {isSignup ? "Sign in" : "Create one"}
          </Link>
        </p>
      </div>
    </div>
  )
}
