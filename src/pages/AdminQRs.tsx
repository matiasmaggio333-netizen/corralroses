import { useEffect, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import type { Table } from "@/lib/types"

export default function AdminQRs() {
  const [tables, setTables] = useState<Table[]>([])
  const [baseUrl, setBaseUrl] = useState("")

  useEffect(() => {
    setBaseUrl(window.location.origin)
    supabase
      .from("tables")
      .select("*")
      .eq("is_active", true)
      .order("code")
      .then(({ data }) => {
        if (!data) return
        const sorted = [...data].sort((a, b) => {
          const na = parseInt(a.code.replace("mesa-", ""), 10)
          const nb = parseInt(b.code.replace("mesa-", ""), 10)
          return na - nb
        })
        setTables(sorted as Table[])
      })
  }, [])

  return (
    <div className="min-h-screen p-6 print:p-0">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="font-display text-3xl">QRs de mesas</h1>
          <p className="text-sm text-muted-foreground">{tables.length} mesas · base: {baseUrl}</p>
        </div>
        <Button onClick={() => window.print()}>Imprimir</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3 print:gap-2">
        {tables.map((t) => {
          const url = `${baseUrl}/mesa/${t.code}`
          return (
            <div
              key={t.id}
              className="border-2 border-foreground rounded-lg p-4 text-center bg-white print:break-inside-avoid"
            >
              <div className="font-display text-2xl text-foreground">EL CORRAL</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Roses</div>
              <div className="my-3 flex justify-center">
                <QRCodeCanvas value={url} size={180} level="M" includeMargin />
              </div>
              <div className="font-display text-3xl text-foreground">{t.name}</div>
              <div className="text-xs text-muted-foreground mt-1">Escaneá para pedir</div>
            </div>
          )
        })}
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  )
}
