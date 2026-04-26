import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'
import Spinner from '../components/Spinner.jsx'

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication Engineering',
  'Information Science & Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical & Electronics Engineering',
  'Artificial Intelligence & Machine Learning',
  'Data Science',
  'Chemical Engineering',
  'Biotechnology',
]

const YEARS    = ['1', '2', '3', '4']
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function CompleteProfile() {
  const navigate = useNavigate()
  const { user, profile, loading, refetch, updateProfile } = useAuth()

  const [firstName,  setFirstName]  = useState('')
  const [lastName,   setLastName]   = useState('')
  const [username,   setUsername]   = useState('')
  const [usn,        setUsn]        = useState('')
  const [department, setDepartment] = useState('')
  const [year,       setYear]       = useState('')
  const [section,    setSection]    = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    if (!profile) return
    setFirstName(profile.first_name   || '')
    setLastName(profile.last_name     || '')
    setUsername((profile.username     || '').replace(/^@/, ''))
    setUsn(profile.usn                || '')
    setDepartment(profile.department  || '')
    setYear(profile.year              || '')
    setSection(profile.section        || '')
  }, [profile])

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !username.trim() ||
        !usn.trim() || !department || !year || !section) {
      setError('Please fill in all fields before continuing.')
      return
    }
    setSaving(true)
    setError('')

    const updates = {
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      username:   `@${username.trim().replace(/^@/, '')}`,
      usn:        usn.trim().toUpperCase(),
      department,
      year,
      section,
    }

    let err

    if (profile) {
      const { error: e } = await supabase.from('profiles').update(updates).eq('id', profile.id)
      err = e
    } else {
      const { error: e } = await supabase.rpc('create_profile', {
        p_email:        user.email,
        p_first_name:   firstName.trim(),
        p_last_name:    lastName.trim(),
        p_username:     `@${username.trim().replace(/^@/, '')}`,
        p_department:   department,
        p_year:         year,
        p_section:      section,
        p_usn:          usn.trim().toUpperCase(),
        p_id_card_path: null,
      })
      err = e
    }

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    updateProfile({ ...updates, id: user.id, email: user.email, status: profile?.status || 'pending', role: profile?.role || 'student' })
    refetch()
    navigate('/home')
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, marginBottom: 6 }}>Complete your profile</h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Fill in your details — an admin will review and approve your Z3NTRUM account.
          </p>
        </div>

        <div className="q-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>First name *</label>
              <input className="q-input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Last name *</label>
              <input className="q-input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Username *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-faint)', fontSize: 14 }}>@</span>
              <input
                className="q-input"
                style={{ paddingLeft: 26 }}
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-z0-9._]/gi, '').toLowerCase())}
                placeholder="username"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>USN *</label>
            <input
              className="q-input"
              value={usn}
              onChange={e => setUsn(e.target.value)}
              placeholder="1XX21CS000"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Department *</label>
            <select className="q-input" value={department} onChange={e => setDepartment(e.target.value)} style={{ cursor: 'pointer' }}>
              <option value="">Select department…</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Year *</label>
              <select className="q-input" value={year} onChange={e => setYear(e.target.value)} style={{ cursor: 'pointer' }}>
                <option value="">Year…</option>
                {YEARS.map(y => <option key={y} value={y}>{y === '1' ? '1st' : y === '2' ? '2nd' : y === '3' ? '3rd' : '4th'} Year</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Section *</label>
              <select className="q-input" value={section} onChange={e => setSection(e.target.value)} style={{ cursor: 'pointer' }}>
                <option value="">Section…</option>
                {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
          </div>

          {error && <p style={{ fontSize: 12.5, color: 'var(--danger)', margin: 0 }}>{error}</p>}

          <button
            className="q-btn q-btn-primary"
            style={{ width: '100%', height: 44, fontSize: 14, marginTop: 4 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Submit for approval →'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-faint)', marginTop: 16 }}>
          Logged in as {user?.email}
        </p>
      </div>
    </div>
  )
}
