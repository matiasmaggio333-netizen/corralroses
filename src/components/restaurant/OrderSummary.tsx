import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { CartItem } from "./ProductModal"

export function OrderSummary({ items, onRemove, onSend }: {
  items: CartItem[]
  onRemove: (idx: number) => void
  onSend: () => void
}) {
  if (items.length === 0) return null

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t shadow-2xl p-4 max-h-[60vh] overflow-y-auto">
      <h3 className="font-display text-lg mb-3">Mi pedido</h3>
      <div className="space-y-2 mb-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 text-sm">
            <span className="font-semibold text-primary shrink-0">{item.quantity}x</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{item.product.name}</div>
              {item.notes && <div className="text-xs text-muted-foreground">{item.notes}</div>}
            </div>
            <span className="shrink-0">{(item.product.price * item.quantity).toFixed(2)} €</span>
            <button onClick={() => onRemove(idx)} className="text-destructive shrink-0" aria-label="Quitar">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t pt-3">
        <span className="font-semibold">Total: {total.toFixed(2)} €</span>
        <Button onClick={onSend} size="lg">Enviar a cocina</Button>
      </div>
    </div>
  )
}
