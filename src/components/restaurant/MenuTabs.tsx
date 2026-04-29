import { cn } from "@/lib/utils"
import type { Category } from "@/lib/types"

export function MenuTabs({ categories, active, onChange }: {
  categories: Category[]
  active: string | null
  onChange: (id: string) => void
}) {
  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 px-3 py-2 min-w-max">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onChange(c.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                active === c.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
