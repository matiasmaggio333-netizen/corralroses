import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ClipboardList, BarChart3, ImageIcon, Euro, Layers, Table as TableIcon, QrCode } from "lucide-react"

type AdminPage = "pedidos" | "stats" | "imagenes" | "precios" | "categorias" | "mesas" | "qrs"

const LINKS: { key: AdminPage; to: string; label: string; Icon: any }[] = [
  { key: "pedidos", to: "/admin/pedidos", label: "Pedidos", Icon: ClipboardList },
  { key: "stats", to: "/admin/stats", label: "Stats", Icon: BarChart3 },
  { key: "imagenes", to: "/admin/imagenes", label: "Imágenes", Icon: ImageIcon },
  { key: "precios", to: "/admin/precios", label: "Precios", Icon: Euro },
  { key: "categorias", to: "/admin/categorias", label: "Categorías", Icon: Layers },
  { key: "mesas", to: "/admin/mesas", label: "Mesas", Icon: TableIcon },
  { key: "qrs", to: "/admin/qrs", label: "QRs", Icon: QrCode },
]

export function AdminNav({ current }: { current: AdminPage }) {
  return (
    <>
      {LINKS.filter((l) => l.key !== current).map(({ key, to, label, Icon }) => (
        <Link key={key} to={to}>
          <Button variant="outline" size="sm"><Icon className="w-4 h-4 mr-1" /> {label}</Button>
        </Link>
      ))}
    </>
  )
}