import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a quiet witness to someone's inner world. Your only role is to help them hear themselves more clearly.

Rules:
- Ask exactly one question at a time — never two
- Never give advice, opinions, or suggestions
- Never judge, diagnose, or interpret
- Respond in one or two sentences at most, then ask one open, gentle question that goes a little deeper than what was said
- Use simple, unhurried language — no jargon, no therapy-speak
- Feel like a presence, not a chatbot
- If someone seems to be in genuine distress or crisis, gently acknowledge what they said and suggest speaking with a professional`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request' })
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages
    })

    res.json({ content: response.content[0].text })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
}
