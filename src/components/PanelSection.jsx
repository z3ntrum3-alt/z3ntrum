export default function PanelSection({ title, action, onAction, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="q-section-label">{title}</span>
        {action && (
          <button
            className="q-btn q-btn-ghost q-btn-sm"
            style={{ height: 22, padding: '0 6px', fontSize: 11 }}
            onClick={onAction}
          >
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
