import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { LogOut, RefreshCw, Receipt, AlertTriangle, Printer, Search, X, Power, PowerOff, Trash2, ChevronDown, ChevronUp, Lock, Loader2, LockOpen } from "lucide-react"
import { BillSplit } from "@/components/restaurant/BillSplit"
import { AdminNav } from "@/components/admin/AdminNav"

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

type Closing = {
  id: string
  number: number
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

function buildClosingEmail(closingNumber: number, date: string, items: Row[]): { subject: string; html: string } {
  const total = items.reduce((s, r) => s + Number(r.price) * r.quantity, 0)
  const byMethod: Record<string, number> = { efectivo: 0, tarjeta: 0, bizum: 0, transferencia: 0 }
  for (const it of items) {
    if (it.payment_method && byMethod[it.payment_method] !== undefined) {
      byMethod[it.payment_method] += Number(it.price) * it.quantity
    }
  }
  const byTable: Record<string, Row[]> = {}
  for (const it of items) {
    const k = it.tables?.name ?? "Sin mesa"
    if (!byTable[k]) byTable[k] = []
    byTable[k].push(it)
  }
  const subject = `Cierre Z #${closingNumber} · ${date} · Corral Roses`
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #000; padding: 20px;">
  <h1 style="margin: 0 0 4px 0; color: #b8860b;">Corral Roses</h1>
  <p style="color: #666; font-size: 12px; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 2px;">Cierre de caja</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border-top: 2px solid #000; border-bottom: 2px solid #000;">
    <tr><td style="padding: 6px 4px; color: #666;">Número de cierre</td><td style="padding: 6px 4px; text-align: right; font-weight: bold;">#${closingNumber}</td></tr>
    <tr><td style="padding: 6px 4px; color: #666;">Fecha</td><td style="padding: 6px 4px; text-align: right; font-weight: bold;">${date}</td></tr>
    <tr><td style="padding: 6px 4px; color: #666;">Tickets incluidos</td><td style="padding: 6px 4px; text-align: right; font-weight: bold;">${items.length}</td></tr>
    <tr><td style="padding: 6px 4px; color: #666;">Total cobrado</td><td style="padding: 6px 4px; text-align: right; font-size: 22px; font-weight: bold; color: #b8860b;">${total.toFixed(2)} €</td></tr>
  </table>
  <h2 style="font-size: 14px; margin: 20px 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Por método de pago</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr style="background: #f7f7f7;"><td style="padding: 8px;">💵 Efectivo</td><td style="padding: 8px; text-align: right; font-weight: bold;">${byMethod.efectivo.toFixed(2)} €</td></tr>
    <tr><td style="padding: 8px;">💳 Tarjeta</td><td style="padding: 8px; text-align: right; font-weight: bold;">${byMethod.tarjeta.toFixed(2)} €</td></tr>
    <tr style="background: #f7f7f7;"><td style="padding: 8px;">📱 Bizum</td><td style="padding: 8px; text-align: right; font-weight: bold;">${byMethod.bizum.toFixed(2)} €</td></tr>
    <tr><td style="padding: 8px;">🔁 Transferencia</td><td style="padding: 8px; text-align: right; font-weight: bold;">${byMethod.transferencia.toFixed(2)} €</td></tr>
  </table>
  <h2 style="font-size: 14px; margin: 20px 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Detalle por mesa</h2>
  ${Object.entries(byTable).map(([name, rows]) => {
    const tTotal = rows.reduce((s,r) => s+Number(r.price)*r.quantity, 0)
    return `<div style="margin-bottom: 14px; border: 1px solid #ddd; border-radius: 6px; padding: 10px 12px;">
      <div style="display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 6px;">
        <span>${escapeHtml(name)}</span><span style="color: #b8860b;">${tTotal.toFixed(2)} €</span>
      </div>
      ${rows.map(r => `<div style="display: flex; justify-content: space-between; font-size: 13px; padding: 2px 0;">
        <span><strong style="color: #b8860b;">${r.quantity}x</strong> ${escapeHtml(r.product_name)}${r.payment_method ? ` <em style="color: #888;">· ${methodLabel(r.payment_method)}</em>` : ""}</span>
        <span>${(Number(r.price)*r.quantity).toFixed(2)} €</span>
      </div>`).join("")}
    </div>`
  }).join("")}
  <p style="margin-top: 30px; color: #888; font-size: 11px; text-align: center;">Email automático del sistema de pedidos · Corral Roses</p>
</body></html>`
  return { subject, html }
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [closingModal, setClosingModal] = useState(false)
  const [closingBusy, setClosingBusy] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [existingClosing, setExistingClosing] = useState<Closing | null>(null)

  const isToday = date === new Date().toISOString().slice(0, 10)

  const fetchClosing = async (d: string): Promise<Closing | null> => {
    const { data } = await supabase
      .from("cash_closings")
      .select("id, number")
      .eq("date", d)
      .maybeSingle()
    const closing = data ?? null
    setExistingClosing(closing)
    return closing
  }

  const fetchData = async (closing: Closing | null = existingClosing) => {
    const day = new Date(date)
    const query = supabase
      .from("order_items")
      .select("id, product_name, category_name, quantity, notes, guest_name, price, status, payment_method, table_alert, created_at, table_id, tables(name, code)")
      .gte("created_at", startOfDayISO(day))
      .lte("created_at", endOfDayISO(day))
      .is("deleted_at", null)
      .order("created_at", { ascending: true })

    if (!closing) {
      query.is("closing_id", null)
    }

    const { data, error } = await query
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

  const deleteItem = async (item: Row) => {
    const reason = prompt(`Borrar "${item.product_name}" de ${item.tables?.name ?? "la mesa"}\n\nMotivo (queda registrado):`, "")
    if (reason === null) return
    const trimmed = reason.trim() || "Sin motivo"
    setDeletingId(item.id)
    const { error } = await supabase
      .from("order_items")
      .update({ deleted_at: new Date().toISOString(), deleted_reason: trimmed })
      .eq("id", item.id)
    setDeletingId(null)
    if (error) { toast.error("Error al borrar"); return }
    setRows((prev) => prev.filter((r) => r.id !== item.id))
    toast.success("Pedido borrado")
  }

  const toggleExpand = (tableName: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(tableName)) next.delete(tableName)
      else next.add(tableName)
      return next
    })
  }

  const handleCloseDay = async () => {
    const visibleRows = rows.filter((r) => r.status === "pagado")
    if (visibleRows.length === 0) {
      toast.error("No hay pedidos pagados para cerrar")
      return
    }
    setClosingBusy(true)

    const total = visibleRows.reduce((s, r) => s + Number(r.price) * r.quantity, 0)
    const byMethod: Record<string, number> = { efectivo: 0, tarjeta: 0, bizum: 0, transferencia: 0 }
    for (const r of visibleRows) {
      if (r.payment_method && byMethod[r.payment_method] !== undefined) {
        byMethod[r.payment_method] += Number(r.price) * r.quantity
      }
    }
    const tableSet = new Set(visibleRows.map((r) => r.table_id))

    const { data: closing, error: insErr } = await supabase
      .from("cash_closings")
      .insert({ date, total, by_method: byMethod, ticket_count: tableSet.size })
      .select("id, number")
      .single()

    if (insErr || !closing) {
      setClosingBusy(false)
      toast.error("Error al crear el cierre")
      return
    }

    const ids = visibleRows.map((r) => r.id)
    const { error: upErr } = await supabase
      .from("order_items")
      .update({ closing_id: closing.id })
      .in("id", ids)

    if (upErr) {
      await supabase.from("cash_closings").delete().eq("id", closing.id)
      setClosingBusy(false)
      toast.error("Error al vincular pedidos al cierre")
      return
    }

    const { subject, html } = buildClosingEmail(closing.number as number, date, visibleRows)
    let emailOk = true
    try {
      const res = await fetch("/api/send-closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html }),
      })
      if (!res.ok) emailOk = false
    } catch {
      emailOk = false
    }

    setClosingBusy(false)
    setClosingModal(false)
    setExistingClosing({ id: closing.id, number: closing.number as number })
    if (emailOk) {
      toast.success(`Cierre Z #${closing.number} creado · Email enviado · ${total.toFixed(2)} €`)
    } else {
      toast.warning(`Cierre Z #${closing.number} creado, pero el email falló. Revisa Vercel/Resend.`)
    }
    fetchData()
  }

  const handleReopenDay = async () => {
    if (!existingClosing) return
    if (!confirm(`¿Reabrir el cierre Z #${existingClosing.number}? Los pedidos volverán a la vista normal y podrás modificarlos.`)) return
    setClosingBusy(true)

    const { error: upErr } = await supabase
      .from("order_items")
      .update({ closing_id: null })
      .eq("closing_id", existingClosing.id)

    if (upErr) {
      setClosingBusy(false)
      toast.error("Error al reabrir pedidos")
      return
    }

    const { error: delErr } = await supabase
      .from("cash_closings")
      .delete()
      .eq("id", existingClosing.id)

    if (delErr) {
      setClosingBusy(false)
      toast.error("Error al eliminar el cierre")
      return
    }

    setExistingClosing(null)
    setClosingBusy(false)
    toast.success(`Cierre Z #${existingClosing.number} reabierto`)
    fetchData()
  }

  useEffect(() => {
    setLoading(true)
    fetchClosing(date).then((c) => fetchData(c))
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
  const paidRows = visible.filter((r) => r.status === "pagado")
  const paidTotal = paidRows.reduce((s, r) => s + Number(r.price) * r.quantity, 0)
  const paidMethodsPreview: Record<string, number> = { efectivo: 0, tarjeta: 0, bizum: 0, transferencia: 0 }
  for (const r of paidRows) {
    if (r.payment_method && paidMethodsPreview[r.payment_method] !== undefined) {
      paidMethodsPreview[r.payment_method] += Number(r.price) * r.quantity
    }
  }

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

      {existingClosing && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-400 rounded-lg p-3 flex items-center gap-3">
          <Lock className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="flex-1 text-sm">
            <strong className="text-blue-800 dark:text-blue-300">Caja cerrada · Cierre Z #{existingClosing.number}</strong>
            <span className="text-blue-700 dark:text-blue-400 ml-2">Mostrando todos los pedidos del día.</span>
          </div>
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
          <AdminNav current="pedidos" />
          {existingClosing ? (
            <Button
              size="sm"
              onClick={handleReopenDay}
              disabled={closingBusy}
              variant="outline"
              className="border-blue-400 text-blue-700 hover:bg-blue-50"
              title={`Reabrir cierre Z #${existingClosing.number}`}
            >
              {closingBusy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <LockOpen className="w-4 h-4 mr-1" />}
              Reabrir caja
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setClosingModal(true)}
              disabled={paidRows.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
              title={paidRows.length === 0 ? "No hay pedidos pagados sin cerrar" : "Cerrar caja del día"}
            >
              <Lock className="w-4 h-4 mr-1" /> Cerrar caja
            </Button>
          )}
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
          <Button variant="outline" size="sm" onClick={() => fetchData()}><RefreshCw className="w-4 h-4" /></Button>
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
        <div className="text-center text-muted-foreground py-20">No hay pedidos activos para esta fecha</div>
      ) : tableEntries.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">Ninguna mesa coincide con "{search}"</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tableEntries.map(([tableName, items]) => {
              const total = items.reduce((s, r) => s + Number(r.price) * r.quantity, 0)
              const count = items.reduce((s, r) => s + r.quantity, 0)
              const allPaid = items.every((r) => r.status === "pagado")
              const allServed = items.every((r) => r.status === "servido" || r.status === "pagado")
              const paidMethod = allPaid ? items.find((r) => r.payment_method)?.payment_method ?? null : null
              const alerts = Array.from(new Set(items.map((r) => r.table_alert).filter(Boolean) as string[]))
              const isOpen = expanded.has(tableName)
              return (
                <Card key={tableName}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => toggleExpand(tableName)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left hover:bg-muted/30 rounded px-2 py-1 -mx-2"
                        title={isOpen ? "Contraer" : "Expandir"}
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
                        <h2 className="font-display text-xl truncate">{tableName}</h2>
                        <span className="text-xs text-muted-foreground shrink-0">{count} {count === 1 ? "plato" : "platos"}</span>
                      </button>
                      <span className="font-semibold text-primary shrink-0">{total.toFixed(2)} €</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${allPaid ? "bg-green-100 text-green-800" : allServed ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {allPaid ? `Pagada${paidMethod ? ` · ${methodLabel(paidMethod)}` : ""}` : allServed ? "Servida" : "Abierta"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => printComanda(tableName, items)} title="Imprimir comanda" className="h-7 px-2">
                          <Printer className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setBillTable({ id: items[0].table_id, name: tableName })} className="h-7 px-2">
                          <Receipt className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {alerts.length > 0 && (
                      <div className="mt-3 bg-red-100 dark:bg-red-950/50 border-2 border-red-500 rounded-md p-2 space-y-1">
                        {alerts.map((a, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-red-900 dark:text-red-200 leading-tight">{a}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isOpen && (
                      <div className="mt-3 pt-3 border-t space-y-1.5 text-sm">
                        {items.map((r) => (
                          <div key={r.id} className="flex items-start justify-between gap-2 group">
                            <span className="flex-1 min-w-0">
                              <span className="font-semibold text-primary">{r.quantity}x</span>{" "}
                              {r.product_name}
                              {r.guest_name && <span className="text-muted-foreground"> · {r.guest_name}</span>}
                              {r.notes && <div className="text-xs italic text-muted-foreground">📝 {r.notes}</div>}
                            </span>
                            <span className="shrink-0">{(Number(r.price) * r.quantity).toFixed(2)} €</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem(r)}
                              disabled={deletingId === r.id}
                              className="h-6 w-6 p-0 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Borrar pedido"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <div className="mt-6 p-4 bg-primary/10 rounded-lg flex justify-between items-center">
            <span className="font-display text-xl">Total del día {existingClosing ? `· Cierre Z #${existingClosing.number}` : "(sin cerrar)"}</span>
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

      <Dialog open={closingModal} onOpenChange={(v) => { if (!closingBusy) setClosingModal(v) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar caja del día · {date}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Se incluirán <strong className="text-foreground">{paidRows.length}</strong> pedidos pagados.
              Los pedidos quedarán archivados y se enviará un email a las direcciones configuradas.
            </p>
            <div className="bg-muted/40 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">💵 Efectivo</span>
                <span className="font-semibold">{paidMethodsPreview.efectivo.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">💳 Tarjeta</span>
                <span className="font-semibold">{paidMethodsPreview.tarjeta.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">📱 Bizum</span>
                <span className="font-semibold">{paidMethodsPreview.bizum.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">🔁 Transferencia</span>
                <span className="font-semibold">{paidMethodsPreview.transferencia.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-display">Total a cerrar</span>
                <span className="font-display text-xl text-primary">{paidTotal.toFixed(2)} €</span>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setClosingModal(false)} disabled={closingBusy} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleCloseDay} disabled={closingBusy} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                {closingBusy ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Cerrando...</> : "Confirmar cierre"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}