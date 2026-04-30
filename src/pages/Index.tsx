import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import { Receipt } from "lucide-react"
import { Hero } from "@/components/restaurant/Hero"
import { MenuTabs } from "@/components/restaurant/MenuTabs"
import { ProductCard } from "@/components/restaurant/ProductCard"
import { ProductModal, type CartItem } from "@/components/restaurant/ProductModal"
import { OrderSummary } from "@/components/restaurant/OrderSummary"
import { TableOrderSummary } from "@/components/restaurant/TableOrderSummary"
import { OrderConfirmationModal } from "@/components/restaurant/OrderConfirmationModal"
import { CallWaiterButton } from "@/components/restaurant/CallWaiterButton"
import { BillSplit } from "@/components/restaurant/BillSplit"
import { Button } from "@/components/ui/button"
import { useCategories, useProducts, useTable } from "@/hooks/useMenuData"
import { supabase } from "@/integrations/supabase/client"
import { useLang, t, tCategory, tProductName } from "@/lib/i18n"
import type { Product } from "@/lib/types"

export default function Index() {
  const { code } = useParams<{ code: string }>()
  const { data: table, isLoading: loadingTable } = useTable(code)
  const { data: categories = [] } = useCategories()
  const { data: products = [] } = useProducts()
  const lang = useLang()
  const s = t(lang)

  const [activeCat, setActiveCat] = useState<string | null>(null)
  const [guestName, setGuestName] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const storageKey = code ? `corral_cart_${code}` : null
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [billOpen, setBillOpen] = useState(false)
  const [lastOrder, setLastOrder] = useState<{ count: number; total: number }>({ count: 0, total: 0 })
  const sectionsRef = useRef<Record<string, HTMLDivElement | null>>({})
  const isClickScrolling = useRef(false)

  useEffect(() => {
    if (!activeCat && categories.length > 0) setActiveCat(categories[0].id)
  }, [categories, activeCat])

  useEffect(() => {
    if (!storageKey) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed.cart)) setCart(parsed.cart)
        if (typeof parsed.guestName === "string") setGuestName(parsed.guestName)
      }
    } catch {}
  }, [storageKey])

  useEffect(() => {
    if (!storageKey) return
    if (cart.length === 0 && !guestName) {
      localStorage.removeItem(storageKey)
      return
    }
    localStorage.setItem(storageKey, JSON.stringify({ cart, guestName }))
  }, [cart, guestName, storageKey])

  useEffect(() => {
    if (categories.length === 0) return
    const onScroll = () => {
      if (isClickScrolling.current) return
      const triggerY = 100
      let bestId: string | null = null
      let bestDist = Infinity
      for (const cat of categories) {
        const el = sectionsRef.current[cat.id]
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top - triggerY <= 0) {
          const dist = Math.abs(top - triggerY)
          if (dist < bestDist) {
            bestDist = dist
            bestId = cat.id
          }
        }
      }
      if (bestId) setActiveCat(bestId)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [categories])

  const productsByCat = useMemo(() => {
    const m: Record<string, Product[]> = {}
    products.forEach((p) => {
      if (!m[p.category_id]) m[p.category_id] = []
      m[p.category_id].push(p)
    })
    return m
  }, [products])

  const handleTabChange = (id: string) => {
    setActiveCat(id)
    isClickScrolling.current = true
    sectionsRef.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" })
    setTimeout(() => { isClickScrolling.current = false }, 800)
  }

  const handleAdd = (item: CartItem) => {
    setCart((c) => [...c, item])
    toast.success(s.item_added(tProductName(item.product, lang)))
  }

  const handleSend = async () => {
    if (!table) return
    const rows = cart.map((it) => {
      const extras = (it.selectedOptions || []).reduce((s, o) => s + o.price * o.quantity, 0)
      const totalLine = it.product.price * it.quantity + extras
      const unitPrice = it.quantity > 0 ? totalLine / it.quantity : it.product.price
      return {
        table_id: table.id,
        guest_name: guestName || null,
        product_id: it.product.id,
        product_name: it.product.name,
        category_name: categories.find((c) => c.id === it.product.category_id)?.name ?? "",
        price: unitPrice,
        quantity: it.quantity,
        options: it.selectedOptions?.length ? it.selectedOptions : null,
        notes: it.notes || null,
        status: "en_cocina" as const,
      }
    })
    const { error } = await supabase.from("order_items").insert(rows)
    if (error) {
      toast.error(s.error_send)
      return
    }
    const count = cart.reduce((sum, i) => sum + i.quantity, 0)
    const total = cart.reduce((sum, i) => {
      const extras = (i.selectedOptions || []).reduce((x, o) => x + o.price * o.quantity, 0)
      return sum + i.product.price * i.quantity + extras
    }, 0)
    setLastOrder({ count, total })
    setConfirmOpen(true)
    setCart([])
    setGuestName("")
  }

  if (loadingTable) {
    return <div className="min-h-screen flex items-center justify-center">{s.loading}</div>
  }
  if (!table) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 p-6">
        <h1 className="font-display text-2xl">{s.table_not_found}</h1>
        <p className="text-muted-foreground text-sm">{s.verify_qr}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-40">
      <Hero tableName={table.name} guestName={guestName} onGuestNameChange={setGuestName} />
      <TableOrderSummary tableId={table.id} />
      <CallWaiterButton tableId={table.id} />

      <div className="px-4 pb-3">
        <Button
          variant="outline"
          className="w-full border-primary/40 hover:bg-primary/10"
          onClick={() => setBillOpen(true)}
        >
          <Receipt className="w-4 h-4 mr-2" />
          {s.view_bill}
        </Button>
      </div>

      <MenuTabs categories={categories} active={activeCat} onChange={handleTabChange} />

      <div className="px-3 py-4 space-y-8">
        {categories.map((cat) => (
          <section
            key={cat.id}
            data-cat-id={cat.id}
            ref={(el) => { sectionsRef.current[cat.id] = el as HTMLDivElement | null }}
            className="scroll-mt-20"
          >
            <h2 className="font-display text-2xl mb-3 px-1">{tCategory(cat, lang)}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(productsByCat[cat.id] ?? []).map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onClick={() => {
                    setSelectedProduct(p)
                    setModalOpen(true)
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <ProductModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onAdd={handleAdd}
      />
      <OrderConfirmationModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        itemCount={lastOrder.count}
        total={lastOrder.total}
      />
      <BillSplit
        tableId={table.id}
        tableName={table.name}
        open={billOpen}
        onOpenChange={setBillOpen}
      />
      <OrderSummary
        items={cart}
        onRemove={(idx) => setCart((c) => c.filter((_, i) => i !== idx))}
        onSend={handleSend}
      />
    </div>
  )
}