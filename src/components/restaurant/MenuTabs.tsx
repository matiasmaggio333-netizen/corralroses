import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useLang, tCategory } from "@/lib/i18n"
import type { Category } from "@/lib/types"

export function MenuTabs({ categories, active, onChange }: {
  categories: Category[]
  active: string | null
  onChange: (id: string) => void
}) {
  const lang = useLang()
  const containerRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    if (!active) return
    const el = tabsRef.current[active]
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
  }, [active])

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
      <div ref={containerRef} className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 px-3 py-2 min-w-max">
          {categories.map((c) => (
            <button
              key={c.id}
              ref={(el) => { tabsRef.current[c.id] = el }}
              onClick={() => onChange(c.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                active === c.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
            >
              {tCategory(c, lang)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}