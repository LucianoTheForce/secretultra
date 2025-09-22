"use client"

import Image from "next/image"
import { Sparkles, Image as ImageIcon, Compass, Settings, LifeBuoy, CircleDot } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UserProfile } from "@/components/auth/user-profile"

interface StudioSidebarProps {
  credits: number | null
  totalGenerated: number | null
  isGenerating?: boolean
  onNewChat?: () => void
  onManageCredits?: () => void
  className?: string
}

const MAIN_NAV = [
  { key: "generate", label: "Generate", icon: Sparkles },
  { key: "images", label: "My images", icon: ImageIcon },
  { key: "explore", label: "Explore", icon: Compass },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "support", label: "Support", icon: LifeBuoy },
] as const

const CHAT_NAV = [
  { key: "all", label: "All chats", color: "bg-[#4f46e5]", count: 23 },
  { key: "favourite", label: "Favourite", color: "bg-[#f97316]", count: 9 },
  { key: "archived", label: "Archived", color: "bg-[#22c55e]", count: 3 },
] as const

export function StudioSidebar({
  credits,
  totalGenerated,
  isGenerating,
  onNewChat,
  onManageCredits,
  className,
}: StudioSidebarProps) {
  const creditsLabel = credits === null ? "Syncing" : `${credits} credits`
  const totalLabel = typeof totalGenerated === "number" ? `${totalGenerated} generated` : "Keep creating"

  return (
    <aside
      className={cn(
        "hidden lg:flex w-[260px] flex-col border-r border-[#16151d] bg-[#07070d] text-white",
        className,
      )}
    >
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center">
          <Image src="/marca_completa_RGB_negativo.png" alt="Ultragaz" width={180} height={45} priority className="select-none" />
        </div>
      </div>

      <nav className="flex-1 space-y-8 overflow-y-auto px-5 pb-10">
        <div className="space-y-2">
          {MAIN_NAV.map((item, index) => {
            const Icon = item.icon
            const isActive = index === 0
            return (
              <button
                key={item.key}
                type="button"
                className={cn(
                  "group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-[#5b3ef8] text-white"
                    : "text-[#b3b1c8] hover:bg-[#10101b] hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-white" : "text-[#7c7b91] group-hover:text-white",
                  )}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && isGenerating && (
                  <Badge variant="secondary" className="ml-auto rounded-full bg-white/20 px-2 py-0 text-[10px] text-white">
                    Generating
                  </Badge>
                )}
              </button>
            )
          })}
        </div>

        <div className="space-y-4">
          <div className="px-1 text-[11px] uppercase tracking-[0.3em] text-[#5e5d73]">Chat List</div>
          <div className="space-y-1">
            {CHAT_NAV.map((item) => (
              <button
                key={item.key}
                type="button"
                className="flex w-full items-center justify-between rounded-2xl px-4 py-[10px] text-sm text-[#b3b1c8] transition hover:bg-[#10101b] hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", item.color)} />
                  {item.label}
                </span>
                <span className="rounded-full bg-[#141421] px-2 py-[2px] text-[11px] text-[#d6d4ef]">
                  {item.count}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={onNewChat}
              className="flex w-full items-center gap-2 rounded-2xl px-4 py-[10px] text-sm font-medium text-[#7c5cff] transition hover:text-[#a855f7]"
            >
              <CircleDot className="h-4 w-4" />
              New Chat
            </button>
          </div>
        </div>
      </nav>

      <div className="space-y-4 px-5 pb-8">
        <div className="rounded-2xl border border-[#191927] bg-[#0c0c15] px-4 py-3">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.32em] text-[#5e5d73]">
            <span>Credits</span>
            <button
              type="button"
              onClick={onManageCredits}
              className="text-[10px] font-medium tracking-[0.32em] text-[#7c5cff] hover:text-[#a855f7]"
            >
              Manage
            </button>
          </div>
          <p className="mt-2 text-lg font-semibold text-white">{creditsLabel}</p>
          <p className="text-xs text-[#7c7b91]">{totalLabel}</p>
        </div>

        <UserProfile />
      </div>
    </aside>
  )
}
