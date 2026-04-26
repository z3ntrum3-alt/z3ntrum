import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Icon from '../components/Icon.jsx'
import Spinner from '../components/Spinner.jsx'
import { supabase, fmt } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'

export default function Notifications() {
  const { profile } = useAuth()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    fetchNotifs()

    const ch = supabase.channel(`notifs_${profile.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${profile.id}`,
      }, payload => {
        setNotifs(n => [payload.new, ...n])
      })
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [profile?.id])

  const fetchNotifs = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    if (data) setNotifs(data)
    setLoading(false)
  }

  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false)
    setNotifs(n => n.map(x => ({ ...x, read: true })))
  }

  const dismiss = async (id) => {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifs(n => n.filter(x => x.id !== id))
  }

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x))
  }

  const iconFor = (type) => {
    if (type === 'messages') return 'messages'
    if (type === 'help')     return 'sparkle'
    if (type === 'events')   return 'events'
    return 'bell'
  }

  const unread = notifs.filter(n => !n.read).length

  return (
    <div className="q-page">
      <Sidebar />
      <main className="q-main">
        <div style={{ maxWidth: 560, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 24 }}>Notifications</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                {unread > 0 ? `${unread} unread` : 'All caught up'}
              </p>
            </div>
            {unread > 0 && (
              <button className="q-btn q-btn-ghost q-btn-sm" onClick={markAllRead}>Mark all read</button>
            )}
          </div>

          {loading ? <Spinner /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className="q-card"
                  style={{
                    padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
                    background: n.read ? 'var(--surface)' : 'color-mix(in oklch, var(--accent) 5%, var(--surface))',
                    borderColor: n.read ? 'var(--border)' : 'color-mix(in oklch, var(--accent) 28%, transparent)',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: n.read ? 'var(--surface-2)' : 'var(--accent-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
                  }}>
                    <Icon name={iconFor(n.type)} size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, lineHeight: 1.5, fontWeight: n.read ? 400 : 500 }}>{n.text}</p>
                    <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmt(n.created_at)} ago</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {!n.read && <div style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--accent)' }} />}
                    <button
                      className="q-btn q-btn-ghost q-btn-sm"
                      style={{ width: 26, height: 26, padding: 0, borderRadius: 6 }}
                      onClick={e => { e.stopPropagation(); dismiss(n.id) }}
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {notifs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)' }}>
                  <Icon name="sparkle" size={28} stroke="var(--border-strong)" />
                  <p style={{ marginTop: 12, fontSize: 14 }}>No notifications yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
