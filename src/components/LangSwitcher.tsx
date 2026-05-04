import { useLang, setStoredLang, type Lang } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "ca", label: "CA", flag: "🏴󠁥󠁳󠁣󠁴󠁿" },
  { code: "es", label: "ES", flag: "🇪🇸" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "de", label: "DE", flag: "🇩🇪" },
  { code: "nl", label: "NL", flag: "🇳🇱" },
]

export function LangSwitcher({ className }: { className?: string }) {
  const lang = useLang()
  return (
    <div className={cn("inline-flex bg-muted/60 rounded-full p-0.5 text-xs font-semibold gap-0.5 flex-wrap", className)}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setStoredLang(l.code)}
          aria-label={l.label}
          className={cn(
            "px-2 py-1 rounded-full transition-colors flex items-center gap-1",
            lang === l.code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="text-sm leading-none">{l.flag}</span>
          <span className="hidden sm:inline">{l.label}</span>
        </button>
      ))}
    </div>
  )
}