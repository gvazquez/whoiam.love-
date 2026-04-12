export const config = { runtime: 'edge' }

export default async function handler(request) {
  return new Response('edge ok', { status: 200 })
}
