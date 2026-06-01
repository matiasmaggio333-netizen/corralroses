import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { LogOut, RefreshCw, Plus, Trash2, Check, Layers, ArrowUp, ArrowDown, Languages } from "lucide-react"
import { AdminNav } from "@/components/admin/AdminNav"

type Categoria = {
  id: string
  name: string
  name_ca: string | null
  name_en: string | null
  name_fr: string | null
  name_de: string | null
  name_nl: string | null
  order_index: number
}

const LANGS: { code: "ca" | "en" | "fr" | "de" | "nl"; deeplCode: string; label: string }[] = [
  { code: "ca", deeplCode: "CA", label: "Catalán" },
  { code: "en", deeplCode: "EN-US", label: "Inglés" },
  { code: "fr", deeplCode: "FR", label: "Francés" },
  { code: "de", deeplCode: "DE", label: "Alemán" },
  { code: "nl", deeplCode: "NL", label: "Holandés" },
]

async function translateOne(text: string, target_lang: string): Promise<string | null> {
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target_lang }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.translations?.[0]?.text ?? data.text ?? null
  } catch {
    return null
  }
}

function CategoriaRow({ cat, productCount, isFirst, isLast, onUpdate, onMove, onDelete, busy }: {
  cat: Categoria
  productCount: number
  isFirst: boolean
  isLast: boolean
  onUpdate: (patch: Partial<Categoria>) => Promise<void>
  onMove: (direction: "up" | "down") => void
  onDelete: () => void
  busy: boolean
}) {
  const [name, setName] = useState(cat.name)
  const [translations, setTranslations] = useState({
    ca: cat.name_ca ?? "",
    en: cat.name_en ?? "",
    fr: cat.name_fr ?? "",
    de: cat.name_de ?? "",
    nl: cat.name_nl ?? "",
  })
  const [expanded, setExpanded] = useState(false)
  const [savedFlag, setSavedFlag] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)

  useEffect(() => { setName(cat.name) }, [cat.name])
  useEffect(() => {
    setTranslations({
      ca: cat.name_ca ?? "",
      en: cat.name_en ?? "",
      fr: cat.name_fr ?? "",
      de: cat.name_de ?? "",
      nl: cat.name_nl ?? "",
    })
  }, [cat.name_ca, cat.name_en, cat.name_fr, cat.name_de, cat.name_nl])

  const flash = (key: string) => {
    setSavedFlag(key)
    setTimeout(() => setSavedFlag(null), 1500)
  }

  const saveName = async () => {
    const trimmed = name.trim()
    if (!trimmed) { setName(cat.name); return }
    if (trimmed === cat.name) return
    await onUpdate({ name: trimmed })
    flash("name")
  }

  const saveTranslation = async (lang: typeof LANGS[number]["code"]) => {
    const value = translations[lang].trim()
    const current = (cat[`name_${lang}` as keyof Categoria] as string | null) ?? ""
    if (value === current) return
    await onUpdate({ [`name_${lang}`]: value || null } as any)
    flash(`tr-${lang}`)
  }

  const autoTranslate = async () => {
    if (!name.trim()) { toast.error("Guarda primero el nombre en español"); return }
    setTranslating(true)
    const newTr = { ...translations }
    const patch: any = {}
    let ok = 0
    for (const { code, deeplCode } of LANGS) {
      const t = await translateOne(name.trim(), deeplCode)
      if (t) {
        newTr[code] = t
        patch[`name_${code}`] = t
        ok++
      }
    }
    setTranslations(newTr)
    if (ok > 0) {
      await onUpdate(patch)
      toast.success(`${ok}/${LANGS.length} traducciones generadas`)
    } else {
      toast.error("Error al traducir (revisa la API key de DeepL)")
    }
    setTranslating(false)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-col shrink-0">
            <Button size="sm" variant="ghost" onClick={() => onMove("up")} disabled={busy || isFirst} className="h-6 w-6 p-0" title="Subir">
              <ArrowUp className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onMove("down")} disabled={busy || isLast} className="h-6 w-6 p-0" title="Bajar">
              <ArrowDown className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
              placeholder="Nombre en español"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-base font-display"
            />
            {savedFlag === "name" && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 mx-1 hidden md:inline">
            {productCount === 0 ? "sin productos" : `${productCount} producto${productCount === 1 ? "" : "s"}`}
          </span>
          <Button size="sm" variant={expanded ? "default" : "ghost"} onClick={() => setExpanded((v) => !v)} className="h-8 w-8 p-0 shrink-0" title={expanded ? "Cerrar traducciones" : "Editar traducciones"}>
            <Languages className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="h-8 w-8 p-0 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10" title="Eliminar categoría">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
        {expanded && (
          <div className="mt-3 pt-3 border-t space-y-2">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Traducciones</h3>
              <Button size="sm" variant="outline" onClick={autoTranslate} disabled={translating} className="h-7 text-xs">
                {translating ? "Traduciendo..." : "Traducir automáticamente"}
              </Button>
            </div>
            {LANGS.map(({ code, label }) => (
              <div key={code} className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono w-10 shrink-0 text-muted-foreground">{code}</span>
                <span className="text-xs w-20 shrink-0 hidden md:inline text-muted-foreground">{label}</span>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={translations[code]}
                    onChange={(e) => setTranslations((prev) => ({ ...prev, [code]: e.target.value }))}
                    onBlur={() => saveTranslation(code)}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
                    placeholder={`Nombre en ${label}`}
                    className="w-full px-3 py-1.5 rounded-md border border-input bg-background text-sm"
                  />
                  {savedFlag === `tr-${code}` && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminCategorias() {
  const { signOut } = useAuth()
  const [cats, setCats] = useState<Categoria[]>([])
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")

  const fetchData = async () => {
    setLoading(true)
    const [{ data: catsData, error }, { data: prods }] = await Promise.all([
      supabase.from("categories").select("id, name, name_ca, name_en, name_fr, name_de, name_nl, order_index").order("order_index"),
      supabase.from("products").select("id, category_id"),
    ])
    if (error) { toast.error("Error al cargar categorías"); setLoading(false); return }
    setCats((catsData as any) ?? [])
    const counts: Record<string, number> = {}
    for (const p of (prods as any) ?? []) {
      if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1
    }
    setProductCounts(counts)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const updateCat = async (id: string, patch: Partial<Categoria>) => {
    const { error } = await supabase.from("categories").update(patch).eq("id", id)
    if (error) { toast.error("Error al guardar"); fetchData(); return }
    setCats((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c))
  }

  const moveCat = async (catId: string, direction: "up" | "down") => {
    if (busy) return
    const sorted = [...cats].sort((a, b) => a.order_index - b.order_index)
    const idx = sorted.findIndex((c) => c.id === catId)
    if (idx < 0) return
    const targetIdx = direction === "up" ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= sorted.length) return

    const a = sorted[idx]
    const b = sorted[targetIdx]
    setBusy(true)
    const tmp = -1 - Date.now() % 100000
    const r1 = await supabase.from("categories").update({ order_index: tmp }).eq("id", a.id)
    if (r1.error) { setBusy(false); toast.error("Error al reordenar"); return }
    const r2 = await supabase.from("categories").update({ order_index: a.order_index }).eq("id", b.id)
    if (r2.error) { setBusy(false); toast.error("Error al reordenar"); return }
    const r3 = await supabase.from("categories").update({ order_index: b.order_index }).eq("id", a.id)
    if (r3.error) { setBusy(false); toast.error("Error al reordenar"); return }
    setCats((prev) => prev.map((c) => {
      if (c.id === a.id) return { ...c, order_index: b.order_index }
      if (c.id === b.id) return { ...c, order_index: a.order_index }
      return c
    }))
    setBusy(false)
  }

  const deleteCat = async (cat: Categoria) => {
    const count = productCounts[cat.id] || 0
    if (count > 0) {
      toast.error(`No se puede eliminar "${cat.name}": tiene ${count} producto${count === 1 ? "" : "s"}. Mueve los productos a otra categoría primero.`)
      return
    }
    if (!confirm(`¿Eliminar la categoría "${cat.name}"? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from("categories").delete().eq("id", cat.id)
    if (error) { toast.error("Error al eliminar"); return }
    setCats((prev) => prev.filter((c) => c.id !== cat.id))
    toast.success("Categoría eliminada")
  }

  const addCategory = async () => {
    const trimmed = newName.trim()
    if (!trimmed) { toast.error("Escribe un nombre"); return }
    setAdding(true)

    const insert: any = { name: trimmed }
    let trCount = 0
    for (const { code, deeplCode } of LANGS) {
      const t = await translateOne(trimmed, deeplCode)
      if (t) { insert[`name_${code}`] = t; trCount++ }
    }
    const maxOrder = cats.length > 0 ? Math.max(...cats.map((c) => c.order_index)) : 0
    insert.order_index = maxOrder + 1

    const { data, error } = await supabase.from("categories").insert(insert).select().single()
    setAdding(false)
    if (error || !data) { toast.error("Error al crear categoría"); return }
    setCats((prev) => [...prev, data as Categoria].sort((a, b) => a.order_index - b.order_index))
    setNewName("")
    toast.success(`"${trimmed}" creada${trCount > 0 ? ` con ${trCount} traducciones` : " (sin traducciones)"}`)
  }

  const sortedCats = [...cats].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl flex items-center gap-2">
            <Layers className="w-7 h-7 text-primary" /> Categorías
          </h1>
          <span className="text-sm text-muted-foreground">{cats.length} categorías</span>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <AdminNav current="categorias" />
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Salir</Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Añadir categoría</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !adding && newName.trim()) addCategory() }}
              placeholder="Nombre en español (ej: Postres)"
              disabled={adding}
              className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
            />
            <Button onClick={addCategory} disabled={adding || !newName.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              {adding ? "Creando..." : "Añadir"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Las traducciones a CA, EN, FR, DE, NL se generan automáticamente con DeepL al crear la categoría.</p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center text-muted-foreground py-20">Cargando...</div>
      ) : sortedCats.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">No hay categorías. Añade una para empezar.</div>
      ) : (
        <div className="space-y-3">
          {sortedCats.map((c, i) => (
            <CategoriaRow
              key={c.id}
              cat={c}
              productCount={productCounts[c.id] || 0}
              isFirst={i === 0}
              isLast={i === sortedCats.length - 1}
              onUpdate={(patch) => updateCat(c.id, patch)}
              onMove={(dir) => moveCat(c.id, dir)}
              onDelete={() => deleteCat(c)}
              busy={busy}
            />
          ))}
        </div>
      )}
    </div>
  )
}