export const config = { runtime: 'edge' }

import { createClient } from '@supabase/supabase-js'

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  let mood = null
  try {
    const body = await request.json()
    mood = body.mood ?? null
  } catch {}

  const { data, error: insertError } = await supabase
    .from('conversations')
    .insert({ user_id: user.id, mood_checkin: mood })
    .select('id')
    .single()

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ id: data.id }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
