import { Routes, Route, Navigate } from "react-router-dom"
import Index from "./pages/Index"
import Cocina from "./pages/Cocina"
import Barra from "./pages/Barra"
import AdminQRs from "./pages/AdminQRs"
import AdminPedidos from "./pages/AdminPedidos"
import AdminStats from "./pages/AdminStats"
import AdminImagenes from "./pages/AdminImagenes"
import AdminPrecios from "./pages/AdminPrecios"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/mesa/mesa-1" replace />} />
      <Route path="/mesa/:code" element={<Index />} />
      <Route path="/cocina" element={<Cocina />} />
      <Route path="/barra" element={<Barra />} />
      <Route path="/admin/qrs" element={<AdminQRs />} />
      <Route path="/admin/pedidos" element={<AdminPedidos />} />
      <Route path="/admin/stats" element={<AdminStats />} />
      <Route path="/admin/imagenes" element={<AdminImagenes />} />
      <Route path="/admin/precios" element={<AdminPrecios />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}