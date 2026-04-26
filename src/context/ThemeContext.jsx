import { createContext, useContext, useEffect, useState } from 'react'

const ACCENTS = {
  indigo: { hue: 280, name: 'Indigo', color: '#6366f1' },
  coral:  { hue: 30,  name: 'Coral',  color: '#f97316' },
  forest: { hue: 150, name: 'Forest', color: '#22c55e' },
  amber:  { hue: 75,  name: 'Amber',  color: '#eab308' },
  blue:   { hue: 240, name: 'Blue',   color: '#3b82f6' },
  rose:   { hue: 0,   name: 'Rose',   color: '#ef4444' },
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [accent, setAccent] = useState('indigo')
  const [theme, setTheme] = useState('light')
  const [density, setDensity] = useState('cozy')

  useEffect(() => {
    const root = document.documentElement
    const a = ACCENTS[accent] || ACCENTS.indigo
    const isDark = theme === 'dark'
    root.style.setProperty('--accent', `oklch(${isDark ? 0.7 : 0.42} 0.14 ${a.hue})`)
    root.style.setProperty('--accent-strong', `oklch(${isDark ? 0.78 : 0.36} 0.16 ${a.hue})`)
    root.style.setProperty('--accent-soft', `oklch(${isDark ? 0.28 : 0.95} ${isDark ? 0.08 : 0.04} ${a.hue})`)
    root.dataset.theme = theme
    root.dataset.density = density
  }, [accent, theme, density])

  return (
    <ThemeContext.Provider value={{ accent, setAccent, theme, setTheme, density, setDensity, ACCENTS }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
export { ACCENTS }
