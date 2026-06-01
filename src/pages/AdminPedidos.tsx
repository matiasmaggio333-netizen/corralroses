import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { LogOut, RefreshCw, Receipt, BarChart3, AlertTriangle, ImageIcon, Euro, Printer, Search, X, Power, PowerOff, Table as TableIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { BillSplit } from "@/components/restaurant/BillSplit"

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

function startOfDayISO(d = new Date()): string {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x.toISOString()
}
function endOfDayISO(d = new Date()): string {
  const x = new Date(d); x.setHours(23, 59, 59, 999); return x.toISOString()
}
const methodLabel = (m: string | null) => {
  if (m === "efectivo") return "Efectivo"
  if (m === "tarjeta") return "Tarjeta"
  if (m === "bizum") return "Bizum"
  if (m === "transferencia") return "Transferencia"
  return ""
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string))
}

function printComanda(tableName: string, items: Row[]) {
  const total = items.reduce((s, r) => s + Number(r.price) * r.quantity, 0)
  const totalQty = items.reduce((s, r) => s + r.quantity, 0)
  const alerts = Array.from(new Set(items.map((r) => r.table_alert).filter(Boolean) as string[]))
  const allPaid = items.every((r) => r.status === "pagado")
  const paidMethod = allPaid ? items.find((r) => r.payment_method)?.payment_method ?? null : null
  const now = new Date()
  const fecha = now.toLocaleDateString("es-ES")
  const hora = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

  const byPerson: Record<string, { items: Row[]; total: number }> = {}
  for (const it of items) {
    const key = it.guest_name?.trim() || "Sin nombre"
    if (!byPerson[key]) byPerson[key] = { items: [], total: 0 }
    byPerson[key].items.push(it)
    byPerson[key].total += Number(it.price) * it.quantity
  }
  const personEntries = Object.entries(byPerson).sort(([a], [b]) => a.localeCompare(b))

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Comanda ${escapeHtml(tableName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; padding: 24px; max-width: 620px; margin: 0 auto; color: #000; }
  h1 { margin: 0 0 4px 0; font-size: 24px; }
  .sub { color: #555; font-size: 13px; margin-bottom: 16px; border-bottom: 1px solid #ccc; padding-bottom: 12px; }
  .alerts { border: 2px solid #c00; background: #fee; padding: 10px 12px; margin-bottom: 16px; border-radius: 6px; }
  .alerts .lbl { font-size: 10px; font-weight: bold; color: #c00; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .alerts .txt { font-size: 15px; font-weight: bold; color: #800; line-height: 1.3; }
  .person { border: 1px solid #ddd; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; page-break-inside: avoid; }
  .person-head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 8px; }
  .person-name { font-size: 18px; font-weight: bold; }
  .person-total { font-size: 18px; font-weight: bold; color: #b8860b; }
  .line { display: flex; gap: 10px; padding: 4px 0; font-size: 14px; align-items: baseline; }
  .line-qty { font-weight: bold; color: #b8860b; min-width: 32px; }
  .line-name { flex: 1; }
  .line-price { white-space: nowrap; min-width: 70px; text-align: right; }
  .notes { font-size: 11px; color: #666; font-style: italic; margin-top: 2px; }
  .total { display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; padding: 12px 4px; border-top: 2px solid #000; margin-top: 8px; }
  .pago { text-align: right; font-size: 13px; color: #060; margin-top: 8px; font-weight: 600; }
  .footer { text-align: center; font-size: 11px; color: #888; margin-top: 24px; }
  @media print { body { padding: 8px; } @page { margin: 10mm; } }
</style>
</head>
<body>
  <h1>El Corral Roses</h1>
  <div class="sub"><strong>${escapeHtml(tableName)}</strong> · ${fecha} ${hora} · ${totalQty} platos</div>
  ${alerts.length > 0 ? `<div class="alerts">
    <div class="lbl">⚠ Alerta de mesa</div>
    ${alerts.map((a) => `<div class="txt">${escapeHtml(a)}</div>`).join("")}
  </div>` : ""}
  ${personEntries.map(([name, group]) => `
    <div class="person">
      <div class="person-head">
        <span class="person-name">${escapeHtml(name)}</span>
        <span class="person-total">${group.total.toFixed(2)} €</span>
      </div>
      ${group.items.map((it) => `
        <div class="line">
          <span class="line-qty">${it.quantity}x</span>
          <span class="line-name">${escapeHtml(it.product_name)}${it.notes ? `<div class="notes">${escapeHtml(it.notes)}</div>` : ""}</span>
          <span class="line-price">${(Number(it.price) * it.quantity).toFixed(2)} €</span>
        </div>
      `).join("")}
    </div>
  `).join("")}
  <div class="total"><span>Total</span><span>${total.toFixed(2)} €</span></div>
  ${allPaid && paidMethod ? `<div class="pago">✓ Pagado · ${methodLabel(paidMethod)}</div>` : ""}
  <div class="footer">Gracias por su visita</div>
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 200); window.onafterprint = function() { window.close(); }; }<\/script>
</body>
</html>`

  const w = window.open("", "_blank", "width=720,height=900")
  if (!w) { toast.error("Permite las ventanas emergentes para imprimir"); return }
  w.document.open()
  w.document.write(html)
  w.document.close()
}

export default function AdminPedidos() {
  const { signOut } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [billTable, setBillTable] = useState<{ id: string; name: string } | null>(null)
  const [search, setSearch] = useState("")
  const [maintenance, setMaintenance] = useState(false)
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)
  const [rtStatus, setRtStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")

  const isToday = date === new Date().toISOString().slice(0, 10)

  const fetchData = async () => {
    const day = new Date(date)
    const { data, error } = await supabase
      .from("order_items")
      .select("id, product_name, category_name, quantity, notes, guest_name, price, status, payment_method, table_alert, created_at, table_id, tables(name, code)")
      .gte("created_at", startOfDayISO(day))
      .lte("created_at", endOfDayISO(day))
      .order("created_at", { ascending: true })
    if (error) { toast.error("Error al cargar pedidos"); setLoading(false); return }
    setRows((data as any) ?? [])
    setLoading(false)
  }

  const fetchMaintenance = async () => {
    const { data } = await supabase.from("app_settings").select("maintenance_mode").eq("id", "main").single()
    if (data) setMaintenance(!!data.maintenance_mode)
  }

  const toggleMaintenance = async () => {
    const next = !maintenance
    if (next && !confirm("¿Pausar la carta? Los clientes verán 'Volvemos enseguida' y no podrán hacer pedidos nuevos.")) return
    setMaintenanceLoading(true)
    const { error } = await supabase
      .from("app_settings")
      .update({ maintenance_mode: next, updated_at: new Date().toISOString() })
      .eq("id", "main")
    setMaintenanceLoading(false)
    if (error) { toast.error("Error al cambiar modo mantenimiento"); return }
    setMaintenance(next)
    toast.success(next ? "Carta pausada" : "Carta reactivada")
  }

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [date])

  useEffect(() => {
    if (!isToday) {
      setRtStatus("disconnected")
      return
    }
    setRtStatus("connecting")
    const ch = supabase
      .channel("admin-pedidos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => fetchData())
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRtStatus("connected")
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setRtStatus("disconnected")
        else setRtStatus("connecting")
      })
    return () => { supabase.removeChannel(ch) }
  }, [date, isToday])

  useEffect(() => {
    fetchMaintenance()
    const ch = supabase
      .channel("admin-app-settings")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "app_settings" }, (payload: any) => {
        if (payload.new?.id === "main") setMaintenance(!!payload.new.maintenance_mode)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const visible = rows.filter((r) => r.status !== "pending_submit")
  const byTable = visible.reduce<Record<string, Row[]>>((acc, r) => {
    const key = r.tables?.name ?? "Sin mesa"
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})
  const allTableEntries = Object.entries(byTable).sort(([a], [b]) => {
    const na = parseInt(a.replace(/\D/g, ""), 10) || 0
    const nb = parseInt(b.replace(/\D/g, ""), 10) || 0
    return na - nb
  })
  const showSearch = allTableEntries.length >= 6
  const q = search.trim().toLowerCase()
  const tableEntries = q ? allTableEntries.filter(([name]) => name.toLowerCase().includes(q)) : allTableEntries
  const grandTotal = visible.reduce((s, r) => s + Number(r.price) * r.quantity, 0)
  const grandCount = visible.reduce((s, r) => s + r.quantity, 0)

  return (
    <div className="min-h-screen p-4 md:p-6">
      {maintenance && (
        <div className="mb-4 bg-orange-100 dark:bg-orange-950/40 border-2 border-orange-500 rounded-lg p-3 flex items-center gap-3">
          <PowerOff className="w-5 h-5 text-orange-600 shrink-0" />
          <div className="flex-1 text-sm">
            <strong className="text-orange-800 dark:text-orange-300">Carta pausada.</strong>{" "}
            <span className="text-orange-700 dark:text-orange-400">Los clientes ven "Volvemos enseguida" y no pueden hacer pedidos.</span>
          </div>
          <Button size="sm" variant="outline" onClick={toggleMaintenance} disabled={maintenanceLoading}>
            Reactivar
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl">Pedidos del día</h1>
            {isToday && (
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  rtStatus === "connected" ? "bg-green-500"
                  : rtStatus === "connecting" ? "bg-yellow-500 animate-pulse"
                  : "bg-red-500 animate-pulse"
                }`}
                title={
                  rtStatus === "connected" ? "Auto-actualización activa"
                  : rtStatus === "connecting" ? "Conectando..."
                  : "Sin conexión en tiempo real · usa el botón de refrescar"
                }
              />
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {grandCount} platos · {allTableEntries.length} mesas activas · {grandTotal.toFixed(2)} €
            {isToday && rtStatus === "disconnected" && <span className="text-destructive ml-2">· Sin tiempo real</span>}
          </span>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Link to="/admin/stats">
            <Button variant="outline" size="sm"><BarChart3 className="w-4 h-4 mr-1" /> Stats</Button>
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
          <Button
            variant={maintenance ? "default" : "outline"}
            size="sm"
            onClick={toggleMaintenance}
            disabled={maintenanceLoading}
            className={maintenance ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
            title={maintenance ? "Carta pausada · click para reactivar" : "Pausar carta"}
          >
            {maintenance ? <PowerOff className="w-4 h-4 mr-1" /> : <Power className="w-4 h-4 mr-1" />}
            {maintenance ? "Pausada" : "Pausar carta"}
          </Button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded-md border border-input bg-background text-sm" />
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Salir</Button>
        </div>
      </div>

      {showSearch && (
        <div className="mb-4 relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar mesa..."
            className="w-full pl-9 pr-9 py-2 rounded-md border border-input bg-background text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center text-muted-foreground py-20">Cargando...</div>
      ) : allTableEntries.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">No hay pedidos para esta fecha</div>
      ) : tableEntries.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">Ninguna mesa coincide con "{search}"</div>
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
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <Button size="sm" variant="outline" onClick={() => printComanda(tableName, items)} title="Imprimir comanda">
                          <Printer className="w-3.5 h-3.5 mr-1" /> Imprimir
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setBillTable({ id: items[0].table_id, name: tableName })}>
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
          onOpenChange={(v) => { if (!v) { setBillTable(null); fetchData() } }}
          isAdmin
        />
      )}
    </div>
  )
}