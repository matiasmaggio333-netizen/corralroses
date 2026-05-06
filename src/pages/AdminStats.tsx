import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { LogOut, RefreshCw, TrendingUp, ClipboardList, Banknote, CreditCard, ArrowLeftRight, ImageIcon, Euro } from "lucide-react"
import { Link } from "react-router-dom"

type Row = {
  product_name: string
  category_name: string
  quantity: number
  price: number
  status: string
  payment_method: string | null
  created_at: string
}

type ProductRef = { id: string; name: string; category_id: string }
type CategoryRef = { id: string; name: string }

type Range = "today" | "week" | "month"

function rangeBounds(r: Range): { from: string; to: string; label: string } {
  const now = new Date()
  const to = new Date(now); to.setHours(23, 59, 59, 999)
  const from = new Date(now)
  let label = "Hoy"
  if (r === "today") { from.setHours(0, 0, 0, 0); label = "Hoy" }
  else if (r === "week") { from.setDate(from.getDate() - 6); from.setHours(0, 0, 0, 0); label = "Últimos 7 días" }
  else { from.setDate(from.getDate() - 29); from.setHours(0, 0, 0, 0); label = "Últimos 30 días" }
  return { from: from.toISOString(), to: to.toISOString(), label }
}

export default function AdminStats() {
  const { signOut } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [products, setProducts] = useState<ProductRef[]>([])
  const [categories, setCategories] = useState<CategoryRef[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>("today")

  const fetchData = async () => {
    setLoading(true)
    const { from, to } = rangeBounds(range)
    const [{ data: orderData, error }, { data: prodData }, { data: catData }] = await Promise.all([
      supabase.from("order_items").select("product_name, category_name, quantity, price, status, payment_method, created_at").gte("created_at", from).lte("created_at", to),
      supabase.from("products").select("id, name, category_id").eq("is_active", true).order("name"),
      supabase.from("categories").select("id, name").order("order_index"),
    ])
    if (error) { toast.error("Error al cargar stats"); setLoading(false); return }
    setRows(((orderData as any) ?? []).filter((r: Row) => r.status !== "pending_submit"))
    setProducts((prodData as any) ?? [])
    setCategories((catData as any) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [range])

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

    const topProducts = Object.entries(byProduct).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.qty - a.qty).slice(0, 10)

    const byCategory = rows.reduce<Record<string, { qty: number; revenue: number }>>((acc, r) => {
      const k = r.category_name || "Sin categoría"
      if (!acc[k]) acc[k] = { qty: 0, revenue: 0 }
      acc[k].qty += r.quantity
      acc[k].revenue += Number(r.price) * r.quantity
      return acc
    }, {})
    const categoriesStats = Object.entries(byCategory).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue)

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

    return { totalRevenue, totalItems, avgTicket, topProducts, categoriesStats, byMethod, paidTotal, pendingTotal, byProduct }
  }, [rows])

  const usageByCategory = useMemo(() => {
    const catMap: Record<string, string> = {}
    for (const c of categories) catMap[c.id] = c.name

    const result: Record<string, { name: string; qty: number }[]> = {}
    for (const p of products) {
      const catName = catMap[p.category_id] ?? "Sin categoría"
      if (!result[catName]) result[catName] = []
      result[catName].push({
        name: p.name,
        qty: stats.byProduct[p.name]?.qty ?? 0,
      })
    }
    for (const cat of Object.keys(result)) {
      result[cat].sort((a, b) => b.qty - a.qty)
    }
    return result
  }, [products, categories, stats.byProduct])

  const { label } = rangeBounds(range)
  const maxTopQty = stats.topProducts[0]?.qty ?? 1
  const maxCatRev = stats.categoriesStats[0]?.revenue ?? 1

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
            <Button variant="outline" size="sm"><ClipboardList className="w-4 h-4 mr-1" /> Pedidos</Button>
          </Link>
          <Link to="/admin/imagenes">
            <Button variant="outline" size="sm"><ImageIcon className="w-4 h-4 mr-1" /> Imágenes</Button>
          </Link>
          <Link to="/admin/precios">
            <Button variant="outline" size="sm"><Euro className="w-4 h-4 mr-1" /> Precios</Button>
          </Link>
          <div className="inline-flex bg-muted/60 rounded-full p-0.5 text-xs font-semibold">
            {(["today", "week", "month"] as Range[]).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 rounded-full transition-colors ${range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {r === "today" ? "Hoy" : r === "week" ? "7 días" : "30 días"}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Salir</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-20">Cargando...</div>
      ) : rows.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">No hay datos para este período</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card><CardContent className="p-5">
              <div className="text-sm text-muted-foreground">Facturación</div>
              <div className="font-display text-3xl text-primary mt-1">{stats.totalRevenue.toFixed(2)} €</div>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <div className="text-sm text-muted-foreground">Platos servidos</div>
              <div className="font-display text-3xl mt-1">{stats.totalItems}</div>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <div className="text-sm text-muted-foreground">Ticket medio</div>
              <div className="font-display text-3xl mt-1">{stats.avgTicket.toFixed(2)} €</div>
            </CardContent></Card>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card><CardContent className="p-5">
              <h2 className="font-display text-xl mb-4">Top 10 productos</h2>
              <div className="space-y-3">
                {stats.topProducts.map((p, idx) => (
                  <div key={p.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium"><span className="text-muted-foreground mr-2">#{idx + 1}</span>{p.name}</span>
                      <span className="text-muted-foreground">{p.qty}× · {p.revenue.toFixed(2)} €</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${(p.qty / maxTopQty) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <h2 className="font-display text-xl mb-4">Por categoría</h2>
              <div className="space-y-3">
                {stats.categoriesStats.map((c) => (
                  <div key={c.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground">{c.qty}× · {c.revenue.toFixed(2)} €</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-accent h-2 rounded-full" style={{ width: `${(c.revenue / maxCatRev) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          </div>

          <Card>
            <CardContent className="p-5">
              <h2 className="font-display text-xl mb-4">Uso de todos los productos</h2>
              <div className="space-y-6">
                {Object.entries(usageByCategory).map(([catName, prods]) => {
                  const maxQty = prods[0]?.qty ?? 1
                  return (
                    <div key={catName}>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase trackin