import { useLang, setStoredLang, type Lang } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const LANGS: { code: Lang; label: string }[] = [
  { code: "es", label: "ES" },
  { code: "ca", label: "CA" },
  { code: "en", label: "EN" },
]

export function LangSwitcher({ className }: { className?: string }) {
  const lang = useLang()
  return (
    <div className={cn("inline-flex bg-muted/60 rounded-full p-0.5 text-xs font-semibold", className)}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setStoredLang(l.code)}
          className={cn(
            "px-2.5 py-1 rounded-full transition-colors",
            lang === l.code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}