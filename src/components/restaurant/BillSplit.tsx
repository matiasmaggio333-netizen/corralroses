import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Receipt, Users, User, Minus, Plus, CheckCircle2, Banknote, CreditCard, ArrowLeftRight, ArrowLeft } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useLang, t } from "@/lib/i18n"
import type { OrderItem } from "@/lib/types"

type Mode = "total" | "byPerson" | "equal"
type PaymentMethod = "efectivo" | "tarjeta" | "transferencia"

export function BillSplit({ tableId, tableName, open, onOpenChange, isAdmin = false }: {
  tableId: string
  tableName?: string
  open: boolean
  onOpenChange: (v: boolean) => void
  isAdmin?: boolean
}) {
  const lang = useLang()
  const s = t(lang)
  const [items, setItems] = useState<OrderItem[]>([])
  const [mode, setMode] = useState<Mode>("total")
  const [splitN, setSplitN] = useState(2)
  const [marking, setMarking] = useState(false)
  const [selectingMethod, setSelectingMethod] = useState(false)

  const fetchItems = async () => {
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("table_id", tableId)
      .in("status", ["en_cocina", "en_preparacion", "servido"])
      .order("created_at", { ascending: true })
    if (data) setItems(data as OrderItem[])
  }

  useEffect(() => {
    if (!open || !tableId) return
    fetchItems()
    setSelectingMethod(false)
  }, [open, tableId])

  const total = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0),
    [items]
  )

  const byPerson = useMemo(() => {
    const m: Record<string, { items: OrderItem[]; total: number }> = {}
    for (const it of items) {
      const key = it.guest_name?.trim() || s.bill_no_name
      if (!m[key]) m[key] = { items: [], total: 0 }
      m[key].items.push(it)
      m[key].total += Number(it.price) * it.quantity
    }
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b))
  }, [items, s.bill_no_name])

  const perHead = splitN > 0 ? total / splitN : 0

  const markPaid = async (method: PaymentMethod) => {
    setMarking(true)
    const ids = items.map((i) => i.id)
    const { error } = await supabase
      .from("order_items")
      .update({ status: "pagado", payment_method: method })
      .in("id", ids)
    setMarking(false)
    if (error) {
      toast.error(s.error_mark_paid)
      return
    }
    const labels: Record<PaymentMethod, string> = {
      efectivo: "Efectivo",
      tarjeta: "Tarjeta",
      transferencia: "Transferencia",
    }
    toast.success(`Mesa pagada · ${labels[method]}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{s.bill_title}{tableName ? ` · ${tableName}` : ""}</DialogTitle>
        </DialogHeader>

        {selectingMethod ? (
          <div className="space-y-3 py-2">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total a cobrar</div>
              <div className="font-display text-3xl text-primary">{total.toFixed(2)} €</div>
            </div>
            <div className="text-sm text-center text-muted-foreground pt-2">¿Cómo se ha pagado?</div>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={() => markPaid("efectivo")}
                disabled={marking}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white justify-start"
              >
                <Banknote className="w-5 h-5 mr-2" /> Efectivo
              </Button>
              <Button
                onClick={() => markPaid("tarjeta")}
                disabled={marking}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start"
              >
                <CreditCard className="w-5 h-5 mr-2" /> Tarjeta
              </Button>
              <Button
                onClick={() => markPaid("transferencia")}
                disabled={marking}
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-start"
              >
                <ArrowLeftRight className="w-5 h-5 mr-2" /> Transferencia
              </Button>
            </div>
            <Button
              onClick={() => setSelectingMethod(false)}
              disabled={marking}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1 bg-muted/60 rounded-full p-0.5 text-xs font-semibold">
              <button
                onClick={() => setMode("total")}
                className={`px-3 py-2 rounded-full transition-colors flex items-center justify-center gap-1 ${
                  mode === "total" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" /> {s.bill_total}
              </button>
              <button
                onClick={() => setMode("byPerson")}
                className={`px-3 py-2 rounded-full transition-colors flex items-center justify-center gap-1 ${
                  mode === "byPerson" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <User className="w-3.5 h-3.5" /> {s.bill_by_person}
              </button>
              <button
                onClick={() => setMode("equal")}
                className={`px-3 py-2 rounded-full transition-colors flex items-center justify-center gap-1 ${
                  mode === "equal" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <Users className="w-3.5 h-3.5" /> {s.bill_split_equal}
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto">
              {mode === "total" && (
                <div className="space-y-2 text-sm">
                  {items.map((it) => (
                    <div key={it.id} className="flex justify-between gap-2 border-b pb-1.5 last:border-0">
                      <span className="flex-1">
                        <span className="font-semibold text-primary">{it.quantity}x</span> {it.product_name}
                        {it.guest_name && <span className="text-muted-foreground text-xs"> · {it.guest_name}</span>}
                      </span>
                      <span className="shrink-0 font-medium">{(Number(it.price) * it.quantity).toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
              )}

              {mode === "byPerson" && (
                <div className="space-y-4">
                  {byPerson.map(([name, group]) => (
                    <div key={name} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-display text-lg">{name}</span>
                        <span className="font-semibold text-primary">{group.total.toFixed(2)} €</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        {group.items.map((it) => (
                          <div key={it.id} className="flex justify-between gap-2">
                            <span className="flex-1">
                              <span className="font-semibold text-primary">{it.quantity}x</span> {it.product_name}
                            </span>
                            <span className="shrink-0">{(Number(it.price) * it.quantity).toFixed(2)} €</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {mode === "equal" && (
                <div className="space-y-4 text-center py-4">
                  <div className="text-sm text-muted-foreground">{s.bill_split_among}</div>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={splitN <= 1}
                      onClick={() => setSplitN((n) => Math.max(1, n - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="font-display text-3xl w-12 text-center">{splitN}</span>
                    <Button variant="outline" size="icon" onClick={() => setSplitN((n) => n + 1)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">{s.bill_people}</div>
                  <div className="bg-primary/10 rounded-lg py-4">
                    <div className="text-xs text-muted-foreground">{s.bill_per_person}</div>
                    <div className="font-display text-3xl text-primary">{perHead.toFixed(2)} €</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground">{s.bill_total}</span>
              <span className="font-display text-2xl text-primary">{total.toFixed(2)} €</span>
            </div>

            {isAdmin && items.length > 0 && (
              <Button
                onClick={() => setSelectingMethod(true)}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {s.mark_paid}
              </Button>
            )}

            <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full">
              {s.bill_close}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}