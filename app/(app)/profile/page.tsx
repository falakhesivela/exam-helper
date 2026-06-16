"use client"

import Link from "next/link"
import {
  Bell,
  ChevronRight,
  CreditCard,
  Flame,
  LogOut,
  Moon,
  Sparkles,
  Target,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { useSessionStore } from "@/lib/store/use-session-store"
import { mockTopicMastery } from "@/lib/mock-data"

export default function ProfilePage() {
  const profile = useSessionStore((s) => s.profile)
  const used = profile.questionsUsedToday
  const limit = profile.dailyLimit

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="bg-secondary text-xl font-medium">
            {profile.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          <Badge variant={profile.plan === "pro" ? "default" : "secondary"} className="w-fit capitalize">
            {profile.plan} plan
          </Badge>
        </div>
      </header>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <Flame className="size-5 text-primary" />
            <span className="text-lg font-semibold">{profile.streakDays}</span>
            <span className="text-xs text-muted-foreground">day streak</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <Target className="size-5 text-primary" />
            <span className="text-lg font-semibold">
              {Math.round(
                mockTopicMastery.reduce((s, t) => s + t.mastery, 0) / mockTopicMastery.length,
              )}
              %
            </span>
            <span className="text-xs text-muted-foreground">mastery</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <Sparkles className="size-5 text-primary" />
            <span className="text-lg font-semibold">
              {used}/{limit}
            </span>
            <span className="text-xs text-muted-foreground">today</span>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade card for free users */}
      {profile.plan === "free" && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card">
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-4" />
              <span className="text-sm font-semibold">CertForge Pro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Unlimited daily questions, exam simulations, and detailed analytics.
            </p>
            <Progress value={(used / limit) * 100} className="h-1.5" />
            <p className="text-xs text-muted-foreground">
              {Math.max(0, limit - used)} free questions left today
            </p>
            <Button className="w-full">
              <CreditCard data-icon="inline-start" />
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 p-0">
          <div className="flex items-center justify-between gap-3 px-6 py-3.5">
            <span className="flex items-center gap-3 text-sm">
              <Moon className="size-4 text-muted-foreground" />
              Dark mode
            </span>
            <Switch defaultChecked aria-label="Dark mode" />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-3 px-6 py-3.5">
            <span className="flex items-center gap-3 text-sm">
              <Bell className="size-4 text-muted-foreground" />
              Study reminders
            </span>
            <Switch defaultChecked aria-label="Study reminders" />
          </div>
          <Separator />
          <button className="flex items-center justify-between gap-3 px-6 py-3.5 text-left text-sm transition-colors hover:bg-secondary/50">
            <span className="flex items-center gap-3">
              <CreditCard className="size-4 text-muted-foreground" />
              Billing & plan
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      <Button asChild variant="outline" className="w-full">
        <Link href="/login">
          <LogOut data-icon="inline-start" />
          Sign out
        </Link>
      </Button>
    </div>
  )
}
