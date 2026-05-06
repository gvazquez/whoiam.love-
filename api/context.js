export const config = { runtime: 'edge' }

import { createClient } from '@supabase/supabase-js'

const MAX_CHARS_PER_CONVERSATION = 600
const MAX_CONVERSATIONS = 3

export default async function handler(request) {
  if (request.method !== 'GET') {
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

  // Fetch the last N conversations (excluding the very latest, which is the current session)
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .range(1, MAX_CONVERSATIONS) // skip index 0 (current session)

  if (!conversations || conversations.length === 0) {
    return new Response(JSON.stringify({ memory: null }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const conversationIds = conversations.map(c => c.id)

  const { data: messages } = await supabase
    .from('messages')
    .select('content, role, created_at, conversation_id')
    .in('conversation_id', conversationIds)
    .eq('role', 'user')
    .order('created_at', { ascending: true })

  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ memory: null }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Group by conversation, cap each conversation's contribution
  const byConversation = {}
  for (const msg of messages) {
    if (!byConversation[msg.conversation_id]) byConversation[msg.conversation_id] = []
    byConversation[msg.conversation_id].push(msg.content)
  }

  const excerpts = []
  for (const convId of conversationIds) {
    const msgs = byConversation[convId]
    if (!msgs) continue
    const joined = msgs.join(' ').slice(0, MAX_CHARS_PER_CONVERSATION)
    excerpts.push(`"${joined}"`)
  }

  const memory = excerpts.length > 0 ? excerpts.join('\n') : null

  return new Response(JSON.stringify({ memory }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
