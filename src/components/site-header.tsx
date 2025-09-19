import Link from "next/link";
import Image from "next/image";
import { UserProfile } from "@/components/auth/user-profile";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/ui/mode-toggle";

function CreditsBadge() {
  return (
    <Badge variant="secondary" className="text-xs px-2 py-1">
      42 credits
    </Badge>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left: Brand + Tabs */}
        <div className="flex items-center gap-4">
          <Link href="/studio" className="flex items-center gap-2">
            <Image src="/ultragaz-logo.png" alt="ultragaz" width={24} height={24} />
            <span className="font-semibold">ultragaz</span>
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <CreditsBadge />
          <ModeToggle />
          <UserProfile />
        </div>
      </div>
    </header>
  );
}
