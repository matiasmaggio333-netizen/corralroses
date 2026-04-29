import { useEffect, useState } from "react"
import { Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useLang, t } from "@/lib/i18n"

export function CallWaiterButton({ tableId }: { tableId: string | undefined }) {
  const lang = useLang()
  const s = t(lang)
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [pending, setPending] = useState<string | null>(null)

  const REASONS = [s.reason_bill, s.reason_drink, s.reason_cutlery, s.reason_other]

  useEffect(() => {
    if (!tableId) return
    const fetch = async () => {
      const { data } = await supabase
        .from("waiter_calls")
        .select("id")
        .eq("table_id", tableId)
        .eq("attended", false)
        .limit(1)
      setPending(data && data.length > 0 ? data[0].id : null)
    }
    fetch()
    const ch = supabase
      .channel(`calls-${tableId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "waiter_calls", filter: `table_id=eq.${tableId}` },
        () => fetch()
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [tableId])

  const callWaiter = async (reason: string) => {
    if (!tableId) return
    setSending(true)
    const { error } = await supabase.from("waiter_calls").insert({ table_id: tableId, reason })
    setSending(false)
    setOpen(false)
    if (error) {
      toast.error(s.error_call_waiter)
      return
    }
    toast.success(s.waiter_notified)
  }

  if (pending) {
    return (
      <div className="px-4 pb-3">
        <div className="bg-green-100 border border-green-300 text-green-900 rounded-lg p-3 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{s.waiter_called}</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="px-4 pb-3">
        <Button
          variant="outline"
          className="w-full border-primary/40 hover:bg-primary/10"
          onClick={() => setOpen(true)}
        >
          <Bell className="w-4 h-4 mr-2" />
          {s.call_waiter}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{s.why_call}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {REASONS.map((r) => (
              <Button
                key={r}
                variant="outline"
                className="w-full justify-start"
                disabled={sending}
                onClick={() => callWaiter(r)}
              >
                {r}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}