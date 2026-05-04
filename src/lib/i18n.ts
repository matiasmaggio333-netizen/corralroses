import { useEffect, useState } from "react"
import type { Category, Product } from "./types"

export type Lang = "ca" | "es" | "en" | "fr" | "de" | "nl"

const KEY = "corral_lang"
const VALID_LANGS: Lang[] = ["ca", "es", "en", "fr", "de", "nl"]

export function getStoredLang(): Lang {
  const v = localStorage.getItem(KEY) as Lang | null
  if (v && VALID_LANGS.includes(v)) return v
  return "ca"
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
  if (lang === "fr") return c.name_fr || c.name_en || c.name
  if (lang === "de") return c.name_de || c.name_en || c.name
  if (lang === "nl") return c.name_nl || c.name_en || c.name
  return c.name
}

export function tProductName(p: Product, lang: Lang): string {
  if (lang === "ca") return p.name_ca || p.name
  if (lang === "en") return p.name_en || p.name
  if (lang === "fr") return p.name_fr || p.name_en || p.name
  if (lang === "de") return p.name_de || p.name_en || p.name
  if (lang === "nl") return p.name_nl || p.name_en || p.name
  return p.name
}

export function tProductDescription(p: Product, lang: Lang): string | null {
  if (lang === "ca") return p.description_ca || p.description
  if (lang === "en") return p.description_en || p.description
  if (lang === "fr") return p.description_fr || p.description_en || p.description
  if (lang === "de") return p.description_de || p.description_en || p.description
  if (lang === "nl") return p.description_nl || p.description_en || p.description
  return p.description
}

