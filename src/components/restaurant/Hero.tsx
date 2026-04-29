import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/ThemeToggle"

export function Hero({ tableName, guestName, onGuestNameChange }: {
  tableName: string
  guestName: string
  onGuestNameChange: (v: string) => void
}) {
  return (
    <div className="bg-secondary text-secondary-foreground py-6 px-4 text-center relative">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <div className="mx-auto w-28 h-28 md:w-32 md:h-32 rounded-full bg-[#FAF7F2] p-1 shadow-lg flex items-center justify-center">
        <img src="/logo.png" alt="El Corral Roses" className="w-full h-full object-contain rounded-full" />
      </div>
      <h1 className="font-display text-3xl md:text-4xl tracking-wide text-primary mt-2">EL CORRAL</h1>
      <p className="text-xs md:text-sm uppercase tracking-[0.3em] mt-1 text-secondary-foreground/70">
        Pollos al ast · Pizzes al forn de llenya
      </p>
      <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30">
        <span className="text-sm font-medium">{tableName}</span>
      </div>
      <div className="max-w-xs mx-auto mt-4">
        <Input
          placeholder="Tu nombre (opcional)"
          value={guestName}
          onChange={(e) => onGuestNameChange(e.target.value)}
          className="bg-secondary-foreground/10 border-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/50 text-center"
        />
      </div>
    </div>
  )
}