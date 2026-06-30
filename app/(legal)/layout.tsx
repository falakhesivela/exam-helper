import Link from "next/link"
import { Logo } from "@/components/layout/logo"
import { LEGAL_LINKS } from "./legal-config"

/** Shared shell for the public legal pages (Terms, Privacy, Refund). */
export default function LegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-4">
          <Link href="/login" aria-label="Back to Prepa">
            <Logo />
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-6 text-sm text-muted-foreground">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
