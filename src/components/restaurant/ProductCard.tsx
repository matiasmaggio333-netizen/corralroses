import { Card } from "@/components/ui/card"
import { Plus, ImageIcon } from "lucide-react"
import { useLang, tProductName, tProductDescription } from "@/lib/i18n"
import type { Product } from "@/lib/types"

export function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const lang = useLang()
  const desc = tProductDescription(product, lang)

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:border-primary/60 transition-colors overflow-hidden group"
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={tProductName(product, lang)}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
            <ImageIcon className="w-12 h-12" />
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onClick() }}
          className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
          aria-label="Añadir"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="p-3">
        <h3 className="font-display text-base leading-tight">{tProductName(product, lang)}</h3>
        {desc && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{desc}</p>}
        <div className="mt-2 font-semibold text-primary">{product.price.toFixed(2)} €</div>
      </div>
    </Card>
  )
}