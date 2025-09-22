"use client";

import { useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { SignInButton } from "./sign-in-button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserProfile() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (isPending) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-700/50 animate-pulse" />
    );
  }

  if (!session) {
    return <SignInButton />;
  }

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
    router.refresh();
  };

  const menuItems = [
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
    { icon: LogOut, label: "Sign out", onClick: handleSignOut, variant: "danger" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full overflow-hidden rounded-2xl border border-[#191927] bg-[#0c0c15] p-4 hover:bg-[#10101b] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={session.user?.image || ""}
              alt={session.user?.name || "User"}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="bg-[#5b3ef8] text-white text-sm">
              {(
                session.user?.name?.[0] ||
                session.user?.email?.[0] ||
                "U"
              ).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-white">
              {session.user?.name || "User"}
            </p>
            <p className="text-xs text-[#7c7b91]">
              {session.user?.email || "Account"}
            </p>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 text-[#7c7b91] transition-transform",
            isOpen && "rotate-180"
          )} />
        </div>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 bottom-full mb-2 z-50 rounded-2xl border border-neutral-600/30 bg-neutral-800/95 backdrop-blur-2xl shadow-2xl">
            <div className="p-4 border-b border-neutral-700/50">
              <p className="text-sm font-medium text-white">
                {session.user?.name || "User"}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {session.user?.email}
              </p>
            </div>
            <div className="p-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isLast = index === menuItems.length - 1;
                
                return (
                  <div key={item.label}>
                    {isLast && <div className="my-2 border-t border-neutral-700/50" />}
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
                          "text-neutral-300 hover:bg-neutral-700/60 hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          item.onClick?.();
                          setIsOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
                          item.variant === "danger"
                            ? "text-red-400 hover:bg-red-500/20 hover:text-red-300"
                            : "text-neutral-300 hover:bg-neutral-700/60 hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
