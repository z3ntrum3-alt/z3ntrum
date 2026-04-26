export default function Spinner({ size = 24 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: '2.5px solid var(--border-strong)',
        borderTopColor: 'var(--accent)',
        animation: 'q-spin 0.7s linear infinite',
      }} />
    </div>
  )
}
