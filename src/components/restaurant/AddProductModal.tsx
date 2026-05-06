import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { X } from "lucide-react"

type Category = { id: string; name: string; order_index: number }
type Props = { categories: Category[]; onSaved: () => void; onClose: () => void }

const LANGS = [
  { field: "name_ca", code: "CA" },
  { field: "name_en", code: "EN" },
  { field: "name_fr", code: "FR" },
  { field: "name_de", code: "DE" },
  { field: "name_nl", code: "NL" },
]

const DESC_LANGS = [
  { field: "description_ca", code: "CA" },
  { field: "description_en", code: "EN" },
  { field: "description_fr", code: "FR" },
  { field: "description_de", code: "DE" },
  { field: "description_nl", code: "NL" },
]

async function translateTo(text: string, targetLang: string): Promise<string> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLang }),
  })
  const data = await res.json()
  return data.translation ?? text
}

export function AddProductModal({ categories, onSaved, onClose }: Props) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "")
  const [price, setPrice] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState("")

  const handleSave = async () => {
    const num = parseFloat(price.replace(",", "."))
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return }
    if (isNaN(num) || num < 0) { toast.error("Precio inválido"); return }
    if (!categoryId) { toast.error("Selecciona una categoría"); return }

    setSaving(true)
    setProgress("Guardando producto...")

    const { data, error } = await supabase.from("products").insert({
      name: name.trim(),
      description: description.trim() || null,
      category_id: categoryId,
      price: num,
      is_active: isActive,
    }).select("id").single()

    if (error || !data) {
      toast.error("Error al guardar el producto")
      setSaving(false)
      setProgress("")
      return
    }

    setProgress("Traduciendo...")

    const translations: Record<string, string> = {}

    for (const { field, code } of LANGS) {
      try { translations[field] = await translateTo(name.trim(), code) }
      catch { translations[field] = name.trim() }
    }

    if (description.trim()) {
      for (const { field, code } of DESC_LANGS) {
        try { translations[field] = await translateTo(description.trim(), code) }
        catch { translations[field] = description.trim() }
      }
    }

    await supabase.from("products").update(translations).eq("id", data.id)

    setSaving(false)
    setProgress("")
    toast.success("Producto añadido y traducido")
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Añadir producto</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Nombre (en español)</label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
              placeholder="Nombre del producto"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Descripción (opcional, en español)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
              placeholder="Descripción del producto"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Categoría</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Precio (€)</label>
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm font-mono"
              placeholder="0.00"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4"
            />
            Producto activo (visible en carta)
          </label>
        </div>
        {progress && (
          <p className="text-sm text-muted-foreground text-center animate-pulse">{progress}</p>
        )}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Procesando..." : "Añadir y traducir"}
          </Button>
        </div>
      </div>
    </div>
  )
}