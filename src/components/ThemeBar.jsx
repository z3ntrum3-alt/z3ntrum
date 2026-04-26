import { useTheme } from '../context/ThemeContext.jsx'
import Icon from './Icon.jsx'

export default function ThemeBar() {
  const { accent, setAccent, theme, setTheme, ACCENTS } = useTheme()

  return (
    <div className="theme-bar">
      <Icon name="palette" size={13} />
      {Object.entries(ACCENTS).map(([key, val]) => (
        <button
          key={key}
          className={accent === key ? 'selected' : ''}
          style={{ background: val.color }}
          title={val.name}
          onClick={() => setAccent(key)}
        />
      ))}
      <div style={{ width: 1, height: 14, background: 'var(--border-strong)', margin: '0 2px' }} />
      <button
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 4px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          borderRadius: 4,
        }}
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        title="Toggle theme"
      >
        <Icon name={theme === 'light' ? 'moon' : 'sun'} size={14} />
      </button>
    </div>
  )
}
