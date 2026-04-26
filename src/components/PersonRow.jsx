import { useState } from 'react'
import Avatar from './Avatar.jsx'
import Icon from './Icon.jsx'

export default function PersonRow({ p, action = 'Add Friend' }) {
  const [connected, setConnected] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Avatar name={p.name} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{p.dept} · Section {p.section}</div>
      </div>
      <button
        className="q-btn q-btn-sm"
        style={connected ? {
          background: 'color-mix(in oklch, var(--success) 12%, transparent)',
          color: 'var(--success)',
          border: '1px solid color-mix(in oklch, var(--success) 30%, transparent)',
        } : { border: '1px solid var(--border-strong)', color: 'var(--text)' }}
        onClick={() => setConnected(c => !c)}
      >
        {connected ? <><Icon name="check" size={12} /> Connected</> : action}
      </button>
    </div>
  )
}
