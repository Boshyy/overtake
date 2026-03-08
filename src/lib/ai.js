export async function generateQuestionsFromText(text) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `From these revision notes, generate exactly 12 multiple choice quiz questions.
Return ONLY a JSON array, no markdown, no preamble, no backticks.
Format: [{"q":"question text","options":["A) option","B) option","C) option","D) option"],"a":"A"}]
The "a" field must be exactly "A", "B", "C", or "D".
Keep answers short (1-5 words). Make questions test real understanding.

Notes:
${text.substring(0, 4000)}`
      }]
    })
  })
  const data = await response.json()
  const txt = data.content.map(i => i.text || '').join('')
  const clean = txt.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export async function extractTextFromPDF(base64Data) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64Data }
          },
          { type: 'text', text: 'Extract all the text content from this document. Return only the raw text, no commentary.' }
        ]
      }]
    })
  })
  const data = await response.json()
  return data.content.map(i => i.text || '').join('')
}