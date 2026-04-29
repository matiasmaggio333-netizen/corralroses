import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { useLang, tProductName, tProductDescription } from "@/lib/i18n"
import type { Product } from "@/lib/types"

export function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const lang = useLang()
  const desc = tProductDescription(product, lang)
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:border-primary/60 transition-colors overflow-hidden"
    >
      <div className="flex gap-3 p-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base leading-tight">{tProductName(product, lang)}</h3>
          {desc && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{desc}</p>}
          <div className="mt-2 font-semibold text-primary">{product.price.toFixed(2)} €</div>
        </div>
        <button
          className="self-center w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0"
          aria-label="Añadir"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </Card>
  )
}
