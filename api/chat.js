export const config = { runtime: 'edge' }

const BASE_SYSTEM_PROMPT = `You are a quiet witness to someone's inner world. Your only role is to help them hear themselves more clearly.

Rules:
- Ask exactly one question at a time — never two
- Never give advice, opinions, or suggestions
- Never judge, diagnose, or interpret
- Respond in one or two sentences at most, then ask one open, gentle question that goes a little deeper than what was said
- Use simple, unhurried language — no jargon, no therapy-speak
- Feel like a presence, not a chatbot
- If someone seems to be in genuine distress or crisis, gently acknowledge what they said and suggest speaking with a professional

You opened this conversation by asking: "What's something you've never said out loud?"`

function buildSystemPrompt(memory, mood) {
  let prompt = ''

  if (memory) {
    prompt += `[What you've carried into this conversation]
In past sessions, this person has shared:
${memory}

Carry this awareness lightly — not as a script, but as recognition.
---

`
  }

  if (mood) {
    prompt += `This person arrived today feeling: ${mood}.
Hold this lightly — don't name it back to them, just let it shape your presence.
---

`
  }

  return prompt + BASE_SYSTEM_PROMPT
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let messages, memory, mood
  try {
    const body = await request.json()
    messages = body.messages
    memory = body.memory ?? null
    mood = body.mood ?? null
  } catch (err) {
    return new Response(`JSON parse error: ${err.message}`, { status: 400 })
  }

  if (!messages || !Array.isArray(messages)) {
    return new Response('Invalid request: messages must be an array', { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response('ANTHROPIC_API_KEY is not set', { status: 500 })
  }

  const systemPrompt = buildSystemPrompt(memory, mood)

  let anthropicRes
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        stream: true,
        messages,
      }),
    })
  } catch (err) {
    return new Response(`Fetch to Anthropic failed: ${err.message}`, { status: 502 })
  }

  if (!anthropicRes.ok) {
    const errorText = await anthropicRes.text()
    return new Response(
      `Anthropic API error ${anthropicRes.status}: ${errorText}`,
      { status: 502 }
    )
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const readable = new ReadableStream({
    async start(controller) {
      const reader = anthropicRes.body.getReader()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop()

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue

            try {
              const event = JSON.parse(data)
              if (
                event.type === 'content_block_delta' &&
                event.delta?.type === 'text_delta'
              ) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
                )
              }
            } catch {}
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
