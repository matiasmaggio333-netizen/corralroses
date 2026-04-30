import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Minus, Plus, Check } from "lucide-react"
import { useLang, t, tProductName, tProductDescription, type Lang } from "@/lib/i18n"
import type { Product, ProductOption } from "@/lib/types"

export type CartItem = {
  product: Product
  quantity: number
  notes: string
  selectedOptions: ProductOption[]
}

function tOption(o: ProductOption, lang: Lang): string {
  if (lang === "ca") return o.name_ca || o.name
  if (lang === "en") return o.name_en || o.name
  return o.name
}

export function ProductModal({ product, open, onOpenChange, onAdd }: {
  product: Product | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onAdd: (item: CartItem) => void
}) {
  const lang = useLang()
  const s = t(lang)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  if (!product) return null

  const desc = tProductDescription(product, lang)
  const cfg = product.options_config
  const hasOptions = !!cfg && Array.isArray(cfg.options) && cfg.options.length > 0
  const selectedOptions: ProductOption[] = hasOptions
    ? cfg!.options.filter((o) => selectedIds.includes(o.id))
    : []
  const extraPrice = selectedOptions.reduce((sum, o) => sum + (o.price || 0), 0)
  const unitPrice = product.price + extraPrice
  const minRequired = cfg?.required ? (cfg.min || 1) : 0
  const canAdd = selectedIds.length >= minRequired

  const toggleOption = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleAdd = () => {
    if (!canAdd) return
    onAdd({ product, quantity, notes, selectedOptions })
    setQuantity(1)
    setNotes("")
    setSelectedIds([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden">
        {product.image_url && (
          <div className="aspect-[16/9] bg-muted -mx-6 -mt-6 mb-2 -mr-6">
            <img
              src={product.image_url}
              alt={tProductName(product, lang)}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="px-6 pb-6 space-y-4">
          <DialogHeader>
            <DialogTitle>{tProductName(product, lang)}</DialogTitle>
          </DialogHeader>
          {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
          <div className="text-2xl font-semibold text-primary">{unitPrice.toFixed(2)} €</div>

          {hasOptions && (
            <div className="space-y-2">
              <Label>{s.choose_sauces}</Label>
              <div className="grid grid-cols-2 gap-2">
                {cfg!.options.map((o) => {
                  const checked = selectedIds.includes(o.id)
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => toggleOption(o.id)}
                      className={`relative flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                        checked
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input hover:bg-muted"
                      }`}
                    >
                      <span className="flex-1 text-left">{tOption(o, lang)}</span>
                      <span className="text-xs opacity-70">+{o.price.toFixed(2)}€</span>
                      {checked && <Check className="absolute top-1 right-1 w-3 h-3" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>{s.notes_kitchen}</Label>
            <Textarea
              placeholder={s.notes_placeholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={handleAdd} size="lg" disabled={!canAdd}>
              {s.add_btn} · {(unitPrice * quantity).toFixed(2)} €
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}