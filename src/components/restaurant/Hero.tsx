import { Input } from "@/components/ui/input"

export function Hero({ tableName, guestName, onGuestNameChange }: {
  tableName: string
  guestName: string
  onGuestNameChange: (v: string) => void
}) {
  return (
    <div className="bg-secondary text-secondary-foreground py-8 px-4 text-center">
      <h1 className="font-display text-4xl md:text-5xl tracking-wide text-primary">EL CORRAL</h1>
      <p className="text-xs md:text-sm uppercase tracking-[0.3em] mt-1 text-secondary-foreground/70">
        Pollos al ast · Pizzes al forn de llenya
      </p>
      <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/30">
        <span className="text-sm font-medium">{tableName}</span>
      </div>
      <div className="max-w-xs mx-auto mt-5">
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
