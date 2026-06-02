export const config = { runtime: "edge" }

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const recipientsRaw = process.env.CASH_CLOSING_EMAILS || ""
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY no configurado" }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
  const recipients = recipientsRaw.split(",").map(s => s.trim()).filter(Boolean)
  if (recipients.length === 0) {
    return new Response(JSON.stringify({ error: "CASH_CLOSING_EMAILS vacio" }), { status: 500, headers: { "Content-Type": "application/json" } })
  }

  let body: { subject?: string; html?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Body invalido" }), { status: 400, headers: { "Content-Type": "application/json" } })
  }
  if (!body.subject || !body.html) {
    return new Response(JSON.stringify({ error: "Faltan subject o html" }), { status: 400, headers: { "Content-Type": "application/json" } })
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "Corral Roses <onboarding@resend.dev>",
      to: recipients,
      subject: body.subject,
      html: body.html
    })
  })

  if (!res.ok) {
    const err = await res.text()
    return new Response(JSON.stringify({ error: err }), { status: 500, headers: { "Content-Type": "application/json" } })
  }

  const data = await res.json()
  return new Response(JSON.stringify({ ok: true, id: data.id }), { headers: { "Content-Type": "application/json" } })
}