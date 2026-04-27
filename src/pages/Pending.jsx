import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, fullName } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'

export default function Pending() {
  const { user, profile, signOut, updateProfile } = useAuth()
  const navigate = useNavigate()
  const name = profile ? fullName(profile) : ''

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('my_profile_status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, async (payload) => {
        if (payload.eventType === 'DELETE') {
          // Rejected — account wiped, force sign out → Guard sends to /login
          await supabase.auth.signOut()
        } else if (payload.new?.status === 'approved') {
          // Approved — update context immediately and go to app
          updateProfile(payload.new)
          navigate('/home', { replace: true })
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: 'color-mix(in oklch, var(--accent) 15%, transparent)',
          display: 'inline-flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: 20,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Pending approval{name ? `, ${name.split(' ')[0]}` : ''}</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 28, maxWidth: 360, margin: '0 auto 28px' }}>
          Your details are being reviewed by an admin. You'll get full access as soon as you're approved — usually within a few hours.
        </p>

        <div className="q-card" style={{ padding: '16px 20px', textAlign: 'left', marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Your details
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Name',       fullName(profile)],
              ['Username',   profile?.username],
              ['USN',        profile?.usn],
              ['Department', profile?.department],
              ['Section',    profile?.section ? `Section ${profile.section}` : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="q-btn q-btn-ghost" style={{ fontSize: 13 }} onClick={signOut}>
          Sign out
        </button>
      </div>
    </div>
  )
}
