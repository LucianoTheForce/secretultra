"use client";

import Image from "next/image";
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  BookOpen,
  Settings,
  LifeBuoy,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UserProfile } from "@/components/auth/user-profile";

export type StudioNavKey =
  | "generate"
  | "my-images"
  | "my-videos"
  | "my-stories"
  | "settings"
  | "support";

const MAIN_NAV: { key: StudioNavKey; label: string; icon: LucideIcon }[] = [
  { key: "generate", label: "Generate", icon: Sparkles },
  { key: "my-images", label: "My images", icon: ImageIcon },
  { key: "my-videos", label: "My videos", icon: Video },
  { key: "my-stories", label: "My stories", icon: BookOpen },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "support", label: "Support", icon: LifeBuoy },
];

interface StudioSidebarProps {
  credits: number | null;
  totalGenerated: number | null;
  isGenerating?: boolean;
  onNewChat?: () => void;
  onManageCredits?: () => void;
  activeKey?: StudioNavKey;
  onSelect?: (key: StudioNavKey) => void;
  hasUnlimitedCredits?: boolean;
  isAdmin?: boolean;
  onAdminNavigate?: () => void;
  className?: string;
}

export function StudioSidebar({
  credits,
  totalGenerated,
  isGenerating,
  onNewChat,
  onManageCredits,
  activeKey,
  onSelect,
  hasUnlimitedCredits,
  isAdmin,
  onAdminNavigate,
  className,
}: StudioSidebarProps) {
  const creditsLabel = hasUnlimitedCredits
    ? "Unlimited credits"
    : credits === null
      ? "Syncing"
      : `${credits} credits`;
  const totalLabel =
    typeof totalGenerated === "number"
      ? `${totalGenerated} generated`
      : hasUnlimitedCredits
        ? "Master account"
        : "Keep creating";
  const resolvedActive = activeKey ?? "generate";
  const handleSelect = onSelect ?? (() => {});
  const handleManageCredits = onManageCredits ?? (() => {});
  const handleNewChat = onNewChat ?? (() => {});

  return (
    <aside
      className={cn(
        "hidden lg:flex w-[260px] flex-col border-r border-[#16151d] bg-[#07070d] text-white",
        className,
      )}
    >
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center">
          <Image
            src="/marca_completa_RGB_negativo.png"
            alt="Ultragaz"
            width={180}
            height={45}
            priority
            className="select-none h-auto"
            style={{ width: "auto" }}
          />
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-5 pb-10">
        <div className="space-y-2">
          {MAIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = resolvedActive === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSelect(item.key)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-[#5b3ef8] text-white shadow-lg shadow-[#5b3ef8]/30"
                    : "text-[#b3b1c8] hover:bg-[#10101b] hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive
                      ? "text-white"
                      : "text-[#7c7b91] group-hover:text-white",
                  )}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {item.key === "generate" && isGenerating && (
                  <Badge
                    variant="secondary"
                    className="ml-auto rounded-full bg-white/20 px-2 py-0 text-[10px] text-white"
                  >
                    Generating
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {isAdmin && onAdminNavigate && (
          <div className="mt-6 space-y-2">
            <div className="px-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#5e5d73]">
              Administracao
            </div>
            <button
              type="button"
              onClick={onAdminNavigate}
              className="group flex w-full items-center gap-3 rounded-2xl bg-[#10101b] px-4 py-3 text-sm font-semibold text-[#c7c3ff] transition hover:bg-[#5b3ef8] hover:text-white"
            >
              <ShieldCheck className="h-4 w-4 text-[#7c5cff] group-hover:text-white" />
              <span className="flex-1 text-left">Admin dashboard</span>
              {hasUnlimitedCredits && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white"
                >
                  Master
                </Badge>
              )}
            </button>
          </div>
        )}

        {onNewChat && (
          <button
            type="button"
            onClick={handleNewChat}
            className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-[#7c5cff] transition hover:text-[#a855f7]"
          >
            <Sparkles className="h-4 w-4" />
            New chat
          </button>
        )}
      </nav>

      <div className="space-y-4 px-5 pb-8">
        <div className="rounded-2xl border border-[#191927] bg-[#0c0c15] px-4 py-3">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.32em] text-[#5e5d73]">
            <span>Credits</span>
            {isAdmin && onManageCredits && (
              <button
                type="button"
                onClick={handleManageCredits}
                className="text-[10px] font-medium tracking-[0.32em] text-[#7c5cff] hover:text-[#a855f7]"
              >
                Manage
              </button>
            )}
          </div>
          <p className="mt-2 text-lg font-semibold text-white">
            {creditsLabel}
          </p>
          <p className="text-xs text-[#7c7b91]">{totalLabel}</p>
        </div>

        <UserProfile />
      </div>
    </aside>
  );
}
