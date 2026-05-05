import { useState, ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

function LoginForm() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError("Credenciales incorrectas")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl">Acceso restringido</h1>
        </div>
        <input
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-md border-2 border-input bg-background"
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-md border-2 border-input bg-background"
          placeholder="Contraseña"
          required
        />
        {error && <p className="text-destructive text-sm text-center">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  )
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  if (!session) {
    return <LoginForm />
  }

  return <>{children}</>
}