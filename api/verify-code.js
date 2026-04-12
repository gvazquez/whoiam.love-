export const config = { runtime: 'edge' }

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let code
  try {
    const body = await request.json()
    code = body.code
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const validCode = process.env.INVITE_CODE
  if (!validCode) {
    return new Response('INVITE_CODE is not configured', { status: 500 })
  }

  if (code === validCode) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: false }), { status: 401 })
}
