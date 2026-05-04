import { useLang, setStoredLang, type Lang } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const LANGS: { code: Lang; label: string }[] = [
  { code: "ca", label: "CA" },
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "de", label: "DE" },
  { code: "nl", label: "NL" },
]

export function LangSwitcher({ className }: { className?: string }) {
  const lang = useLang()
  return (
    <div className={cn("inline-flex bg-muted/60 rounded-full p-0.5 text-[11px] font-semibold flex-wrap", className)}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setStoredLang(l.code)}
          className={cn(
            "px-2 py-1 rounded-full transition-colors min-w-[26px]",
            lang === l.code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}