# whoiam.love

## What this is
An AI-powered self-discovery app. Not therapy, not a companion — a *witness*.
An AI that asks deep questions, remembers everything, and builds a living
portrait of who the user is becoming.

## Tagline
"Who I am → love."

## Live URLs
- Production: https://whoiam-love.vercel.app
- GitHub: https://github.com/gvazquez/whoiam.love-
- Custom domain (pending DNS): whoiam.love (on Bluehost)

## Tech stack
- Frontend: React + Vite
- Routing: React Router v6
- AI: Anthropic Claude API (claude-sonnet-4-6)
- Serverless: Vercel api/ functions
- Styling: CSS modules (App.css + chat.css)
- Fonts: Cormorant Garamond (display) + Jost (body)
- Deployment: Vercel (auto-deploys on git push to main)

## Design language
- Palette: parchment (#f5f0e8), ink (#0e0c0a), warm gold (#c8a96e), muted (#8a7f74)
- Tone: warm, literary, intimate, minimal
- No frameworks — pure CSS with CSS variables

## File structure
src/
  pages/
    Home.jsx        ← landing page
    Chat.jsx        ← conversation UI
  styles/
    chat.css        ← chat styles
  App.jsx           ← router shell
  App.css           ← global styles + landing styles
  main.jsx          ← BrowserRouter wrapper
api/
  chat.js           ← Vercel serverless function → Anthropic API
vercel.json         ← routing config for React Router + API
.env.local          ← ANTHROPIC_API_KEY (local only, never commit)

## Current status
- ✅ Landing page live
- ✅ Chat UI built
- ✅ Vercel serverless function created (api/chat.js)
- ✅ ANTHROPIC_API_KEY added to Vercel environment variables
- 🔧 AI not responding — api/chat.js needs debugging

## Known issue
Chat returns "Something interrupted the silence" error.
api/chat.js exists but API call is failing.
Need to debug: check model name, API key access, request format.

## AI persona system prompt
You are a quiet witness to someone's inner world. Your only role is to help
them hear themselves more clearly. Ask exactly one question at a time. Never
give advice, opinions, or suggestions. Never judge or interpret. Respond in
one or two sentences at most, then ask one open, gentle question that goes
deeper than what was said. Use simple, unhurried language. If someone seems
to be in crisis, gently suggest speaking with a professional.

## Business model
- Free: first 7 sessions
- Premium: $12/mo (unlimited + memory + weekly portraits)
- Pro: $29/mo (coaches, therapists, HR teams)

## Next steps
1. Fix api/chat.js so AI responds
2. Connect whoiam.love domain (Bluehost DNS → Vercel)
3. Build user auth + persistent memory (Supabase)
4. Weekly self-portrait feature