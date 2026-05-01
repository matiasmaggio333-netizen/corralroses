import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Lock, LogOut, RefreshCw, TrendingUp, ClipboardList, Banknote, CreditCard, ArrowLeftRight, ImageIcon } from "lucide-react"
import { Link } from "react-router-dom"

const ADMIN_PIN = "2580"
const STORAGE_KEY = "corral_admin_auth"

type Row = {
  product_name: string
  category_name: string
  quantity: number
  price: number
  status: string
  payment_method: string | null
  created_at: string
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

type Range = "today" | "week" | "month"

function rangeBounds(r: Range): { from: string; to: string; label: string } {
  const now = new Date()
  const to = new Date(now); to.setHours(23, 59, 59, 999)
  const from = new Date(now)
  let label = "Hoy"
  if (r === "today") {
    from.setHours(0, 0, 0, 0)
    label = "Hoy"
  } else if (r === "week") {
    from.setDate(from.getDate() - 6)
    from.setHours(0, 0, 0, 0)
    label = "Últimos 7 días"
  } else {
    from.setDate(from.getDate() - 29)
    from.setHours(0, 0, 0, 0)
    label = "Últimos 30 días"
  }
  return { from: from.toISOString(), to: to.toISOString(), label }
}

export default function AdminStats() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(STORAGE_KEY) === "1")
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>("today")

  const fetchData = async () => {
    setLoading(true)
    const { from, to } = rangeBounds(range)
    const { data, error } = await supabase
      .from("order_items")
      .select("product_name, category_name, quantity, price, status, payment_method, created_at")
      .gte("created_at", from)
      .lte("created_at", to)
    if (error) {
      toast.error("Error al cargar stats")
      setLoading(false)
      return
    }
    setRows(((data as any) ?? []).filter((r: Row) => r.status !== "pending_submit"))
    setLoading(false)
  }

  useEffect(() => {
    if (!authed) return
    fetchData()
  }, [authed, range])

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuthed(false)
  }

  const stats = useMemo(() => {
    const totalRevenue = rows.reduce((s, r) => s + Number(r.price) * r.quantity, 0)
    const totalItems = rows.reduce((s, r) => s + r.quantity, 0)
    const avgTicket = rows.length > 0 ? totalRevenue / new Set(rows.map((r) => r.created_at.slice(0, 16))).size : 0

    const byProduct = rows.reduce<Record<string, { qty: number; revenue: number }>>((acc, r) => {
      if (!acc[r.product_name]) acc[r.product_name] = { qty: 0, revenue: 0 }
      acc[r.product_name].qty += r.quantity
      acc[r.product_name].revenue += Number(r.price) * r.quantity
      return acc
    }, {})
    const topProducts = Object.entries(byProduct)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10)

    const byCategory = rows.reduce<Record<string, { qty: number; revenue: number }>>((acc, r) => {
      const k = r.category_name || "Sin categoría"
      if (!acc[k]) acc[k] = { qty: 0, revenue: 0 }
      acc[k].qty += r.quantity
      acc[k].revenue += Number(r.price) * r.quantity
      return acc
    }, {})
    const categories = Object.entries(byCategory)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)

    const paidRows = rows.filter((r) => r.status === "pagado" && r.payment_method)
    const byMethod: Record<string, { qty: number; revenue: number }> = {
      efectivo: { qty: 0, revenue: 0 },
      tarjeta: { qty: 0, revenue: 0 },
      transferencia: { qty: 0, revenue: 0 },
    }
    for (const r of paidRows) {
      const m = r.payment_method!
      if (!byMethod[m]) byMethod[m] = { qty: 0, revenue: 0 }
      byMethod[m].qty += r.quantity
      byMethod[m].revenue += Number(r.price) * r.quantity
    }
    const paidTotal = paidRows.reduce((s, r) => s + Number(r.price) * r.quantity, 0)
    const pendingTotal = totalRevenue - paidTotal

    return { totalRevenue, totalItems, avgTicket, topProducts, categories, byMethod, paidTotal, pendingTotal }
  }, [rows])

  if (!authed) return <PinGate onUnlock={() => setAuthed(true)} />

  const { label } = rangeBounds(range)
  const maxTopQty = stats.topProducts[0]?.qty ?? 1
  const maxCatRev = stats.categories[0]?.revenue ?? 1

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-primary" /> Estadísticas
          </h1>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Link to="/admin/pedidos">
            <Button variant="outline" size="sm">
              <ClipboardList className="w-4 h-4 mr-1" /> Pedidos
            </Button>
          </Link>
          <Link to="/admin/imagenes">
            <Button variant="outline" size="sm">
              <ImageIcon className="w-4 h-4 mr-1" /> Imágenes
            </Button>
          </Link>
          <div className="inline-flex bg-muted/60 rounded-full p-0.5 text-xs font-semibold">
            {(["today", "week", "month"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-full transition-colors ${range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {r === "today" ? "Hoy" : r === "week" ? "7 días" : "30 días"}
              </button>
            ))}
          </div>
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
      ) : rows.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">No hay datos para este período</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-5">
                <div className="text-sm text-muted-foreground">Facturación</div>
                <div className="font-display text-3xl text-primary mt-1">{stats.totalRevenue.toFixed(2)} €</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-sm text-muted-foreground">Platos servidos</div>
                <div className="font-display text-3xl mt-1">{stats.totalItems}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-sm text-muted-foreground">Ticket medio</div>
                <div className="font-display text-3xl mt-1">{stats.avgTicket.toFixed(2)} €</div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardContent className="p-5">
              <h2 className="font-display text-xl mb-4">Caja por método de pago</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                  <Banknote className="w-6 h-6 text-green-600" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Efectivo</div>
                    <div className="font-display text-2xl text-green-700 dark:text-green-400">{stats.byMethod.efectivo.revenue.toFixed(2)} €</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Tarjeta</div>
                    <div className="font-display text-2xl text-blue-700 dark:text-blue-400">{stats.byMethod.tarjeta.revenue.toFixed(2)} €</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
                  <ArrowLeftRight className="w-6 h-6 text-purple-600" />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Transferencia</div>
                    <div className="font-display text-2xl text-purple-700 dark:text-purple-400">{stats.byMethod.transferencia.revenue.toFixed(2)} €</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-sm border-t pt-3">
                <span className="text-muted-foreground">Cobrado · {stats.paidTotal.toFixed(2)} €</span>
                <span className="text-muted-foreground">Pendiente · {stats.pendingTotal.toFixed(2)} €</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <h2 className="font-display text-xl mb-4">Top 10 productos</h2>
                <div className="space-y-3">
                  {stats.topProducts.map((p, idx) => (
                    <div key={p.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">
                          <span className="text-muted-foreground mr-2">#{idx + 1}</span>
                          {p.name}
                        </span>
                        <span className="text-muted-foreground">{p.qty}× · {p.revenue.toFixed(2)} €</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(p.qty / maxTopQty) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h2 className="font-display text-xl mb-4">Por categoría</h2>
                <div className="space-y-3">
                  {stats.categories.map((c) => (
                    <div key={c.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-muted-foreground">{c.qty}× · {c.revenue.toFixed(2)} €</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-accent h-2 rounded-full"
                          style={{ width: `${(c.revenue / maxCatRev) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}