import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export async function generateQuestionsFromText(text) {
  const prompt = `From these revision notes, generate exactly 12 multiple choice quiz questions.
Return ONLY a JSON array, no markdown, no preamble, no backticks.
Format: [{"q":"question text","options":["A) option","B) option","C) option","D) option"],"a":"A"}]
The "a" field must be exactly "A", "B", "C", or "D".
Keep answers short (1-5 words). Make questions test real understanding.

Notes:
${text.substring(0, 4000)}`

  const result = await model.generateContent(prompt)
  const txt = result.response.text()
  const clean = txt.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export async function extractTextFromPDF(base64Data) {
  const result = await model.generateContent([
    'Extract all the text content from this document. Return only the raw text, no commentary.',
    { inlineData: { mimeType: 'application/pdf', data: base64Data } }
  ])
  return result.response.text()
}