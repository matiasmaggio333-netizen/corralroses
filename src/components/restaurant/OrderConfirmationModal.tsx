import { useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Check } from "lucide-react"
import { useLang, t } from "@/lib/i18n"

export function OrderConfirmationModal({ open, onOpenChange, itemCount, total }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  itemCount: number
  total: number
}) {
  const lang = useLang()
  const s = t(lang)

  useEffect(() => {
    if (!open) return
    const tm = setTimeout(() => onOpenChange(false), 4000)
    return () => clearTimeout(tm)
  }, [open, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
          <Check className="w-9 h-9 text-primary" />
        </div>
        <h2 className="font-display text-2xl mt-2">{s.order_sent_title}</h2>
        <p className="text-muted-foreground text-sm">
          {s.plates(itemCount)} · {total.toFixed(2)} €
        </p>
        <p className="text-sm">{s.order_sent_subtitle}</p>
      </DialogContent>
    </Dialog>
  )
}