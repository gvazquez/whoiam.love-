export const config = { runtime: 'edge' }

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let email
  try {
    const body = await request.json()
    email = body.email
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (!email || !email.includes('@')) {
    return new Response('Invalid email', { status: 400 })
  }

  // Logged to Vercel function logs — visible in dashboard under Functions tab
  console.log(`[waitlist] ${new Date().toISOString()} — ${email}`)

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
