import { useEffect, useState } from "react"
import type { Category, Product } from "./types"

export type Lang = "es" | "ca" | "en"

const KEY = "corral_lang"

export function getStoredLang(): Lang {
  const v = localStorage.getItem(KEY)
  return v === "ca" || v === "en" ? v : "es"
}

export function setStoredLang(lang: Lang) {
  localStorage.setItem(KEY, lang)
  window.dispatchEvent(new Event("corral-lang-change"))
}

export function useLang(): Lang {
  const [lang, setLang] = useState<Lang>(() => getStoredLang())
  useEffect(() => {
    const handler = () => setLang(getStoredLang())
    window.addEventListener("corral-lang-change", handler)
    return () => window.removeEventListener("corral-lang-change", handler)
  }, [])
  return lang
}

export function tCategory(c: Category, lang: Lang): string {
  if (lang === "ca") return c.name_ca || c.name
  if (lang === "en") return c.name_en || c.name
  return c.name
}

export function tProductName(p: Product, lang: Lang): string {
  if (lang === "ca") return p.name_ca || p.name
  if (lang === "en") return p.name_en || p.name
  return p.name
}

export function tProductDescription(p: Product, lang: Lang): string | null {
  if (lang === "ca") return p.description_ca || p.description
  if (lang === "en") return p.description_en || p.description
  return p.description
}

const STRINGS = {
  es: {
    your_name: "Tu nombre (opcional)",
    table_order: "Pedido de la mesa",
    plates: (n: number) => `${n} ${n === 1 ? "plato" : "platos"}`,
    served: "servido",
    call_waiter: "Llamar al camarero",
    waiter_called: "Camarero avisado, viene en seguida.",
    why_call: "¿Para qué llamas al camarero?",
    reason_bill: "Pedir la cuenta",
    reason_drink: "Pedir más bebida",
    reason_cutlery: "Cambiar cubiertos",
    reason_other: "Otra cosa",
    waiter_notified: "Camarero avisado",
    error_call_waiter: "No se pudo llamar al camarero",
    notes_kitchen: "Notas para cocina",
    notes_placeholder: "Sin cebolla, poco hecho...",
    add_btn: "Añadir",
    my_order: "Mi pedido",
    total: "Total",
    send_kitchen: "Enviar a cocina",
    item_added: (name: string) => `${name} añadido`,
    error_send: "Error al enviar el pedido",
    order_sent_title: "¡Pedido enviado!",
    order_sent_subtitle: "La cocina ya lo está preparando.",
    table_not_found: "Mesa no encontrada",
    verify_qr: "Verifica el código QR.",
    loading: "Cargando...",
  },
  ca: {
    your_name: "El teu nom (opcional)",
    table_order: "Comanda de la taula",
    plates: (n: number) => `${n} ${n === 1 ? "plat" : "plats"}`,
    served: "servit",
    call_waiter: "Cridar el cambrer",
    waiter_called: "Cambrer avisat, ve de seguida.",
    why_call: "Per què crides el cambrer?",
    reason_bill: "Demanar el compte",
    reason_drink: "Demanar més beguda",
    reason_cutlery: "Canviar coberts",
    reason_other: "Una altra cosa",
    waiter_notified: "Cambrer avisat",
    error_call_waiter: "No s'ha pogut cridar el cambrer",
    notes_kitchen: "Notes per a la cuina",
    notes_placeholder: "Sense ceba, poc fet...",
    add_btn: "Afegir",
    my_order: "La meva comanda",
    total: "Total",
    send_kitchen: "Enviar a la cuina",
    item_added: (name: string) => `${name} afegit`,
    error_send: "Error en enviar la comanda",
    order_sent_title: "Comanda enviada!",
    order_sent_subtitle: "La cuina ja l'està preparant.",
    table_not_found: "Taula no trobada",
    verify_qr: "Verifica el codi QR.",
    loading: "Carregant...",
  },
  en: {
    your_name: "Your name (optional)",
    table_order: "Table order",
    plates: (n: number) => `${n} ${n === 1 ? "item" : "items"}`,
    served: "served",
    call_waiter: "Call the waiter",
    waiter_called: "Waiter called, will be right with you.",
    why_call: "Why are you calling the waiter?",
    reason_bill: "Ask for the bill",
    reason_drink: "Order more drinks",
    reason_cutlery: "Change cutlery",
    reason_other: "Something else",
    waiter_notified: "Waiter notified",
    error_call_waiter: "Could not call the waiter",
    notes_kitchen: "Notes for the kitchen",
    notes_placeholder: "No onion, rare...",
    add_btn: "Add",
    my_order: "My order",
    total: "Total",
    send_kitchen: "Send to kitchen",
    item_added: (name: string) => `${name} added`,
    error_send: "Error sending order",
    order_sent_title: "Order sent!",
    order_sent_subtitle: "The kitchen is preparing it now.",
    table_not_found: "Table not found",
    verify_qr: "Check the QR code.",
    loading: "Loading...",
  },
} as const

export function t(lang: Lang) {
  return STRINGS[lang]
}