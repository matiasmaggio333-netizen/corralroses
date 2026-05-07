import { Routes, Route, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
import { AuthProvider } from "./contexts/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import MaintenanceGate from "./components/MaintenanceGate"

const Index = lazy(() => import("./pages/Index"))
const Cocina = lazy(() => import("./pages/Cocina"))
const Barra = lazy(() => import("./pages/Barra"))
const AdminQRs = lazy(() => import("./pages/AdminQRs"))
const AdminPedidos = lazy(() => import("./pages/AdminPedidos"))
const AdminStats = lazy(() => import("./pages/AdminStats"))
const AdminImagenes = lazy(() => import("./pages/AdminImagenes"))
const AdminPrecios = lazy(() => import("./pages/AdminPrecios"))
const AdminMesas = lazy(() => import("./pages/AdminMesas"))
const AdminCategorias = lazy(() => import("./pages/AdminCategorias"))
const NotFound = lazy(() => import("./pages/NotFound"))

function PageFallback() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <p className="text-sm opacity-70">Cargando...</p>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageFallback />}>
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
      </Suspense>
    </AuthProvider>
  )
}