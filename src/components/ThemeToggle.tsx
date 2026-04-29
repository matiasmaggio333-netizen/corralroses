import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

const KEY = "corral_theme"

type Mode = "light" | "dark" | "auto"

function autoIsDark(): boolean {
  const h = new Date().getHours()
  return h >= 20 || h < 8
}

function resolveDark(mode: Mode): boolean {
  return mode === "dark" || (mode === "auto" && autoIsDark())
}

function applyTheme(mode: Mode) {
  document.documentElement.classList.toggle("dark", resolveDark(mode))
}

export function getStoredMode(): Mode {
  const v = localStorage.getItem(KEY)
  return v === "light" || v === "dark" ? v : "auto"
}

export function initTheme() {
  applyTheme(getStoredMode())
}

export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode>(() => getStoredMode())
  const isDark = resolveDark(mode)

  useEffect(() => {
    applyTheme(mode)
    if (mode === "auto") localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, mode)
  }, [mode])

  useEffect(() => {
    if (mode !== "auto") return
    const t = setInterval(() => applyTheme("auto"), 60 * 60 * 1000)
    return () => clearInterval(t)
  }, [mode])

  return (
    <button
      onClick={() => setMode(isDark ? "light" : "dark")}
      className={cn(
        "p-2 rounded-full bg-muted/60 hover:bg-muted transition-colors",
        className
      )}
      aria-label="Cambiar tema"
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}