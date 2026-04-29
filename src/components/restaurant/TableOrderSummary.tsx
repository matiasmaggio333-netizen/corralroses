import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import type { OrderItem } from "@/lib/types"

export function TableOrderSummary({ tableId }: { tableId: string | undefined }) {
  const [items, setItems] = useState<OrderItem[]>([])

  useEffect(() => {
    if (!tableId) return
    const fetch = async () => {
      const { data } = await supabase
        .from("order_items")
        .select("*")
        .eq("table_id", tableId)
        .in("status", ["en_cocina", "servido"])
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

  const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0)

  return (
    <div className="bg-muted/40 border-y p-4">
      <h3 className="font-display text-base mb-2">Pedido de la mesa</h3>
      <div className="space-y-1 text-sm">
        {items.map((it) => (
          <div key={it.id} className="flex justify-between gap-2">
            <span className="flex-1">
              <span className="font-semibold text-primary">{it.quantity}x</span>{" "}
              {it.product_name}
              {it.guest_name && <span className="text-muted-foreground"> · {it.guest_name}</span>}
              {it.status === "servido" && <span className="text-green-700 text-xs ml-2">✓ servido</span>}
            </span>
            <span>{(Number(it.price) * it.quantity).toFixed(2)} €</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between border-t mt-2 pt-2 font-semibold">
        <span>Total mesa</span>
        <span>{total.toFixed(2)} €</span>
      </div>
    </div>
  )
}
