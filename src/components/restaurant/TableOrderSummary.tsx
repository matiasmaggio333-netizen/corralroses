import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { cn } from "@/lib/utils"
import { useLang, t } from "@/lib/i18n"
import type { OrderItem } from "@/lib/types"

export function TableOrderSummary({ tableId }: { tableId: string | undefined }) {
  const lang = useLang()
  const s = t(lang)
  const [items, setItems] = useState<OrderItem[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!tableId) return
    const fetch = async () => {
      const { data } = await supabase
        .from("order_items")
        .select("*")
        .eq("table_id", tableId)
        .in("status", ["en_cocina", "en_preparacion", "servido"])
        .is("deleted_at", null)
        .is("closing_id", null)
        .order("created_at", { ascending: true })
      if (data) setItems(data as OrderItem[])
    }
    fetch()

    const ch = supabase
      .channel(`table-${tableId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "order_items", filter: `table_id=eq.${tableId}` },
        () => fetch()
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [tableId])

  if (items.length === 0) return null

  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const total = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)

  return (
    <div className="border-y bg-muted/40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
          <span className="font-display text-base">{s.table_order}</span>
          <span className="text-xs text-muted-foreground">· {s.plates(count)}</span>
        </div>
        <span className="font-semibold">{total.toFixed(2)} €</span>
      </button>

      {open && (
        <div className="px-4 pb-3 space-y-1 text-sm">
          {items.map((it) => (
            <div key={it.id} className="flex justify-between gap-2">
              <span className="flex-1">
                <span className="font-semibold text-primary">{it.quantity}x</span>{" "}
                {it.product_name}
                {it.guest_name && <span className="text-muted-foreground"> · {it.guest_name}</span>}
                {it.status === "en_preparacion" && <span className="text-amber-700 text-xs ml-2">🔥 {s.preparing}</span>}
                {it.status === "servido" && <span className="text-green-700 text-xs ml-2">✓ {s.served}</span>}
              </span>
              <span>{(Number(it.price) * it.quantity).toFixed(2)} €</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}