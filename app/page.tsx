import { redirect } from "next/navigation"

// The app is usable anonymously (middleware mints an anonymous session), so the
// root goes straight into the dashboard — no login wall. Visitors can sign up
// to keep their progress, or upgrade to Pro from inside the app.
export default function Home() {
  redirect("/dashboard")
}
