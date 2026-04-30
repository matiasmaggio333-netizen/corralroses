import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Minus, Plus } from "lucide-react"
import { useLang, t, tProductName, tProductDescription, type Lang } from "@/lib/i18n"
import type { Product, ProductOption, SelectedOption } from "@/lib/types"

export type CartItem = {
  product: Product
  quantity: number
  notes: string
  selectedOptions: SelectedOption[]
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
  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({})

  if (!product) return null

  const desc = tProductDescription(product, lang)
  const cfg = product.options_config
  const hasOptions = !!cfg && Array.isArray(cfg.options) && cfg.options.length > 0
  const isSauces = cfg?.type === "sauces"
  const totalOptionQty = Object.values(optionQuantities).reduce((a, b) => a + b, 0)
  const extraPrice = hasOptions
    ? cfg!.options.reduce((sum, o) => sum + (o.price || 0) * (optionQuantities[o.id] ?? 0), 0)
    : 0
  const effectiveQty = hasOptions && isSauces ? totalOptionQty : quantity
  const totalPrice = hasOptions && isSauces
    ? product.price * totalOptionQty + extraPrice
    : product.price * quantity + extraPrice
  const minRequired = cfg?.required ? (cfg.min || 1) : 0
  const canAdd = hasOptions ? totalOptionQty >= minRequired : true

  const incOption = (id: string) =>
    setOptionQuantities(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
  const decOption = (id: string) =>
    setOptionQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) - 1) }))

  const handleAdd = () => {
    if (!canAdd) return
    const selOpts: SelectedOption[] = hasOptions
      ? cfg!.options
          .filter(o => (optionQuantities[o.id] ?? 0) > 0)
          .map(o => ({ ...o, quantity: optionQuantities[o.id] }))
      : []
    onAdd({ product, quantity: effectiveQty, notes, selectedOptions: selOpts })
    setQuantity(1)
    setNotes("")
    setOptionQuantities({})
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
          <div className="text-2xl font-semibold text-primary">{totalPrice.toFixed(2)} €</div>

          {hasOptions && (
            <div className="space-y-2">
              <Label>{s.choose_sauces}</Label>
              <div className="space-y-2">
                {cfg!.options.map((o) => {
                  const qty = optionQuantities[o.id] ?? 0
                  return (
                    <div key={o.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{tOption(o, lang)}</div>
                        <div className="text-xs text-muted-foreground">+{o.price.toFixed(2)}€</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={qty <= 0}
                          onClick={() => decOption(o.id)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-6 text-center font-semibold">{qty}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => incOption(o.id)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
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
            {!(hasOptions && isSauces) ? (
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
            ) : <div />}
            <Button onClick={handleAdd} size="lg" disabled={!canAdd}>
              {s.add_btn} · {totalPrice.toFixed(2)} €
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}