import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Lock, LogOut, RefreshCw, Receipt, BarChart3, AlertTriangle } from "lucide-react"
import { Link } from "react-router-dom"
import { BillSplit } from "@/components/restaurant/BillSplit"

const ADMIN_PIN = "2580"
const STORAGE_KEY = "corral_admin_auth"

type Row = {
  id: string
  product_name: string
  category_name: string
  quantity: number
  notes: string | null
  guest_name: string | null
  price: number
  status: string
  payment_method: string | null
  table_alert: string | null
  created_at: string
  table_id: string
  tables: { name: string; code: string } | null
}

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === ADMIN_PIN) {
      localStorage.setItem(STORAGE_KEY, "1")
      onUnlock()
    } else {
      setError(true)
      setPin("")
      setTimeout(() => setError(false), 1500)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl">Acceso administración</h1>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className={`w-full text-center text-2xl tracking-[0.5em] font-mono py-3 rounded-md border-2 bg-background ${error ? "border-destructive animate-pulse" : "border-input"}`}
          placeholder="••••"
          maxLength={6}
        />
        {error && <p className="text-destructive text-sm">PIN incorrecto</p>}
        <Button type="submit" size="lg" className="w-full">Entrar</Button>
      </form>
    </div>
  )
}

function startOfDayISO(d = new Date()): string {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.toISOString()
}

function endOfDayISO(d = new Date()): string {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x.toISOString()
}

const methodLabel = (m: string | null) => {
  if (m === "efectivo") return "Efectivo"
  if (m === "tarjeta") return "Tarjeta"
  if (m === "transferencia") return "Transferencia"
  return ""
}

export default function AdminPedidos() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(STORAGE_KEY) === "1")
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [billTable, setBillTable] = useState<{ id: string; name: string } | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const day = new Date(date)
    const { data, error } = await supabase
      .from("order_items")
      .select("id, product_name, category_name, quantity, notes, guest_name, price, status, payment_method, table_alert, created_at, table_id, tables(name, code)")
      .gte("created_at", startOfDayISO(day))
      .lte("created_at", endOfDayISO(day))
      .order("created_at", { ascending: true })
    if (error) {
      toast.error("Error al cargar pedidos")
      setLoading(false)
      return
    }
    setRows((data as any) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!authed) return
    fetchData()
  }, [authed, date])

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuthed(false)
  }

  if (!authed) return <PinGate onUnlock={() => setAuthed(true)} />

  const visible = rows.filter((r) => r.status !== "pending_submit")

  const byTable = visible.reduce<Record<string, Row[]>>((acc, r) => {
    const key = r.tables?.name ?? "Sin mesa"
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  const tableEntries = Object.entries(byTable).sort(([a], [b]) => {
    const na = parseInt(a.replace(/\D/g, ""), 10) || 0
    const nb = parseInt(b.replace(/\D/g, ""), 10) || 0
    return na - nb
  })

  const grandTotal = visible.reduce((s, r) => s + Number(r.price) * r.quantity, 0)
  const grandCount = visible.reduce((s, r) => s + r.quantity, 0)

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">Pedidos del día</h1>
          <span className="text-sm text-muted-foreground">
            {grandCount} platos · {tableEntries.length} mesas activas · {grandTotal.toFixed(2)} €
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <Link to="/admin/stats">
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-1" /> Stats
            </Button>
          </Link>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-md border border-input bg-background text-sm"
          />
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-1" /> Salir
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-20">Cargando...</div>
      ) : tableEntries.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">No hay pedidos para esta fecha</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tableEntries.map(([tableName, items]) => {
              const total = items.reduce((s, r) => s + Number(r.price) * r.quantity, 0)
              const allPaid = items.every((r) => r.status === "pagado")
              const allServed = items.every((r) => r.status === "servido" || r.status === "pagado")
              const paidMethod = allPaid ? items.find((r) => r.payment_method)?.payment_method ?? null : null
              const alerts = Array.from(new Set(items.map((r) => r.table_alert).filter(Boolean) as string[]))
              return (
                <Card key={tableName}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3 border-b pb-2 gap-2">
                      <h2 className="font-display text-xl">{tableName}</h2>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setBillTable({ id: items[0].table_id, name: tableName })}
                        >
                          <Receipt className="w-3.5 h-3.5 mr-1" /> Cuenta
                        </Button>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${allPaid ? "bg-green-100 text-green-800" : allServed ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {allPaid ? `Pagada${paidMethod ? ` · ${methodLabel(paidMethod)}` : ""}` : allServed ? "Servida" : "Abierta"}
                        </span>
                      </div>
                    </div>

                    {alerts.length > 0 && (
                      <div className="mb-3 bg-red-100 dark:bg-red-950/50 border-2 border-red-500 rounded-md p-2.5 space-y-1.5">
                        {alerts.map((a, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">⚠ Alerta de mesa</div>
                              <div className="text-sm font-bold text-red-900 dark:text-red-200 leading-tight">{a}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      {items.map((r) => (
                        <div key={r.id} className="flex justify-between gap-2">
                          <span className="flex-1 min-w-0">
                            <span className="font-semibold text-primary">{r.quantity}x</span>{" "}
                            {r.product_name}
                            {r.guest_name && <span className="text-muted-foreground"> · {r.guest_name}</span>}
                          </span>
                          <span className="shrink-0">{(Number(r.price) * r.quantity).toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between border-t mt-3 pt-2 font-semibold">
                      <span>Total</span>
                      <span>{total.toFixed(2)} €</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <div className="mt-6 p-4 bg-primary/10 rounded-lg flex justify-between items-center">
            <span className="font-display text-xl">Total del día</span>
            <span className="font-display text-2xl text-primary">{grandTotal.toFixed(2)} €</span>
          </div>
        </>
      )}

      {billTable && (
        <BillSplit
          tableId={billTable.id}
          tableName={billTable.name}
          open={!!billTable}
          onOpenChange={(v) => {
            if (!v) {
              setBillTable(null)
              fetchData()
            }
          }}
          isAdmin
        />
      )}
    </div>
  )
}