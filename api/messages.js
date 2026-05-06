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

  let conversation_id, user_message, assistant_message
  try {
    const body = await request.json()
    conversation_id = body.conversation_id
    user_message = body.user_message
    assistant_message = body.assistant_message
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (!conversation_id || !user_message || !assistant_message) {
    return new Response('Missing fields', { status: 400 })
  }

  await supabase.from('messages').insert([
    { conversation_id, user_id: user.id, role: 'user', content: user_message },
    { conversation_id, user_id: user.id, role: 'assistant', content: assistant_message },
  ])

  // Check portrait trigger: >= 3 conversations total, no portrait yet
  const [convResult, portraitResult] = await Promise.all([
    supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('weekly_portraits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  const shouldGeneratePortrait =
    (convResult.count ?? 0) >= 3 && (portraitResult.count ?? 0) === 0

  return new Response(JSON.stringify({ saved: true, shouldGeneratePortrait }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
