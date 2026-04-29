import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

type ItemRow = {
  id: string
  product_name: string
  category_name: string
  quantity: number
  notes: string | null
  guest_name: string | null
  created_at: string
  table_id: string
  tables: { name: string; code: string } | null
}

function timeAgo(iso: string, now: number): string {
  const diff = Math.floor((now - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `hace ${diff}s`
  const min = Math.floor(diff / 60)
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  return `hace ${h}h ${min % 60}m`
}

function urgencyClass(iso: string, now: number): string {
  const min = (now - new Date(iso).getTime()) / 60000
  if (min >= 15) return "border-destructive border-2"
  if (min >= 8) return "border-primary border-2"
  return ""
}

export default function Cocina() {
  const [items, setItems] = useState<ItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("order_items")
      .select("id, product_name, category_name, quantity, notes, guest_name, created_at, table_id, tables(name, code)")
      .eq("status", "en_cocina")
      .order("created_at", { ascending: true })
    if (error) {
      toast.error("Error al cargar pedidos")
      return
    }
    setItems((data as any) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
    const ch = supabase
      .channel("cocina")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => fetchItems())
      .subscribe()
    const tick = setInterval(() => setNow(Date.now()), 30000)
    return () => {
      supabase.removeChannel(ch)
      clearInterval(tick)
    }
  }, [])

  const markServed = async (id: string) => {
    const { error } = await supabase.from("order_items").update({ status: "servido" }).eq("id", id)
    if (error) toast.error("Error al marcar servido")
  }

  const grouped = items.reduce<Record<string, ItemRow[]>>((acc, it) => {
    const key = it.tables?.name ?? "Sin mesa"
    if (!acc[key]) acc[key] = []
    acc[key].push(it)
    return acc
  }, {})

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Cocina</h1>
        <span className="text-sm text-muted-foreground">{items.length} pendientes</span>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center text-muted-foreground py-20">No hay pedidos pendientes</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(grouped).map(([tableName, rows]) => {
            const oldest = rows.reduce((o, r) => (r.created_at < o ? r.created_at : o), rows[0].created_at)
            return (
              <Card key={tableName} className={urgencyClass(oldest, now)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <h2 className="font-display text-xl">{tableName}</h2>
                    <span className="text-xs text-muted-foreground">{timeAgo(oldest, now)}</span>
                  </div>
                  <div className="space-y-3">
                    {rows.map((it) => (
                      <div key={it.id} className="flex items-start gap-3">
                        <span className="font-bold text-primary text-lg shrink-0">{it.quantity}x</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold leading-tight">{it.product_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {it.category_name} · {timeAgo(it.created_at, now)}
                          </div>
                          {it.guest_name && <div className="text-xs">👤 {it.guest_name}</div>}
                          {it.notes && <div className="text-xs italic mt-1 text-accent">📝 {it.notes}</div>}
                        </div>
                        <Button size="sm" onClick={() => markServed(it.id)}>Servido</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
