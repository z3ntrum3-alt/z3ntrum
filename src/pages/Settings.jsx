import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Icon from '../components/Icon.jsx'
import Avatar from '../components/Avatar.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase, fullName } from '../lib/supabase'

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 15, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'start' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 3, lineHeight: 1.5 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button role="switch" aria-checked={value} onClick={() => onChange(!value)} style={{
      width: 36, height: 20, borderRadius: 999, border: 'none', padding: 0,
      background: value ? 'var(--accent)' : 'var(--border-strong)',
      position: 'relative', cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 3, left: value ? 19 : 3,
        width: 14, height: 14, borderRadius: 999, background: '#fff',
        transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', display: 'block',
      }} />
    </button>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { theme, setTheme, density, setDensity } = useTheme()
  const { profile, signOut, refetch } = useAuth()

  const [firstName, setFirstName]   = useState('')
  const [lastName, setLastName]     = useState('')
  const [username, setUsername]     = useState('')
  const [bio, setBio]               = useState('')
  const [website, setWebsite]       = useState('')
  const [saved, setSaved]           = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saveError, setSaveError]   = useState('')

  const [notifHelp,     setNotifHelp]     = useState(true)
  const [notifMessages, setNotifMessages] = useState(true)
  const [notifEvents,   setNotifEvents]   = useState(false)
  const [notifEmail,    setNotifEmail]    = useState(true)

  const [profilePublic, setProfilePublic] = useState(true)
  const [showSection,   setShowSection]   = useState(true)
  const [showDept,      setShowDept]      = useState(true)

  const [deleteModal,   setDeleteModal]   = useState(false)
  const [deleting,      setDeleting]      = useState(false)

  useEffect(() => {
    if (!profile) return
    setFirstName(profile.first_name || '')
    setLastName(profile.last_name || '')
    setUsername((profile.username || '').replace('@', ''))
    setBio(profile.bio || '')
    setWebsite(profile.website || '')
  }, [profile])

  const usernameChangedAt = profile?.username_changed_at ? new Date(profile.username_changed_at) : null
  const usernameLockedUntil = usernameChangedAt ? new Date(usernameChangedAt.getTime() + 60 * 24 * 60 * 60 * 1000) : null
  const usernameLockedDaysLeft = usernameLockedUntil
    ? Math.ceil((usernameLockedUntil - Date.now()) / (24 * 60 * 60 * 1000))
    : 0
  const usernameChanged = username.trim() !== (profile?.username || '').replace(/^@/, '')
  const usernameLocked = usernameChanged && usernameLockedDaysLeft > 0

  const handleSave = async () => {
    if (saving) return
    if (usernameLocked) {
      setSaveError(`Username can only be changed once every 60 days. ${usernameLockedDaysLeft} day${usernameLockedDaysLeft !== 1 ? 's' : ''} remaining.`)
      return
    }
    setSaving(true)
    setSaveError('')

    const newUsername = `@${username.trim().replace(/^@/, '')}`
    const updates = {
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      username:   newUsername,
      bio:        bio.trim(),
      website:    website.trim(),
    }
    if (usernameChanged) updates.username_changed_at = new Date().toISOString()

    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id)

    if (error) {
      setSaveError(error.message)
    } else {
      setSaved(true)
      refetch()
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    // Delete user data (cascade handles posts, messages, notifications via FK)
    await supabase.from('profiles').delete().eq('id', profile.id)
    await signOut()
    navigate('/login')
  }

  const name = profile ? fullName(profile) : '…'

  return (
    <div className="q-page">
      <Sidebar />
      <main className="q-main">
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26 }}>Settings</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Manage your account, appearance, and privacy.
            </p>
          </div>

          <Section title="Account">
            <Field label="Photo">
              <Avatar name={name} size={52} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>First name</label>
                <input className="q-input" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Last name</label>
                <input className="q-input" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>

            <Field label="Username" hint={
              usernameLockedDaysLeft > 0
                ? `Locked for ${usernameLockedDaysLeft} more day${usernameLockedDaysLeft !== 1 ? 's' : ''} — can only change once every 60 days.`
                : 'Shown on your profile and posts. Can only be changed once every 60 days.'
            }>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-faint)', fontSize: 14 }}>@</span>
                <input
                  className="q-input"
                  style={{ paddingLeft: 26, opacity: usernameLockedDaysLeft > 0 ? 0.6 : 1 }}
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-z0-9._]/gi, '').toLowerCase())}
                />
              </div>
            </Field>

            <Field label="Email" hint="Used for login. Cannot be changed.">
              <input className="q-input" value={profile?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </Field>

            <Field label="Bio">
              <textarea className="q-textarea" rows={2} value={bio} onChange={e => setBio(e.target.value)} style={{ minHeight: 64 }} />
            </Field>

            <Field label="Website">
              <input className="q-input" placeholder="yourname.com" value={website} onChange={e => setWebsite(e.target.value)} />
            </Field>

            {saveError && <p style={{ fontSize: 12.5, color: 'var(--danger)', margin: 0 }}>{saveError}</p>}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="q-btn q-btn-primary" onClick={handleSave} disabled={saving}>
                {saved ? <><Icon name="check" size={14} /> Saved</> : saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </Section>

          <Section title="Appearance">
            <Field label="Theme" hint="Switch between light and dark mode.">
              <div className="q-tabs">
                <button className={`q-tab${theme === 'light' ? ' active' : ''}`} onClick={() => setTheme('light')}>
                  <Icon name="sun" size={13} /> Light
                </button>
                <button className={`q-tab${theme === 'dark' ? ' active' : ''}`} onClick={() => setTheme('dark')}>
                  <Icon name="moon" size={13} /> Dark
                </button>
              </div>
            </Field>
            <Field label="Density" hint="Compact reduces padding throughout the app.">
              <div className="q-tabs">
                <button className={`q-tab${density === 'cozy'    ? ' active' : ''}`} onClick={() => setDensity('cozy')}>Cozy</button>
                <button className={`q-tab${density === 'compact' ? ' active' : ''}`} onClick={() => setDensity('compact')}>Compact</button>
              </div>
            </Field>
          </Section>

          <Section title="Notifications">
            <Field label="Help requests" hint="When someone responds to your help post.">
              <Toggle value={notifHelp} onChange={setNotifHelp} />
            </Field>
            <Field label="Messages" hint="New DMs and community mentions.">
              <Toggle value={notifMessages} onChange={setNotifMessages} />
            </Field>
            <Field label="Events" hint="Reminders for upcoming campus events.">
              <Toggle value={notifEvents} onChange={setNotifEvents} />
            </Field>
            <Field label="Email digest" hint="Weekly summary sent to your college email.">
              <Toggle value={notifEmail} onChange={setNotifEmail} />
            </Field>
          </Section>

          <Section title="Privacy">
            <Field label="Public profile" hint="Anyone on Z3NTRUM can view your profile.">
              <Toggle value={profilePublic} onChange={setProfilePublic} />
            </Field>
            <Field label="Show section" hint="Display your section on your profile.">
              <Toggle value={showSection} onChange={setShowSection} />
            </Field>
            <Field label="Show department" hint="Display your department tag.">
              <Toggle value={showDept} onChange={setShowDept} />
            </Field>
          </Section>

          <Section title="Danger zone">
            <Field label="Delete account" hint="Permanently removes your profile, posts, and messages. This cannot be undone.">
              <button className="q-btn q-btn-danger" onClick={() => setDeleteModal(true)}>Delete my account</button>
            </Field>
          </Section>
        </div>
      </main>

      {deleteModal && (
        <div className="q-modal-backdrop" onClick={() => setDeleteModal(false)}>
          <div className="q-modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 8, color: 'var(--danger)' }}>Delete account?</h2>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
              This will permanently delete your profile, all your posts, messages, and notifications. There is no way to undo this.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="q-btn q-btn-ghost" onClick={() => setDeleteModal(false)}>Cancel</button>
              <button className="q-btn q-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, delete everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
