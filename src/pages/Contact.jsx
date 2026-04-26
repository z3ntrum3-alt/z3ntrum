import { useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Icon from '../components/Icon.jsx'
import { supabase, fullName } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'

const REQUEST_TYPES = [
  'Change Username',
  'Change Display Name',
  'Change Section / Year',
  'Change Department',
  'Account Issue',
  'Report a Bug',
  'Other',
]

export default function Contact() {
  const { profile } = useAuth()
  const name = profile ? fullName(profile) : ''

  const [requestType, setRequestType] = useState('')
  const [message, setMessage]         = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [submitted, setSubmitted]     = useState(false)
  const [error, setError]             = useState('')

  const handleSubmit = async () => {
    if (!requestType || !message.trim()) {
      setError('Please select a request type and describe your issue.')
      return
    }
    setSubmitting(true)
    setError('')

    const { error: err } = await supabase.from('contact_requests').insert({
      user_id:      profile.id,
      request_type: requestType,
      message:      message.trim(),
    })

    if (err) {
      setError(err.message)
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="q-page">
        <Sidebar />
        <main className="q-main">
          <div style={{ maxWidth: 520, margin: '0 auto', paddingTop: 60, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'color-mix(in oklch, var(--success) 15%, transparent)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, marginBottom: 20,
            }}>✓</div>
            <h1 style={{ fontSize: 22, marginBottom: 8 }}>Request sent!</h1>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 360, margin: '0 auto 24px' }}>
              We've received your request and will get back to you within 2–3 working days.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              Reach us directly at{' '}
              <a href="mailto:z3ntrum3@gmail.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                z3ntrum3@gmail.com
              </a>
            </p>
            <button
              className="q-btn q-btn-secondary"
              style={{ marginTop: 24 }}
              onClick={() => { setSubmitted(false); setRequestType(''); setMessage('') }}
            >
              Submit another request
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="q-page">
      <Sidebar />
      <main className="q-main">
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26 }}>Contact Us</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.55 }}>
              Need something changed on your account, or have a bug to report? We'll sort it out.
            </p>
          </div>

          <div className="q-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Name</label>
                <input className="q-input" value={name} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Email</label>
                <input className="q-input" value={profile?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>What do you need? *</label>
              <select
                className="q-input"
                value={requestType}
                onChange={e => setRequestType(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select a request type…</option>
                {REQUEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Describe your request *</label>
              <textarea
                className="q-textarea"
                rows={5}
                placeholder={
                  requestType === 'Change Username'     ? 'Current username: @old  →  New username: @new' :
                  requestType === 'Change Display Name' ? 'Current name: …  →  Correct name: …' :
                  requestType === 'Report a Bug'        ? 'What happened, what page, and how to reproduce it…' :
                  'Describe what you need in as much detail as possible…'
                }
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            {error && <p style={{ fontSize: 12.5, color: 'var(--danger)', margin: 0 }}>{error}</p>}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <p style={{ fontSize: 11.5, color: 'var(--text-faint)', lineHeight: 1.5, margin: 0 }}>
                Or email us directly at{' '}
                <a href="mailto:z3ntrum3@gmail.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                  z3ntrum3@gmail.com
                </a>
              </p>
              <button
                className="q-btn q-btn-primary"
                style={{ flexShrink: 0 }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
