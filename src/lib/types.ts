export type Table = { id: string; name: string; code: string; is_active: boolean }

export type Category = {
  id: string
  name: string
  name_ca: string | null
  name_en: string | null
  order_index: number
}

export type ProductOption = {
  id: string
  name: string
  name_ca?: string
  name_en?: string
  price: number
}

export type ProductOptionsConfig = {
  type: string
  required?: boolean
  min?: number
  max?: number
  options: ProductOption[]
}

export type Product = {
  id: string
  category_id: string
  name: string
  name_ca: string | null
  name_en: string | null
  description: string | null
  description_ca: string | null
  description_en: string | null
  price: number
  image_url: string | null
  options_config: ProductOptionsConfig | null
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