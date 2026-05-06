import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Pricing from './pages/Pricing'
import Enter from './pages/Enter'
import Auth from './pages/Auth'
import Portrait from './pages/Portrait'

function PortraitRoute() {
  const { user, profile, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/auth" replace />
  if (profile?.subscription_status !== 'active') return <Navigate to="/pricing" replace />
  return <Portrait />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/enter" element={<Enter />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/portrait" element={<PortraitRoute />} />
    </Routes>
  )
}
