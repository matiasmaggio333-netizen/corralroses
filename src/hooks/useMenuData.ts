import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import type { Category, Product, Table } from "@/lib/types"

export function useTable(code: string | undefined) {
  return useQuery({
    queryKey: ["table", code],
    queryFn: async () => {
      if (!code) return null
      const { data, error } = await supabase.from("tables").select("*").eq("code", code).maybeSingle()
      if (error) throw error
      return data as Table | null
    },
    enabled: !!code,
  })
}

export function useCategories() {
  const qc = useQueryClient()
  useEffect(() => {
    const ch = supabase
      .channel("categories-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
        qc.invalidateQueries({ queryKey: ["categories"] })
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [qc])

  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("order_index")
      if (error) throw error
      return data as Category[]
    },
  })
}

export function useProducts() {
  const qc = useQueryClient()
  useEffect(() => {
    const ch = supabase
      .channel("products-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        qc.invalidateQueries({ queryKey: ["products"] })
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [qc])

  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("is_active", true)
      if (error) throw error
      return data as Product[]
    },
  })
}