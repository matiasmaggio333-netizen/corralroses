import { useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Check } from "lucide-react"

export function OrderConfirmationModal({ open, onOpenChange, itemCount, total }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  itemCount: number
  total: number
}) {
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => onOpenChange(false), 4000)
    return () => clearTimeout(t)
  }, [open, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
          <Check className="w-9 h-9 text-primary" />
        </div>
        <h2 className="font-display text-2xl mt-2">¡Pedido enviado!</h2>
        <p className="text-muted-foreground text-sm">
          {itemCount} {itemCount === 1 ? "plato" : "platos"} · {total.toFixed(2)} €
        </p>
        <p className="text-sm">La cocina ya lo está preparando.</p>
      </DialogContent>
    </Dialog>
  )
}
