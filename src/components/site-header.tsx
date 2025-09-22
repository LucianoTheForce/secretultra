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
    <header className="py-4">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex h-12 items-center justify-between rounded-full bg-neutral-100 px-6 shadow-sm">
            {/* Left: Logo */}
            <Link href="/studio" className="flex items-center">
              <Image 
                src="/marca_completa_RGB_negativo.png" 
                alt="ultragaz" 
                width={100} 
                height={25} 
                priority
                className="select-none opacity-80"
                style={{ filter: 'invert(1)' }}
              />
            </Link>

            {/* Center: Navigation */}
            <nav className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-1">
              <Link 
                href="/studio" 
                className="px-4 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded-full transition-all"
              >
                Studio
              </Link>
              <Link 
                href="/gallery" 
                className="px-4 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded-full transition-all"
              >
                Gallery
              </Link>
              <Link 
                href="/pricing" 
                className="px-4 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded-full transition-all"
              >
                Pricing
              </Link>
              <Link 
                href="/about" 
                className="px-4 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded-full transition-all"
              >
                About
              </Link>
            </nav>

            {/* Right: Sign in */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-500">42 credits</span>
              <button className="px-4 py-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 rounded-full transition-all">
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
