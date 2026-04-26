import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import Avatar from './Avatar.jsx'
import Icon from './Icon.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase, fullName } from '../lib/supabase.js'

const NAV_ITEMS = [
  { id: 'home',          label: 'Home',         icon: 'home',      path: '/home' },
  { id: 'help',          label: 'Help Feed',     icon: 'help',      path: '/help' },
  { id: 'messages',      label: 'Messages',      icon: 'messages',  path: '/messages' },
  { id: 'events',        label: 'Events',        icon: 'events',    path: '/events' },
  { id: 'notifications', label: 'Notifications', icon: 'bell',      path: '/notifications' },
  { id: 'search',        label: 'Search',        icon: 'search',    path: '/search' },
  { id: 'profile',       label: 'Profile',       icon: 'profile',   path: '/profile' },
]

const ADMIN_EMAILS = ['dwiraj06@gmail.com', 'pramod.gowdaaaaa@gmail.com', 'saisugeet20044@gmail.com']

export default function Sidebar({ badges = {} }) {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { profile, signOut } = useAuth()
  const [unreadMsgs,   setUnreadMsgs]   = useState(0)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (!profile) return

    const fetchCounts = async () => {
      const queries = [
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', profile.id).eq('read', false),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', profile.id).eq('read', false),
      ]
      if (isAdmin) queries.push(
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('status', 'pending')
      )
      const [{ count: msgs }, { count: notifs }, pendingRes] = await Promise.all(queries)
      setUnreadMsgs(msgs || 0)
      setUnreadNotifs(notifs || 0)
      if (isAdmin && pendingRes) setPendingCount(pendingRes.count || 0)
    }

    fetchCounts()

    const ch = supabase.channel('sidebar_counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages',      filter: `receiver_id=eq.${profile.id}` }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },     fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchCounts)
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [profile?.id])

  const liveBadges = {
    ...badges,
    messages:      unreadMsgs   > 0 ? unreadMsgs   : undefined,
    notifications: unreadNotifs > 0 ? unreadNotifs : undefined,
    admin:         pendingCount > 0 ? pendingCount : undefined,
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const name = profile ? fullName(profile) : '…'
  const username = profile?.username || ''

  return (
    <aside className="q-sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px 14px' }}>
        <span className="q-brand" style={{ fontSize: 26 }}>Z3NTRUM</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `q-nav-item${isActive ? ' active' : ''}`}
            style={{ textDecoration: 'none', color: 'var(--accent)' }}
          >
            <Icon name="shield" size={16} />
            <span style={{ fontWeight: 600 }}>Admin Panel</span>
            {liveBadges.admin && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', marginLeft: 'auto', flexShrink: 0 }} />}
          </NavLink>
        )}
        {NAV_ITEMS.map(it => (
          <NavLink
            key={it.id}
            to={it.path}
            className={({ isActive }) => `q-nav-item${isActive ? ' active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <Icon name={it.icon} size={16} />
            <span>{it.label}</span>
            {liveBadges[it.id] && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginLeft: 'auto', flexShrink: 0 }} />}
          </NavLink>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px 8px' }}>
          <Avatar name={name} size={28} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>{name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{username}</div>
          </div>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
            style={{
              width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)',
              background: 'var(--surface-2)', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
            }}
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} size={14} />
          </button>
        </div>
        <button className="q-nav-item" style={{ height: 30, fontSize: 12.5, width: '100%', border: 'none' }} onClick={() => navigate('/settings')}>
          <Icon name="settings" size={14} /><span>Settings</span>
        </button>
        <button className="q-nav-item" style={{ height: 30, fontSize: 12.5, width: '100%', border: 'none' }} onClick={() => navigate('/contact')}>
          <Icon name="help" size={14} /><span>Contact</span>
        </button>
        <button className="q-nav-item" style={{ height: 30, fontSize: 12.5, width: '100%', border: 'none' }} onClick={handleLogout}>
          <Icon name="logout" size={14} /><span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
