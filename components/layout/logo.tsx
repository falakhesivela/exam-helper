import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  showWordmark?: boolean
}

/** Prepa brand lockup: the app icon mark plus an optional wordmark. */
export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/icon.svg"
        alt="Prepa"
        width={32}
        height={32}
        className="size-8 rounded-lg"
        priority
      />
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight">
          Prep<span className="text-primary">a</span>
        </span>
      )}
    </div>
  )
}
