import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Pricing from './pages/Pricing'
import Enter from './pages/Enter'

function ProtectedChat() {
  if (!localStorage.getItem('whoiam_access')) {
    return <Navigate to="/enter" replace />
  }
  return <Chat />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<ProtectedChat />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/enter" element={<Enter />} />
    </Routes>
  )
}
