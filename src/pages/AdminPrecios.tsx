import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { LogOut, RefreshCw, ClipboardList, BarChart3, ImageIcon, Euro, Check, Plus, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"
import { AddProductModal } from "@/components/restaurant/AddProductModal"

type Product = { id: string; name: string; price: number; category_id: string; is_active: boolean }
type Category = { id: string; name: string; order_index: number }

function PriceRow({ product, onSaved, onDelete }: { product: Product; onSaved: (newPrice: number) => void; onDelete: () => void }) {
  const [value, setValue] = useState(product.price.toFixed(2))
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => { setValue(product.price.toFixed(2)) }, [product.price])

  const dirty = parseFloat(value.replace(",", ".")) !== product.price && value.trim() !== ""

  const save = async () => {
    const num = parseFloat(value.replace(",", "."))
    if (isNaN(num) || num < 0) { toast.error("Precio inválido"); setValue(product.price.toFixed(2)); return }
    if (num === product.price) return
    setSaving(true)
    const { error } = await supabase.from("products").update({ price: num }).eq("id", product.id)
    setSaving(false)
    if (error) { toast.error("Error al guardar"); setValue(product.price.toFixed(2)); return }
    onSaved(num)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1500)
  }

  return (
    <div className={`flex items-center gap-2 p-3 rounded-md border ${!product.is_active ? "opacity-60" : ""}`}>
      <span className="flex-1 text-sm font-medium truncate" title={product.name}>{product.name}</span>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
          disabled={saving}
          className="w-24 text-right pr-7 pl-2 py-1.5 rounded-md border border-input bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">€</span>
      </div>
      <div className="w-5 flex items-center justify-center">
        {justSaved && <Check className="w-4 h-4 text-green-600" />}
        {dirty && !justSaved && <span className="w-2 h-2 rounded-full bg-amber-500" />}
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  )
}

export default function AdminPrecios() {
  const { signOut } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("products").select("id, name, price, category_id, is_active").order("name"),
      supabase.from("categories").select("id, name, order_index").order("order_index"),
    ])
    setProducts((prods as any) ?? [])
    setCategories((cats as any) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const deleteProduct = async (product: Product) => {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from("products").delete().eq("id", product.id)
    if (error) { toast.error("Error al eliminar el producto"); return }
    setProducts((prev) => prev.filter((p) => p.id !== product.id))
    toast.success("Producto eliminado")
  }

  const filter = search.trim().toLowerCase()
  const filtered = filter ? products.filter((p) => p.name.toLowerCase().includes(filter)) : products
  const byCat: Record<string, Product[]> = {}
  for (const p of filtered) {
    if (!byCat[p.category_id]) byCat[p.category_id] = []
    byCat[p.category_id].push(p)
  }
  const sortedCats = categories.filter((c) => byCat[c.id]?.length > 0)
  const updatePrice = (id: string, newPrice: number) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, price: newPrice } : p)))
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl flex items-center gap-2">
            <Euro className="w-7 h-7 text-primary" /> Precios
          </h1>
          <span className="text-sm text-muted-foreground">{products.length} productos</span>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Link to="/admin/pedidos">
            <Button variant="outline" size="sm"><ClipboardList className="w-4 h-4 mr-1" /> Pedidos</Button>
          </Link>
          <Link to="/admin/stats">
            <Button variant="outline" size="sm"><BarChart3 className="w-4 h-4 mr-1" /> Stats</Button>
          </Link>
          <Link to="/admin/imagenes">
            <Button variant="outline" size="sm"><ImageIcon className="w-4 h-4 mr-1" /> Imágenes</Button>
          </Link>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-1" /> Añadir producto
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" /> Salir</Button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-80 px-3 py-2 rounded-md border border-input bg-background text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-20">Cargando...</div>
      ) : sortedCats.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">Sin resultados</div>
      ) : (
        <div className="space-y-6">
          {sortedCats.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="p-4">
                <h2 className="font-display text-xl mb-3">{cat.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {byCat[cat.id].map((p) => (
                    <PriceRow
                      key={p.id}
                      product={p}
                      onSaved={(np) => updatePrice(p.id, np)}
                      onDelete={() => deleteProduct(p)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddProductModal
          categories={categories}
          onSaved={fetchData}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}