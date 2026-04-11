import Anthropic from '@anthropic-ai/sdk'

export const config = { runtime: 'edge' }

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

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let messages
  try {
    const body = await request.json()
    messages = body.messages
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (!messages || !Array.isArray(messages)) {
    return new Response('Invalid request', { status: 400 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages
        })

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta?.type === 'text_delta'
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            )
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Something went wrong' })}\n\n`)
        )
        controller.close()
      }
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
  })
}
