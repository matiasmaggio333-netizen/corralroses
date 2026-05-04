import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Lock, LogOut, RefreshCw, Upload, Trash2, ClipboardList, BarChart3, ImageIcon, Euro } from "lucide-react"
import { Link } from "react-router-dom"

const ADMIN_PIN = "2580"
const STORAGE_KEY = "corral_admin_auth"
const BUCKET = "products"

type Product = {
  id: string
  name: string
  image_url: string | null
  category_id: string
  is_active: boolean
}

type Category = {
  id: string
  name: string
  order_index: number
}

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === ADMIN_PIN) {
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
        <h1 className="font-display text-2xl">Acceso administración</h1>
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

function extractStoragePath(url: string | null): string | null {
  if (!url) return null
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.substring(idx + marker.length)
}

export default function AdminImagenes() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(STORAGE_KEY) === "1")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "without">("all")
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({})

  const fetchData = async () => {
    setLoading(true)
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("products").select("id, name, image_url, category_id, is_active").order("name"),
      supabase.from("categories").select("id, name, order_index").order("order_index"),
    ])
    setProducts((prods as any) ?? [])
    setCategories((cats as any) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!authed) return
    fetchData()
  }, [authed])

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuthed(false)
  }

  const handleFile = async (product: Product, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Máximo 5 MB")
      return
    }
    setUploadingId(product.id)

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const path = `${product.id}-${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type })
    if (upErr) {
      setUploadingId(null)
      toast.error("Error subiendo imagen")
      return
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
    const newUrl = pub.publicUrl

    const oldPath = extractStoragePath(product.image_url)

    const { error: dbErr } = await supabase
      .from("products")
      .update({ image_url: newUrl })
      .eq("id", product.id)
    if (dbErr) {
      await supabase.storage.from(BUCKET).remove([path])
      setUploadingId(null)
      toast.error("Error guardando URL")
      return
    }

    if (oldPath) {
      await supabase.storage.from(BUCKET).remove([oldPath])
    }

    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, image_url: newUrl } : p)))
    setUploadingId(null)
    toast.success("Imagen actualizada")
  }

  const handleRemove = async (product: Product) => {
    if (!product.image_url) return
    if (!confirm(`¿Quitar la imagen de "${product.name}"?`)) return
    setUploadingId(product.id)

    const oldPath = extractStoragePath(product.image_url)

    const { error } = await supabase.from("products").update({ image_url: null }).eq("id", product.id)
    if (error) {
      setUploadingId(null)
      toast.error("Error al quitar imagen")
      return
    }

    if (oldPath) {
      await supabase.storage.from(BUCKET).remove([oldPath])
    }

    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, image_url: null } : p)))
    setUploadingId(null)
    toast.success("Imagen eliminada")
  }

  if (!authed) return <PinGate onUnlock={() => setAuthed(true)} />

  const filtered = filter === "without" ? products.filter((p) => !p.image_url) : products
  const byCat: Record<string, Product[]> = {}
  for (const p of filtered) {
    if (!byCat[p.category_id]) byCat[p.category_id] = []
    byCat[p.category_id].push(p)
  }
  const sortedCats = categories.filter((c) => byCat[c.id]?.length > 0)
  const totalWithout = products.filter((p) => !p.image_url).length

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl flex items-center gap-2">
            <ImageIcon className="w-7 h-7 text-primary" /> Imágenes de productos
          </h1>
          <span className="text-sm text-muted-foreground">
            {products.length} productos · {totalWithout} sin foto
          </span>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Link to="/admin/pedidos">
            <Button variant="outline" size="sm">
              <ClipboardList className="w-4 h-4 mr-1" /> Pedidos
            </Button>
          </Link>
          <Link to="/admin/stats">
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-1" /> Stats
            </Button>
          </Link>
          <Link to="/admin/precios">
            <Button variant="outline" size="sm">
              <Euro className="w-4 h-4 mr-1" /> Precios
            </Button>
          </Link>
          <div className="inline-flex bg-muted/60 rounded-full p-0.5 text-xs font-semibold">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-full transition-colors ${filter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter("without")}
              className={`px-3 py-1.5 rounded-full transition-colors ${filter === "without" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Sin foto ({totalWithout})
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-1" /> Salir
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-20">Cargando...</div>
      ) : sortedCats.length === 0 ? (
        <div className="text-center text-muted-foreground py-20">
          {filter === "without" ? "Todos los productos tienen foto 🎉" : "No hay productos"}
        </div>
      ) : (
        <div className="space-y-8">
          {sortedCats.map((cat) => (
            <section key={cat.id}>
              <h2 className="font-display text-xl mb-3">{cat.name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {byCat[cat.id].map((p) => {
                  const busy = uploadingId === p.id
                  return (
                    <Card key={p.id} className={!p.is_active ? "opacity-60" : ""}>
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <div className="w-20 h-20 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm leading-tight truncate" title={p.name}>
                              {p.name}
                            </div>
                            {!p.is_active && <div className="text-[10px] text-muted-foreground">inactivo</div>}
                            <div className="flex gap-1.5 mt-2">
                              <input
                                ref={(el) => { inputsRef.current[p.id] = el }}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0]
                                  if (f) handleFile(p, f)
                                  e.target.value = ""
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => inputsRef.current[p.id]?.click()}
                                className="h-8 text-xs"
                              >
                                <Upload className="w-3.5 h-3.5 mr-1" />
                                {busy ? "Subiendo..." : p.image_url ? "Cambiar" : "Subir"}
                              </Button>
                              {p.image_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busy}
                                  onClick={() => handleRemove(p)}
                                  className="h-8 text-xs text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}