import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { LogOut, RefreshCw, ClipboardList, BarChart3, ImageIcon, Euro, QrCode, Plus, Trash2, Eye, EyeOff, Check, AlertTriangle, Table as TableIcon } from "lucide-react"
import { Link } from "react-router-dom"

type Mesa = { id: string; name: string; code: string; is_active: boolean }

function sortMesas(list: Mesa[]): Mesa[] {
  return [...list].sort((a, b) => {
    const na = parseInt(a.code.replace(/\D/g, ""), 10) || 0
    const nb = parseInt(b.code.replace(/\D/g, ""), 10) || 0
    return na - nb
  })
}

function MesaRow({ mesa, ordersCount, onUpdate, onToggleActive, onDelete }: {
  mesa: Mesa
  ordersCount: number
  onUpdate: (patch: Partial<Mesa>) => Promise<void>
  onToggleActive: () => void
  onDelete: () => void
}) {
  const [name, setName] = useState(mesa.name)
  const [code, setCode] = useState(mesa.code)
  const [savedFlag, setSavedFlag] = useState<"name" | "code" | null>(null)

  useEffect(() => { setName(mesa.name) }, [mesa.name])
  useEffect(() => { setCode(mesa.code) }, [mesa.code])

  const saveName = async () => {
    const trimmed = name.trim()
    if (!trimmed) { setName(mesa.name); return }
    if (trimmed === mesa.name) return
    await onUpdate({ name: trimmed })
    setSavedFlag("name")
    setTimeout(() => setSavedFlag(null), 1500)
  }

  const saveCode = async () => {
    const trimmed = code.trim().toLowerCase()
    if (!trimmed) { setCode(mesa.code); return }
    if (trimmed === mesa.code) return
    if (!/^[a-z0-9-]+$/.test(trimmed)) { toast.error("Código solo puede tener letras, números y guiones"); setCode(mesa.code); return }
    if (!confirm(`¿Cambiar el código a "${trimmed}"?\nLos QRs ya impresos con el código antiguo dejarán de funcionar.`)) { setCode(mesa.code); return }
    await onUpdate({ code: trimmed })
    setSavedFlag("code")
    setTimeout(() => setSavedFlag(null), 1500)
  }

  return (
    <div className={`flex items-center gap-2 p-3 rounded-md border ${!mesa.is_active ? "opacity-50 bg-muted/30" : ""}`}>
      <Button size="sm" variant="ghost" onClick={onToggleActive} className={`h-8 w-8 p-0 shrink-0 ${mesa.is_active ? "text-green-600" : "text-muted-foreground"}`} title={mesa.is_active ? "Activa · click para desactivar" : "Inactiva · click para activar"}>
        {mesa.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </Button>
      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="relative">
          <input
            type="text" value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
            placeholder="Nombre"
            className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm font-medium"
          />
          {savedFlag === "name" && <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />}
        </div>
        <div className="relative">
          <input
            type="text" value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={saveCode}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
            placeholder="código (ej: mesa-1)"
            className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm font-mono"
          />
          {savedFlag === "code" && <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />}
        </div>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 mx-1 hidden md:inline">
        {ordersCount === 0 ? "sin pedidos" : `${ordersCount} pedido${ordersCount === 1 ? "" : "s"}`}
      </span>
      <Button size="sm" variant="ghost" onClick={onDelete} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" title="Eliminar mesa">
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  )
}

export default function AdminMesas() {
  const { signOut } = useAuth()
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const [{ data: tablesData, error: tErr }, { data: ordersData }] = await Promise.all([
      supabase.from("tables").select("id, name, code, is_active"),
      supabase.from("order_items").select("table_id"),
    ])
    if (tErr) { toast.error("Error al cargar mesas"); setLoading(false); return }
    setMesas(sortMesas(((tablesData as any) ?? []) as Mesa[]))
    const counts: Record<string, number> = {}
    for (const o of (ordersData as any) ?? []) {
      if (o.table_id) counts[o.table_id] = (counts[o.table_id] || 0) + 1
    }
    setOrderCounts(counts)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const updateMesa = async (id: string, patch: Partial<Mesa>) => {
    const { error } = await supabase.from("tables").update(patch).eq("id", id)
    if (error) {
      if (error.code === "23505") { toast.error("Ese código ya está en uso por otra mesa") }
      else { toast.error("Error al guardar") }
      fetchData()
      return
    }
    setMesas((prev) => sortMesas(prev.map((m) => m.id === id ? { ...m, ...patch } : m)))
    toast.success("Mesa actualizada")
  }

  const toggleActive = async (mesa: Mesa) => {
    const next = !mesa.is_active
    const { error } = await supabase.from("tables").update({ is_active: next }).eq("id", mesa.id)
    if (error) { toast.error("Error al actualizar"); return }
    setMesas((prev) => prev.map((m) => m.id === mesa.id ? { ...m, is_active: next } : m))
    toast.success(next ? "Mesa activada" : "Mesa desactivada")
  }

  const deleteMesa = async (mesa: Mesa) => {
    const count = orderCounts[mesa.id] || 0
    if (count > 0) {
      toast.error(`No se puede eliminar "${mesa.name}": tiene ${count} pedidos en histórico. Desactívala en su lugar.`)
      return
    }
    if (!confirm(`¿Eliminar "${mesa.name}" definitivamente? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from("tables").delete().eq("id", mesa.id)
    if (error) { toast.error("Error al eliminar"); return }
    setMesas((prev) => prev.filter((m) => m.id !== mesa.id))
    toast.success("Mesa eliminada")
  }

  const addMesa = async () => {
    setAdding(true)
    const nums = mesas.map((m) => parseInt(m.code.replace(/\D/g, ""), 10)).filter((n) => !isNaN(n))
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1
    const newCode = `mesa-${next}`
    const newName = `Mesa ${next}`

    const { data: existing } = await supabase.from("tables").select("id").eq("code", newCode).maybeSingle()
    if (existing) { toast.error("Ese código ya existe, recarga la página"); setAdding(false); return }

    const { data, error } = await supabase
      .from("tables")
      .insert({ name: newName, code: newCode, is_active: true })
      .select()
      .single()
    setAdding(false)
    if (error || !data) { toast.error("Error al crear la mesa"); return }
    setMesas((prev) => sortMesas([...prev, data as Mesa]))
    toast.success(`${newName} creada`)
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl flex items-center gap-2">
            <TableIcon className="w-7 h-7 text-primary" /> Mesas
          </h1>
          <span className="text-sm text-muted-foreground">{mesas.length} mesas · {mesas.filter((m) => m.is_active).length} activas</span>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Link to="/admin/pedidos"><Button variant="outline" size="sm"><ClipboardList className="w-4 h-4 mr-1" /> Pedidos</Button></Link>
          <Link to="/admin/stats"><Button variant="outline" size="sm"><BarChart3 className="w-4 h-4 mr-1" /> Stats</Button></Link>
          <Link to="/admin/imagenes"><Button variant="outline" size="sm"><ImageIcon className="w-4 h-4 mr-1" /> Imágenes</Button></Link>
          <Link to="/admin/precios"><Button variant="outline" size="sm"><Euro className="w-4 h-4 mr-1" /> Precios</Button></Link>
          <Link to="/admin/qrs"><Button variant="outline" size="sm"><QrCode className="w-4 h-4 mr-1" /> QRs</Button></Link>
          <Button size="sm" onClick={addMesa} disabled={adding}>
            <Plus className="w-4 h-4 mr-1" /> Añadir mesa
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Salir</Button>
        </div>
      </div>

      <div className="mb-4 p-3 rounded-md border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-xs flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          Cambiar el <strong>código</strong> de una mesa rompe los QRs ya impresos para esa mesa. Las mesas con pedidos en histórico no se pueden eliminar (desactívalas en su lugar para que dejen de aparecer en /admin/qrs).
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-20">Cargando...</div>
      ) : mesas.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">No hay mesas. Añade una para empezar.</div>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {mesas.map((m) => (
                <MesaRow
                  key={m.id}
                  mesa={m}
                  ordersCount={orderCounts[m.id] || 0}
                  onUpdate={(patch) => updateMesa(m.id, patch)}
                  onToggleActive={() => toggleActive(m)}
                  onDelete={() => deleteMesa(m)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}