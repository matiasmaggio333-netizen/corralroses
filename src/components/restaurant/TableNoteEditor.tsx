import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Check } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useLang, t } from "@/lib/i18n"

export function TableNoteEditor({ tableId }: { tableId: string }) {
  const lang = useLang()
  const s = t(lang)
  const [note, setNote] = useState("")
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const debounceRef = useRef<number | null>(null)
  const editingRef = useRef(false)

  useEffect(() => {
    if (!tableId) return
    let mounted = true
    supabase
      .from("table_notes")
      .select("content")
      .eq("table_id", tableId)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return
        const c = data?.content ?? ""
        setNote(c)
        if (c) setExpanded(true)
        setLoaded(true)
      })
    const ch = supabase
      .channel(`tn-${tableId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "table_notes", filter: `table_id=eq.${tableId}` },
        (payload: any) => {
          if (editingRef.current) return
          if (payload.eventType === "DELETE") {
            setNote("")
            setExpanded(false)
          } else if (payload.new?.content !== undefined) {
            setNote(payload.new.content)
            if (payload.new.content) setExpanded(true)
          }
        }
      )
      .subscribe()
    return () => {
      mounted = false
      supabase.removeChannel(ch)
    }
  }, [tableId])

  const save = async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) {
      await supabase.from("table_notes").delete().eq("table_id", tableId)
    } else {
      await supabase.from("table_notes").upsert({
        table_id: tableId,
        content: trimmed,
        updated_at: new Date().toISOString(),
      })
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const handleChange = (v: string) => {
    setNote(v)
    editingRef.current = true
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      save(v)
      editingRef.current = false
    }, 600)
  }

  if (!loaded) return null

  return (
    <div className="px-4 pb-3">
      {expanded ? (
        <div className="border-2 border-amber-400/60 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex-1">
              {s.kitchen_alerts}
            </span>
            {saved && <Check className="w-4 h-4 text-green-600" />}
          </div>
          <textarea
            value={note}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={s.kitchen_alerts_placeholder}
            rows={2}
            maxLength={300}
            className="w-full text-sm rounded-md border border-amber-300 dark:border-amber-700 bg-background p-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 border border-dashed border-amber-400/40 hover:border-amber-400 rounded-lg transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          {s.kitchen_alerts_add}
        </button>
      )}
    </div>
  )
}