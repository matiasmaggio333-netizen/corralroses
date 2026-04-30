import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Bell, Lock, LogOut, Volume2, VolumeX } from "lucide-react"

const COCINA_PIN = "2580"
const STORAGE_KEY = "corral_cocina_auth"
const SOUND_KEY = "corral_cocina_sound"

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4)
    osc.start(); osc.stop(ctx.currentTime + 0.4)
  } catch {}
}

function playUrgentBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const t0 = ctx.currentTime
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = "square"
      osc.frequency.setValueAtTime(1100, t0 + i * 0.2)
      gain.gain.setValueAtTime(0.0001, t0 + i * 0.2)
      gain.gain.exponentialRampToValueAtTime(0.35, t0 + i * 0.2 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.2 + 0.15)
      osc.start(t0 + i * 0.2); osc.stop(t0 + i * 0.2 + 0.18)
    }
  } catch {}
}

type ItemRow = {
  id: string
  product_name: string
  category_name: string
  quantity: number
  notes: string | null
  guest_name: string | null
  options: any
  status: "en_cocina" | "en_preparacion" | "servido"
  created_at: string
  table_id: string
  tables: { name: string; code: string } | null
}

type CallRow = {
  id: string
  table_id: string
  reason: string | null
  created_at: string
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

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === COCINA_PIN) {
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
        <h1 className="font-display text-2xl">Acceso a cocina</h1>
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

export default function Cocina() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(STORAGE_KEY) === "1")
  const [items, setItems] = useState<ItemRow[]>([])
  const [calls, setCalls] = useState<CallRow[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now())
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) !== "0")
  const [rtStatus, setRtStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const knownIds = useRef<Set<string>>(new Set())
  const knownCallIds = useRef<Set<string>>(new Set())

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("order_items")
      .select("id, product_name, category_name, quantity, notes, guest_name, options, status, created_at, table_id, tables(name, code)")
      .in("status", ["en_cocina", "en_preparacion"])
      .order("created_at", { ascending: true })
    if (error) {
      toast.error("Error al cargar pedidos")
      return
    }
    const newItems = (data as any) ?? []
    if (knownIds.current.size > 0) {
      const incomingIds = new Set<string>(newItems.map((i: any) => i.id))
      const hasNew = [...incomingIds].some((id) => !knownIds.current.has(id as string))
      if (hasNew && soundOn) playBeep()
    }
    knownIds.current = new Set(newItems.map((i: any) => i.id))
    setItems(newItems)
    setLoading(false)
  }

  const fetchCalls = async () => {
    const { data } = await supabase
      .from("waiter_calls")
      .select("id, table_id, reason, created_at, tables(name, code)")
      .eq("attended", false)
      .order("created_at", { ascending: true })
    const newCalls = (data as any) ?? []
    if (knownCallIds.current.size > 0) {
      const incomingIds = new Set<string>(newCalls.map((i: any) => i.id))
      const hasNew = [...incomingIds].some((id) => !knownCallIds.current.has(id as string))
      if (hasNew && soundOn) playUrgentBeep()
    }
    knownCallIds.current = new Set(newCalls.map((i: any) => i.id))
    setCalls(newCalls)
  }

  useEffect(() => {
    if (!authed) return
    fetchItems()
    fetchCalls()
    const ch = supabase
      .channel("cocina")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => fetchItems())
      .on("postgres_changes", { event: "*", schema: "public", table: "waiter_calls" }, () => fetchCalls())
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRtStatus("connected")
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setRtStatus("disconnected")
        else setRtStatus("connecting")
      })
    const tick = setInterval(() => setNow(Date.now()), 30000)
    return () => {
      supabase.removeChannel(ch)
      clearInterval(tick)
    }
  }, [authed])

  const startPreparing = async (id: string) => {
    const { error } = await supabase.from("order_items").update({ status: "en_preparacion" }).eq("id", id)
    if (error) toast.error("Error al actualizar estado")
  }

  const markServed = async (id: string) => {
    const { error } = await supabase.from("order_items").update({ status: "servido" }).eq("id", id)
    if (error) toast.error("Error al marcar servido")
  }

  const attendCall = async (id: string) => {
    const { error } = await supabase.from("waiter_calls").update({ attended: true }).eq("id", id)
    if (error) toast.error("Error al atender llamada")
  }

  const toggleSound = () => {
    setSoundOn((v) => {
      const nv = !v
      localStorage.setItem(SOUND_KEY, nv ? "1" : "0")
      return nv
    })
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuthed(false)
  }

  if (!authed) return <PinGate onUnlock={() => setAuthed(true)} />

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
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl">Cocina</h1>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                rtStatus === "connected" ? "bg-green-500"
                : rtStatus === "connecting" ? "bg-yellow-500 animate-pulse"
                : "bg-red-500 animate-pulse"
              }`}
              title={
                rtStatus === "connected" ? "Conectado en tiempo real"
                : rtStatus === "connecting" ? "Conectando..."
                : "Desconectado · revisa el WiFi"
              }
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {items.length} pendientes · {calls.length} avisos
            {rtStatus === "disconnected" && <span className="text-destructive ml-2">· Sin conexión</span>}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleSound}>
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-1" /> Salir
          </Button>
        </div>
      </div>

      {calls.length > 0 && (
        <div className="mb-6 space-y-2">
          {calls.map((c) => (
            <div
              key={c.id}
              className="bg-destructive/15 border-2 border-destructive rounded-lg p-3 flex items-center gap-3 animate-pulse"
            >
              <Bell className="w-6 h-6 text-destructive shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg leading-tight">
                  {c.tables?.name ?? "Mesa"} llama al camarero
                </div>
                <div className="text-sm text-muted-foreground">
                  {c.reason ?? "Sin motivo"} · {timeAgo(c.created_at, now)}
                </div>
              </div>
              <Button size="sm" variant="destructive" onClick={() => attendCall(c.id)}>
                Atender
              </Button>
            </div>
          ))}
        </div>
      )}

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
                      <div
                        key={it.id}
                        className={`flex items-start gap-3 rounded p-1 ${it.status === "en_preparacion" ? "bg-green-50 dark:bg-green-950/30" : ""}`}
                      >
                        <span className="font-bold text-primary text-lg shrink-0">{it.quantity}x</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold leading-tight">{it.product_name}</div>
                          {Array.isArray(it.options) && it.options.length > 0 && (
                            <div className="text-sm font-medium mt-0.5">
                              {it.options.map((o: any) => o.quantity ? `${o.name} x${o.quantity}` : o.name).join(" · ")}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {it.category_name} · {timeAgo(it.created_at, now)}
                          </div>
                          {it.guest_name && <div className="text-xs">👤 {it.guest_name}</div>}
                          {it.notes && <div className="text-xs italic mt-1 text-accent">📝 {it.notes}</div>}
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          {it.status === "en_cocina" ? (
                            <Button size="sm" variant="outline" onClick={() => startPreparing(it.id)}>
                              Empezar
                            </Button>
                          ) : (
                            <span className="text-xs text-center text-green-700 font-semibold">En preparación</span>
                          )}
                          <Button size="sm" onClick={() => markServed(it.id)}>Servido</Button>
                        </div>
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