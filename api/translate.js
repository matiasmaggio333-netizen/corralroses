export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()
  const { text, targetLang } = req.body
  const response = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${process.env.VITE_DEEPL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: [text], target_lang: targetLang, source_lang: "ES" }),
  })
  const data = await response.json()
  res.status(200).json({ translation: data.translations?.[0]?.text ?? text })
}