const STRINGS = {
  es: {
    your_name: "Tu nombre (opcional)",
    table_order: "Pedido de la mesa",
    plates: (n: number) => `${n} ${n === 1 ? "plato" : "platos"}`,
    served: "servido",
    preparing: "preparando",
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
    choose_sauces: "Elige tus salsas",
    view_bill: "Ver cuenta",
    bill_title: "Cuenta de la mesa",
    bill_total: "Total",
    bill_by_person: "Por persona",
    bill_split_equal: "Dividir entre todos",
    bill_no_name: "Sin nombre",
    bill_split_among: "Dividir entre",
    bill_per_person: "por persona",
    bill_people: "personas",
    bill_close: "Cerrar",
    mark_paid: "Marcar pagada",
    mark_paid_confirm: "¿Marcar la mesa como pagada?",
    error_mark_paid: "No se pudo cerrar la mesa",
    table_paid: "Mesa pagada",
    kitchen_alerts: "Avisos para cocina · alergias",
    kitchen_alerts_placeholder: "Ej: alergia al gluten en la silla 2",
    kitchen_alerts_add: "+ Añadir aviso para cocina (alergias)",
  },
  ca: {
    your_name: "El teu nom (opcional)",
    table_order: "Comanda de la taula",
    plates: (n: number) => `${n} ${n === 1 ? "plat" : "plats"}`,
    served: "servit",
    preparing: "preparant",
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
    choose_sauces: "Tria les teves salses",
    view_bill: "Veure el compte",
    bill_title: "Compte de la taula",
    bill_total: "Total",
    bill_by_person: "Per persona",
    bill_split_equal: "Dividir entre tots",
    bill_no_name: "Sense nom",
    bill_split_among: "Dividir entre",
    bill_per_person: "per persona",
    bill_people: "persones",
    bill_close: "Tancar",
    mark_paid: "Marcar pagada",
    mark_paid_confirm: "Marcar la taula com a pagada?",
    error_mark_paid: "No s'ha pogut tancar la taula",
    table_paid: "Taula pagada",
    kitchen_alerts: "Avisos per a la cuina · al·lèrgies",
    kitchen_alerts_placeholder: "Ex: al·lèrgia al gluten a la cadira 2",
    kitchen_alerts_add: "+ Afegir avís per a la cuina (al·lèrgies)",
  },
  en: {
    your_name: "Your name (optional)",
    table_order: "Table order",
    plates: (n: number) => `${n} ${n === 1 ? "item" : "items"}`,
    served: "served",
    preparing: "preparing",
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
    choose_sauces: "Choose your sauces",
    view_bill: "View bill",
    bill_title: "Table bill",
    bill_total: "Total",
    bill_by_person: "Per person",
    bill_split_equal: "Split equally",
    bill_no_name: "Unnamed",
    bill_split_among: "Split among",
    bill_per_person: "per person",
    bill_people: "people",
    bill_close: "Close",
    mark_paid: "Mark as paid",
    mark_paid_confirm: "Mark this table as paid?",
    error_mark_paid: "Could not close the table",
    table_paid: "Table paid",
    kitchen_alerts: "Kitchen alerts · allergies",
    kitchen_alerts_placeholder: "E.g. gluten allergy at seat 2",
    kitchen_alerts_add: "+ Add alert for kitchen (allergies)",
  },
  fr: {
    your_name: "Votre nom (facultatif)",
    table_order: "Commande de la table",
    plates: (n: number) => `${n} ${n === 1 ? "plat" : "plats"}`,
    served: "servi",
    preparing: "en préparation",
    call_waiter: "Appeler le serveur",
    waiter_called: "Serveur appelé, il arrive tout de suite.",
    why_call: "Pourquoi appelez-vous le serveur ?",
    reason_bill: "Demander l'addition",
    reason_drink: "Commander plus de boissons",
    reason_cutlery: "Changer les couverts",
    reason_other: "Autre chose",
    waiter_notified: "Serveur prévenu",
    error_call_waiter: "Impossible d'appeler le serveur",
    notes_kitchen: "Notes pour la cuisine",
    notes_placeholder: "Sans oignon, saignant...",
    add_btn: "Ajouter",
    my_order: "Ma commande",
    total: "Total",
    send_kitchen: "Envoyer en cuisine",
    item_added: (name: string) => `${name} ajouté`,
    error_send: "Erreur lors de l'envoi de la commande",
    order_sent_title: "Commande envoyée !",
    order_sent_subtitle: "La cuisine la prépare déjà.",
    table_not_found: "Table introuvable",
    verify_qr: "Vérifiez le code QR.",
    loading: "Chargement...",
    choose_sauces: "Choisissez vos sauces",
    view_bill: "Voir l'addition",
    bill_title: "Addition de la table",
    bill_total: "Total",
    bill_by_person: "Par personne",
    bill_split_equal: "Partager entre tous",
    bill_no_name: "Sans nom",
    bill_split_among: "Partager entre",
    bill_per_person: "par personne",
    bill_people: "personnes",
    bill_close: "Fermer",
    mark_paid: "Marquer comme payée",
    mark_paid_confirm: "Marquer la table comme payée ?",
    error_mark_paid: "Impossible de fermer la table",
    table_paid: "Table payée",
    kitchen_alerts: "Avis pour la cuisine · allergies",
    kitchen_alerts_placeholder: "Ex : allergie au gluten à la chaise 2",
    kitchen_alerts_add: "+ Ajouter un avis pour la cuisine (allergies)",
  },
  de: {
    your_name: "Dein Name (optional)",
    table_order: "Tischbestellung",
    plates: (n: number) => `${n} ${n === 1 ? "Gericht" : "Gerichte"}`,
    served: "serviert",
    preparing: "wird zubereitet",
    call_waiter: "Kellner rufen",
    waiter_called: "Kellner ist informiert, kommt sofort.",
    why_call: "Warum rufen Sie den Kellner?",
    reason_bill: "Rechnung bitte",
    reason_drink: "Mehr Getränke",
    reason_cutlery: "Besteck wechseln",
    reason_other: "Etwas anderes",
    waiter_notified: "Kellner benachrichtigt",
    error_call_waiter: "Kellner konnte nicht gerufen werden",
    notes_kitchen: "Notizen für die Küche",
    notes_placeholder: "Ohne Zwiebel, blutig...",
    add_btn: "Hinzufügen",
    my_order: "Meine Bestellung",
    total: "Gesamt",
    send_kitchen: "An die Küche senden",
    item_added: (name: string) => `${name} hinzugefügt`,
    error_send: "Fehler beim Senden der Bestellung",
    order_sent_title: "Bestellung gesendet!",
    order_sent_subtitle: "Die Küche bereitet sie bereits zu.",
    table_not_found: "Tisch nicht gefunden",
    verify_qr: "Bitte QR-Code prüfen.",
    loading: "Lädt...",
    choose_sauces: "Wähle deine Saucen",
    view_bill: "Rechnung ansehen",
    bill_title: "Tischrechnung",
    bill_total: "Gesamt",
    bill_by_person: "Pro Person",
    bill_split_equal: "Gleichmäßig teilen",
    bill_no_name: "Ohne Namen",
    bill_split_among: "Teilen unter",
    bill_per_person: "pro Person",
    bill_people: "Personen",
    bill_close: "Schließen",
    mark_paid: "Als bezahlt markieren",
    mark_paid_confirm: "Tisch als bezahlt markieren?",
    error_mark_paid: "Tisch konnte nicht geschlossen werden",
    table_paid: "Tisch bezahlt",
    kitchen_alerts: "Hinweise für die Küche · Allergien",
    kitchen_alerts_placeholder: "Z. B. Glutenallergie auf Stuhl 2",
    kitchen_alerts_add: "+ Hinweis für die Küche hinzufügen (Allergien)",
  },
  nl: {
    your_name: "Jouw naam (optioneel)",
    table_order: "Bestelling van de tafel",
    plates: (n: number) => `${n} ${n === 1 ? "gerecht" : "gerechten"}`,
    served: "geserveerd",
    preparing: "wordt bereid",
    call_waiter: "Ober roepen",
    waiter_called: "Ober is gewaarschuwd, hij komt eraan.",
    why_call: "Waarom roep je de ober?",
    reason_bill: "De rekening graag",
    reason_drink: "Meer drinken bestellen",
    reason_cutlery: "Bestek wisselen",
    reason_other: "Iets anders",
    waiter_notified: "Ober gewaarschuwd",
    error_call_waiter: "Ober kon niet geroepen worden",
    notes_kitchen: "Opmerkingen voor de keuken",
    notes_placeholder: "Zonder ui, rood...",
    add_btn: "Toevoegen",
    my_order: "Mijn bestelling",
    total: "Totaal",
    send_kitchen: "Naar de keuken sturen",
    item_added: (name: string) => `${name} toegevoegd`,
    error_send: "Fout bij het verzenden van de bestelling",
    order_sent_title: "Bestelling verzonden!",
    order_sent_subtitle: "De keuken bereidt het al voor.",
    table_not_found: "Tafel niet gevonden",
    verify_qr: "Controleer de QR-code.",
    loading: "Laden...",
    choose_sauces: "Kies je sauzen",
    view_bill: "Rekening bekijken",
    bill_title: "Rekening van de tafel",
    bill_total: "Totaal",
    bill_by_person: "Per persoon",
    bill_split_equal: "Gelijk verdelen",
    bill_no_name: "Geen naam",
    bill_split_among: "Verdelen tussen",
    bill_per_person: "per persoon",
    bill_people: "personen",
    bill_close: "Sluiten",
    mark_paid: "Als betaald markeren",
    mark_paid_confirm: "Tafel als betaald markeren?",
    error_mark_paid: "Kon de tafel niet sluiten",
    table_paid: "Tafel betaald",
    kitchen_alerts: "Aandachtspunten voor de keuken · allergieën",
    kitchen_alerts_placeholder: "Bv: glutenallergie op stoel 2",
    kitchen_alerts_add: "+ Aandachtspunt voor de keuken toevoegen (allergieën)",
  },
} as const

export function t(lang: Lang) {
  return STRINGS[lang]
}