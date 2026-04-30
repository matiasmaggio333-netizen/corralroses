import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ShoppingBag, Trash2 } from "lucide-react"
import { useLang, t } from "@/lib/i18n"
import type { CartItem } from "./ProductModal"

export function OrderSummary({ items, onRemove, onSend }: {
  items: CartItem[]
  onRemove: (idx: number) => void
  onSend: () => void
}) {
  const lang = useLang()
  const s = t(lang)
  const [open, setOpen] = useState(false)

  if (items.length === 0) return null

  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const total = items.reduce((sum, i) => {
    const extras = (i.selectedOptions || []).reduce((x, o) => x + (o.price || 0), 0)
    return sum + (i.product.price + extras) * i.quantity
  }, 0)

  const handleSend = () => {
    onSend()
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-3 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-transform"
        aria-label={s.my_order}
      >
        <div className="relative">
          <ShoppingBag className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {count}
          </span>
        </div>
        <span className="font-semibold">{total.toFixed(2)} €</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{s.my_order}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {items.map((item, idx) => {
              const extras = (item.selectedOptions || []).reduce((x, o) => x + (o.price || 0), 0)
              const lineTotal = (item.product.price + extras) * item.quantity
              return (
                <div key={idx} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0">
                  <span className="font-bold text-primary shrink-0 text-base">{item.quantity}x</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.product.name}</div>
                    {item.selectedOptions?.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item.selectedOptions.map((o) => o.name).join(", ")}
                      </div>
                    )}
                    {item.notes && <div className="text-xs text-muted-foreground italic mt-0.5">{item.notes}</div>}
                  </div>
                  <span className="shrink-0 font-semibold">{lineTotal.toFixed(2)} €</span>
                  <button onClick={() => onRemove(idx)} className="text-destructive shrink-0 p-1" aria-label="Quitar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="font-semibold text-lg">{s.total}: {total.toFixed(2)} €</span>
          </div>
          <Button onClick={handleSend} size="lg" className="w-full">
            {s.send_kitchen}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}