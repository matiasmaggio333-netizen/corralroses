export type Table = { id: string; name: string; code: string; is_active: boolean }
export type Category = { id: string; name: string; order_index: number }
export type Product = {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  options_config: any
  is_active: boolean
}
export type OrderItem = {
  id: string
  order_id: string | null
  table_id: string
  guest_name: string | null
  product_id: string
  product_name: string
  category_name: string
  price: number
  quantity: number
  options: any
  notes: string | null
  status: "pending_submit" | "en_cocina" | "servido"
  created_at: string
}
