export const config = { runtime: 'edge' }

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const rawBody = await request.text()
  const sig = request.headers.get('stripe-signature')

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
  })

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider()
    )
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.user_id
      if (userId) {
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            stripe_subscription_id: session.subscription,
          })
          .eq('id', userId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      await supabase
        .from('profiles')
        .update({ subscription_status: 'canceled' })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      await supabase
        .from('profiles')
        .update({ subscription_status: 'canceled' })
        .eq('stripe_customer_id', invoice.customer)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
