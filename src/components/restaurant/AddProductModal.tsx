import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { X } from "lucide-react"

type Category = { id: string; name: string; order_index: number }
type Props = { categories: Category[]; onSaved: () => void; onClose: () => void }

export function AddProductModal({ categories, onSaved, onClose }: Props) {
  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "")
  const [price, setPrice] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const num = parseFloat(price.replace(",", "."))
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return }
    if (isNaN(num) || num < 0) { toast.error("Precio inválido"); return }
    if (!categoryId) { toast.error("Selecciona una categoría"); return }
    setSaving(true)
    const { error } = await supabase.from("products").insert({
      name: name.trim(),
      category_id: categoryId,
      price: num,
      is_active: isActive,
    })
    setSaving(false)
    if (error) { toast.error("Error al guardar el producto"); return }
    toast.success("Producto añadido")
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
            <label className="text-sm font-medium">Nombre</label>
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
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Añadir"}
          </Button>
        </div>
      </div>
    </div>
  )
}