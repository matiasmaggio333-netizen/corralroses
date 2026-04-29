import { Routes, Route, Navigate } from "react-router-dom"
import Index from "./pages/Index"
import Cocina from "./pages/Cocina"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/mesa/mesa-1" replace />} />
      <Route path="/mesa/:code" element={<Index />} />
      <Route path="/cocina" element={<Cocina />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
