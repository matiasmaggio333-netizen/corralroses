import { useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Coffee } from "lucide-react"

type Settings = { maintenance_mode: boolean; maintenance_message: string }

export default function MaintenanceGate({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Settings>({ maintenance_mode: false, maintenance_message: "Volvemos enseguida" })

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("maintenance_mode, maintenance_message")
      .eq("id", "main")
      .single()
    if (data) {
      setSettings({
        maintenance_mode: !!data.maintenance_mode,
        maintenance_message: data.maintenance_message || "Volvemos enseguida",
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSettings()
    const ch = supabase
      .channel("client-app-settings")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "app_settings" }, (payload: any) => {
        if (payload.new?.id === "main") {
          setSettings({
            maintenance_mode: !!payload.new.maintenance_mode,
            maintenance_message: payload.new.maintenance_message || "Volvemos enseguida",
          })
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Cargando...</div>
      </div>
    )
  }

  if (settings.maintenance_mode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-6">
            <Coffee className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl mb-3 text-foreground">
            {settings.maintenance_message}
          </h1>
          <p className="text-muted-foreground text-base mb-8">
            La carta esta temporalmente fuera de servicio.<br />
            Por favor, avisa a uno de nuestros camareros si necesitas ayuda.
          </p>
          <div className="border-t pt-6">
            <div className="font-display text-2xl text-foreground">El Corral Roses</div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Roses - Girona</div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}