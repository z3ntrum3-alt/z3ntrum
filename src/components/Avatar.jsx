import { useMemo } from 'react'

export default function Avatar({ name = '?', size = 32, hue = null }) {
  const initials = useMemo(() =>
    name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()
  , [name])

  const computedHue = hue !== null ? hue
    : (name.charCodeAt(0) * 47 + (name.charCodeAt(1) || 0) * 13) % 360

  return (
    <span
      className="q-avatar"
      style={{
        width: size,
        height: size,
        background: `oklch(0.86 0.06 ${computedHue})`,
        color: `oklch(0.32 0.1 ${computedHue})`,
        fontSize: Math.max(10, size * 0.38),
      }}
    >
      {initials}
    </span>
  )
}
