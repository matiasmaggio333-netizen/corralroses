import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import MaintenanceGate from "./components/MaintenanceGate"
import Index from "./pages/Index"
import Cocina from "./pages/Cocina"
import Barra from "./pages/Barra"
import AdminQRs from "./pages/AdminQRs"
import AdminPedidos from "./pages/AdminPedidos"
import AdminStats from "./pages/AdminStats"
import AdminImagenes from "./pages/AdminImagenes"
import AdminPrecios from "./pages/AdminPrecios"
import AdminMesas from "./pages/AdminMesas"
import AdminCategorias from "./pages/AdminCategorias"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/mesa/mesa-1" replace />} />
        <Route path="/mesa/:code" element={<MaintenanceGate><Index /></MaintenanceGate>} />
        <Route path="/cocina" element={<ProtectedRoute><Cocina /></ProtectedRoute>} />
        <Route path="/cocina/:slug" element={<ProtectedRoute><Cocina /></ProtectedRoute>} />
        <Route path="/barra" element={<ProtectedRoute><Barra /></ProtectedRoute>} />
        <Route path="/admin/qrs" element={<ProtectedRoute><AdminQRs /></ProtectedRoute>} />
        <Route path="/admin/pedidos" element={<ProtectedRoute><AdminPedidos /></ProtectedRoute>} />
        <Route path="/admin/stats" element={<ProtectedRoute><AdminStats /></ProtectedRoute>} />
        <Route path="/admin/imagenes" element={<ProtectedRoute><AdminImagenes /></ProtectedRoute>} />
        <Route path="/admin/precios" element={<ProtectedRoute><AdminPrecios /></ProtectedRoute>} />
        <Route path="/admin/mesas" element={<ProtectedRoute><AdminMesas /></ProtectedRoute>} />
        <Route path="/admin/categorias" element={<ProtectedRoute><AdminCategorias /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}