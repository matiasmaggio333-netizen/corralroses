import { Link } from "react-router-dom"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-4xl font-display">404</h1>
      <p className="text-muted-foreground">Página no encontrada</p>
      <Link to="/" className="text-primary underline">Volver al inicio</Link>
    </div>
  )
}
