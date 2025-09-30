from pathlib import Path

path = Path("src/components/studio-sidebar.tsx")
text = path.read_text()

text = text.replace(
    "import { Sparkles, Image as ImageIcon, Video, BookOpen, Settings, LifeBuoy } from \"lucide-react\"\n",
    "import { Sparkles, Image as ImageIcon, Video, BookOpen, Settings, LifeBuoy, ShieldCheck } from \"lucide-react\"\n",
)

props_block = "  isGenerating?: boolean\n  onNewChat?: () => void\n  onManageCredits?: () => void\n  activeKey?: StudioNavKey\n  onSelect?: (key: StudioNavKey) => void\n  className?: string\n}\n\nexport function StudioSidebar({\n  credits,\n  totalGenerated,\n  isGenerating,\n  onNewChat,\n  onManageCredits,\n  activeKey,\n  onSelect,\n  className,\n}: StudioSidebarProps) {\n  const creditsLabel = credits === null ? \"Syncing\" : `${credits} credits`\n  const totalLabel = typeof totalGenerated === \"number\" ? `${totalGenerated} generated` : \"Keep creating\"\n"

replacement_block = "  isGenerating?: boolean\n  onNewChat?: () => void\n  onManageCredits?: () => void\n  activeKey?: StudioNavKey\n  onSelect?: (key: StudioNavKey) => void\n  hasUnlimitedCredits?: boolean\n  isAdmin?: boolean\n  onAdminNavigate?: () => void\n  className?: string\n}\n\nexport function StudioSidebar({\n  credits,\n  totalGenerated,\n  isGenerating,\n  onNewChat,\n  onManageCredits,\n  activeKey,\n  onSelect,\n  hasUnlimitedCredits,\n  isAdmin,\n  onAdminNavigate,\n  className,\n}: StudioSidebarProps) {\n  const creditsLabel = hasUnlimitedCredits\n    ? \"8 credits\"\n    : credits === null\n      ? \"Syncing\"\n      : `${credits} credits`\n  const totalLabel = typeof totalGenerated === \"number\" ? `${totalGenerated} generated` : hasUnlimitedCredits ? \"Master account\" : \"Keep creating\"\n"

if props_block not in text:
    raise SystemExit("Props block not found")
text = text.replace(props_block, replacement_block)

text = text.replace(
    "            {onManageCredits && (\n              <button\n                type=\"button\"\n                onClick={handleManageCredits}\n                className=\"text-[10px] font-medium tracking-[0.32em] text-[#7c5cff] hover:text-[#a855f7]\"\n              >\n                Manage\n              </button>\n            )}\n",
    "            {isAdmin && onManageCredits && (\n              <button\n                type=\"button\"\n                onClick={handleManageCredits}\n                className=\"text-[10px] font-medium tracking-[0.32em] text-[#7c5cff] hover:text-[#a855f7]\"\n              >\n                Manage\n              </button>\n            )}\n",
)

needle = "          })\n        }\n\n        {onNewChat && (\n"
if needle not in text:
    raise SystemExit("Nav insertion point not found")
admin_button = "          })\n        }\n\n        {isAdmin && onAdminNavigate && (\n          <button\n            type=\"button\"\n            onClick={onAdminNavigate}\n            className=\"group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[#7c5cff] transition hover:bg-[#10101b] hover:text-white\"\n          >\n            <ShieldCheck className=\"h-4 w-4 text-[#7c5cff] group-hover:text-white\" />\n            <span className=\"flex-1 text-left\">Admin dashboard</span>\n          </button>\n        )}\n\n        {onNewChat && (\n"
text = text.replace(needle, admin_button)

path.write_text(text)
