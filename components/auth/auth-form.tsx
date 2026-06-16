"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Logo } from "@/components/layout/logo"
import { Spinner } from "@/components/ui/spinner"

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isSignup = mode === "signup"

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Mock auth — no real backend in this prototype
    setTimeout(() => router.push("/dashboard"), 700)
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
                <Input id="name" type="text" placeholder="Jordan Lee" autoComplete="name" required />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
              />
              {isSignup && <FieldDescription>Use at least 8 characters.</FieldDescription>}
            </Field>
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
