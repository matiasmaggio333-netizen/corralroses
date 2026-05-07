import { useEffect, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Shield, EyeOff } from "lucide-react"
import type { Table } from "@/lib/types"

export default function AdminQRs() {
  const [tables, setTables] = useState<Table[]>([])
  const [baseUrl, setBaseUrl] = useState("")
  const [showAdminQR, setShowAdminQR] = useState(false)

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

  const adminUrl = `${baseUrl}/admin/pedidos`

  const printAdminQR = () => {
    const w = window.open("", "_blank", "width=600,height=700")
    if (!w) return
    w.document.open()
    w.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>QR Admin - El Corral Roses</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; padding: 24px; text-align: center; }
  h1 { font-size: 24px; margin: 0 0 4px 0; }
  .sub { font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #666; margin-bottom: 24px; }
  .qr-wrapper { display: inline-block; padding: 16px; border: 3px solid #000; border-radius: 12px; background: #fff; }
  .label { font-size: 22px; font-weight: bold; margin-top: 20px; }
  .url { font-size: 11px; color: #666; word-break: break-all; margin-top: 8px; }
  .note { font-size: 13px; color: #444; margin-top: 24px; max-width: 360px; margin-left: auto; margin-right: auto; }
  @media print { @page { size: A6; margin: 6mm; } }
</style>
</head>
<body>
  <h1>EL CORRAL</h1>
  <div class="sub">Roses</div>
  <div class="qr-wrapper" id="qr"></div>
  <div class="label">QR ADMIN</div>
  <div class="url">${adminUrl}</div>
  <div class="note">Escanea desde el movil para acceder al panel de administracion. Guarda este codigo en privado.</div>
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
  <script>
    QRCode.toCanvas(document.getElementById('qr'), '${adminUrl}', { width: 280, errorCorrectionLevel: 'M', margin: 1 }, function(){
      setTimeout(function(){ window.print(); }, 200);
    });
    window.onafterprint = function(){ window.close(); };
  <\/script>
</body>
</html>`)
    w.document.close()
  }

  return (
    <div className="min-h-screen p-6 print:p-0">
      <div className="flex items-center justify-between mb-6 print:hidden flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl">QRs de mesas</h1>
          <p className="text-sm text-muted-foreground">{tables.length} mesas - base: {baseUrl}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowAdminQR((v) => !v)}>
            {showAdminQR ? <EyeOff className="w-4 h-4 mr-1" /> : <Shield className="w-4 h-4 mr-1" />}
            {showAdminQR ? "Ocultar QR Admin" : "QR Admin"}
          </Button>
          <Button onClick={() => window.print()}>Imprimir mesas</Button>
        </div>
      </div>

      {showAdminQR && (
        <div className="mb-6 print:hidden">
          <div className="border-2 border-primary rounded-lg p-5 bg-primary/5 max-w-md mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="font-display text-2xl text-primary">QR Admin</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Acceso rapido al panel desde el movil. No imprimir junto a los QRs de mesas.</p>
            <div className="bg-white p-4 rounded-md inline-block border-2 border-foreground">
              <QRCodeCanvas value={adminUrl} size={200} level="M" includeMargin />
            </div>
            <p className="text-xs text-muted-foreground mt-3 break-all">{adminUrl}</p>
            <Button size="sm" variant="outline" onClick={printAdminQR} className="mt-4">
              Imprimir solo este QR
            </Button>
          </div>
        </div>
      )}

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
              <div className="text-xs text-muted-foreground mt-1">Escanea para pedir</div>
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