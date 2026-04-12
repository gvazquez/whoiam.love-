import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Pricing from './pages/Pricing'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/pricing" element={<Pricing />} />
    </Routes>
  )
}
