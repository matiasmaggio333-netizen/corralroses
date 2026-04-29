import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Minus, Plus } from "lucide-react"
import { useLang, t, tProductName, tProductDescription } from "@/lib/i18n"
import type { Product } from "@/lib/types"

export type CartItem = {
  product: Product
  quantity: number
  notes: string
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

  if (!product) return null

  const desc = tProductDescription(product, lang)

  const handleAdd = () => {
    onAdd({ product, quantity, notes })
    setQuantity(1)
    setNotes("")
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
          <div className="text-2xl font-semibold text-primary">{product.price.toFixed(2)} €</div>

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
            <Button onClick={handleAdd} size="lg">
              {s.add_btn} · {(product.price * quantity).toFixed(2)} €
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}