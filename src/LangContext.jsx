import { createContext, useContext, useState } from 'react'
import { translations } from './lang'

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('whoiam_lang')
    if (saved === 'en' || saved === 'es') return saved
    return navigator.language?.startsWith('es') ? 'es' : 'en'
  })

  const toggle = () => {
    const next = lang === 'en' ? 'es' : 'en'
    setLang(next)
    localStorage.setItem('whoiam_lang', next)
  }

  return (
    <LangContext.Provider value={{ lang, toggle, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
