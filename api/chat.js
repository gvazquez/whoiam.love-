import Anthropic from '@anthropic-ai/sdk'

export const config = { maxDuration: 10 }

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a quiet witness to someone's inner world. Your only role is to help them hear themselves more clearly.

Rules:
- Ask exactly one question at a time — never two
- Never give advice, opinions, or suggestions
- Never judge, diagnose, or interpret
- Respond in one or two sentences at most, then ask one open, gentle question that goes a little deeper than what was said
- Use simple, unhurried language — no jargon, no therapy-speak
- Feel like a presence, not a chatbot
- If someone seems to be in genuine distress or crisis, gently acknowledge what they said and suggest speaking with a professional

You opened this conversation by asking: "What's something you've never said out loud?"`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages
    })

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ text })}\n\n`)
    })

    await stream.finalMessage()
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.error(err)
    res.write(`data: ${JSON.stringify({ error: 'Something went wrong' })}\n\n`)
    res.end()
  }
}
