import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Minus, Plus } from "lucide-react"
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
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")

  if (!product) return null

  const handleAdd = () => {
    onAdd({ product, quantity, notes })
    setQuantity(1)
    setNotes("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        {product.description && (
          <p className="text-sm text-muted-foreground">{product.description}</p>
        )}
        <div className="text-2xl font-semibold text-primary">{product.price.toFixed(2)} €</div>

        <div className="space-y-2">
          <Label>Notas para cocina</Label>
          <Textarea
            placeholder="Sin cebolla, poco hecho..."
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
            Añadir · {(product.price * quantity).toFixed(2)} €
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
