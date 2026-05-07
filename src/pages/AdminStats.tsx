import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { LogOut, RefreshCw, TrendingUp, ClipboardList, Banknote, CreditCard, ArrowLeftRight, ImageIcon, Euro, History, Table as TableIcon, Download } from "lucide-react"
import { Link } from "react-router-dom"

type Row = {
  product_name: string
  category_name: string
  quantity: number
  price: number
  status: string
  payment_method: string | null
  created_at: string
  table_id: string | null
  tables: { name: string } | null
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

const methodLabel = (m: string | null) => {
  if (m === "efectivo") return "Efectivo"
  if (m === "tarjeta") return "Tarjeta"
  if (m === "transferencia") return "Transferencia"
  return "—"
}

const methodBadgeClass = (m: string | null) => {
  if (m === "efectivo") return "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300"
  if (m === "tarjeta") return "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
  if (m === "transferencia") return "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
  return "bg-muted text-muted-foreground"
}

function formatDateES(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-")
  if (!y || !m || !d) return yyyymmdd
  return `${d}/${m}/${y.slice(2)}`
}

function csvEscape(value: any): string {
  const s = value === null || value === undefined ? "" : String(value)
  if (/[;"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export default function AdminStats() {
  const { signOut } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [products, setProducts] = useState<ProductRef[]>([])
  const [categories, setCategories] = useState<CategoryRef[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<Range>("today")

  // Exportación contable
  const today = new Date().toISOString().slice(0, 10)
  const currentMonth = today.slice(0, 7)
  const [exportType, setExportType] = useState<"day" | "month">("day")
  const [exportDate, setExportDate] = useState(today)
  const [exportMonth, setExportMonth] = useState(currentMonth)
  const [exporting, setExporting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const { from, to } = rangeBounds(range)
    const [{ data: orderData, error }, { data: prodData }, { data: catData }] = await Promise.all([
      supabase.from("order_items").select("product_name, category_name, quantity, price, status, payment_method, created_at, table_id, tables(name)").gte("created_at", from).lte("created_at", to),
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

  const exportCSV = async () => {
    setExporting(true)
    let from: Date, to: Date, filename: string
    if (exportType === "day") {
      const [y, m, d] = exportDate.split("-").map(Number)
      from = new Date(y, m - 1, d, 0, 0, 0, 0)
      to = new Date(y, m - 1, d, 23, 59, 59, 999)
      filename = `pedidos_${exportDate}.csv`
    } else {
      const [y, m] = exportMonth.split("-").map(Number)
      from = new Date(y, m - 1, 1, 0, 0, 0, 0)
      to = new Date(y, m, 0, 23, 59, 59, 999)
      filename = `pedidos_${exportMonth}.csv`
    }

    const { data, error } = await supabase
      .from("order_items")
      .select("created_at, product_name, category_name, quantity, price, status, payment_method, guest_name, notes, tables(name)")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .neq("status", "pending_submit")
      .order("created_at", { ascending: true })

    if (error || !data) { toast.error("Error al exportar"); setExporting(false); return }
    if (data.length === 0) { toast.error("No hay pedidos en ese período"); setExporting(false); return }

    const headers = ["Fecha", "Hora", "Mesa", "Producto", "Categoría", "Cantidad", "Precio unitario", "Total", "Estado", "Método de pago", "Comensal", "Notas"]
    let totalEfectivo = 0, totalTarjeta = 0, totalTransferencia = 0, totalGeneral = 0

    const rowLines = (data as any[]).map((r) => {
      const d = new Date(r.created_at)
      const fecha = d.toLocaleDateString("es-ES")
      const hora = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      const importe = Number(r.price) * r.quantity
      const precioStr = Number(r.price).toFixed(2).replace(".", ",")
      const totalStr = importe.toFixed(2).replace(".", ",")
      totalGeneral += importe
      if (r.status === "pagado") {
        if (r.payment_method === "efectivo") totalEfectivo += importe
        else if (r.payment_method === "tarjeta") totalTarjeta += importe
        else if (r.payment_method === "transferencia") totalTransferencia += importe
      }
      return [
        fecha, hora, r.tables?.name ?? "",
        r.product_name, r.category_name ?? "",
        r.quantity, precioStr, totalStr,
        r.status, methodLabel(r.payment_method),
        r.guest_name ?? "", r.notes ?? ""
      ].map(csvEscape).join(";")
    })

    const summary = [
      "",
      `RESUMEN;${data.length} líneas`,
      `Total facturado;${totalGeneral.toFixed(2).replace(".", ",")} €`,
      `Cobrado en efectivo;${totalEfectivo.toFixed(2).replace(".", ",")} €`,
      `Cobrado con tarjeta;${totalTarjeta.toFixed(2).replace(".", ",")} €`,
      `Cobrado por transferencia;${totalTransferencia.toFixed(2).replace(".", ",")} €`,
      `Total cobrado;${(totalEfectivo + totalTarjeta + totalTransferencia).toFixed(2).replace(".", ",")} €`,
      `Pendiente de cobro;${(totalGeneral - totalEfectivo - totalTarjeta - totalTransferencia).toFixed(2).replace(".", ",")} €`,
    ]

    const csv = [headers.join(";"), ...rowLines, ...summary].join("\r\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setExporting(false)
    toast.success(`${data.length} pedidos exportados a ${filename}`)
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

  const paymentHistory = useMemo(() => {
    const paid = rows.filter((r) => r.status === "pagado" && r.payment_method)
    const map = new Map<string, { date: string; tableName: string; method: string; total: number }>()
    for (const r of paid) {
      const date = r.created_at.slice(0, 10)
      const tableName = r.tables?.name ?? "Sin mesa"
      const method = r.payment_method!
      const key = `${date}|${tableName}|${method}`
      const amount = Number(r.price) * r.quantity
      const prev = map.get(key)
      if (prev) prev.total += amount
      else map.set(key, { date, tableName, method, total: amount })
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date)
      const na = parseInt(a.tableName.replace(/\D/g, ""), 10) || 0
      const nb = parseInt(b.tableName.replace(/\D/g, ""), 10) || 0
      return na - nb
    })
  }, [rows])

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
          <Link to="/admin/mesas">
            <Button variant="outline" size="sm"><TableIcon className="w-4 h-4 mr-1" /> Mesas</Button>
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

      <Card className="mb-6 border-primary/40 bg-primary/5">
        <CardContent className="p-5">
          <h2 className="font-display text-xl mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" /> Exportación para contabilidad
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex bg-background rounded-full p-0.5 text-xs font-semibold border">
              <button onClick={() => setExportType("day")} className={`px-3 py-1.5 rounded-full transition-colors ${exportType === "day" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                Por día
              </button>
              <button onClick={() => setExportType("month")} className={`px-3 py-1.5 rounded-full transition-colors ${exportType === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                Por mes
              </button>
            </div>
            {exportType === "day" ? (
              <input type="date" value={exportDate} onChange={(e) => setExportDate(e.target.value)} className="px-3 py-2 rounded-md border border-input bg-background text-sm" />
            ) : (
              <input type="month" value={exportMonth} onChange={(e) => setExportMonth(e.target.value)} className="px-3 py-2 rounded-md border border-input bg-background text-sm" />
            )}
            <Button onClick={exportCSV} disabled={exporting}>
              <Download className="w-4 h-4 mr-1" />
              {exporting ? "Exportando..." : "Descargar CSV"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Descarga todos los pedidos del período seleccionado en formato CSV (compatible con Excel español: separador <code>;</code>, decimales con coma, codificación UTF-8). Incluye fila de resumen al final con totales por método de pago.
          </p>
        </CardContent>
      </Card>

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

          <Card className="mb-6">
            <CardContent className="p-5">
              <h2 className="font-display text-xl mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Historial de pagos
              </h2>
              {paymentHistory.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">No hay pagos registrados en este período</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="text-left font-semibold py-2 pr-3">Fecha</th>
                        <th className="text-left font-semibold py-2 pr-3">Mesa</th>
                        <th className="text-left font-semibold py-2 pr-3">Método</th>
                        <th className="text-right font-semibold py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((p, i) => (
                        <tr key={`${p.date}-${p.tableName}-${p.method}-${i}`} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2 pr-3 whitespace-nowrap">{formatDateES(p.date)}</td>
                          <td className="py-2 pr-3 font-medium">{p.tableName}</td>
                          <td className="py-2 pr-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${methodBadgeClass(p.method)}`}>
                              {methodLabel(p.method)}
                            </span>
                          </td>
                          <td className="py-2 text-right font-mono font-semibold">{p.total.toFixed(2)} €</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 font-semibold">
                        <td colSpan={3} className="py-2 pr-3 text-right">Total cobrado</td>
                        <td className="py-2 text-right font-mono text-primary">{paymentHistory.reduce((s, p) => s + p.total, 0).toFixed(2)} €</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="font-display text-xl mb-4">Uso de todos los productos</h2>
              <div className="space-y-6">
                {Object.entries(usageByCategory).map(([catName, prods]) => {
                  const maxQty = prods[0]?.qty ?? 1
                  return (
                    <div key={catName}>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{catName}</h3>
                      <div className="space-y-2">
                        {prods.map((p) => (
                          <div key={p.name}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className={p.qty === 0 ? "text-muted-foreground" : "font-medium"}>{p.name}</span>
                              <span className="text-muted-foreground">{p.qty}×</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div className="bg-primary h-1.5 rounded-full" style={{ width: maxQty > 0 ? `${(p.qty / maxQty) * 100}%` : "0%" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}