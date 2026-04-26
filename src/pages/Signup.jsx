import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Icon from '../components/Icon.jsx'

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

function Field({ label, hint, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
        {label}{required && <span style={{ color: 'var(--accent)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11.5, color: 'var(--text-faint)', margin: 0, lineHeight: 1.5 }}>{hint}</p>}
    </div>
  )
}

function SectionHeader({ number, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 4px', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
      <span style={{
        width: 22, height: 22, borderRadius: 999, background: 'var(--accent)', color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>{number}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</span>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function Signup() {
  const navigate = useNavigate()

  const [firstName,       setFirstName]       = useState('')
  const [lastName,        setLastName]        = useState('')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [dept,            setDept]            = useState('')
  const [year,            setYear]            = useState('')
  const [section,         setSection]         = useState('')
  const [usn,             setUsn]             = useState('')
  const [agreed,          setAgreed]          = useState(false)
  const [errors,          setErrors]          = useState({})
  const [loading,         setLoading]         = useState(false)
  const [serverError,     setServerError]     = useState('')

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const pwMatch = password && confirmPassword && password === confirmPassword

  const validate = () => {
    const e = {}
    if (!firstName.trim()) e.firstName = 'Required'
    if (!lastName.trim())  e.lastName  = 'Required'
    if (!email.includes('@')) e.email  = 'Enter a valid email'
    if (password.length < 8)  e.password = 'At least 8 characters'
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match'
    if (!dept)    e.dept    = 'Select your department'
    if (!year)    e.year    = 'Select your year'
    if (!section) e.section = 'Select your section'
    if (!usn.trim()) e.usn  = 'USN is required'
    if (!agreed)  e.agreed  = 'You must agree to continue'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setServerError('')

    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password })
      if (authErr) throw authErr

      if (!authData.session) {
        throw new Error('Please check your email to confirm your account, then sign in.')
      }

      await supabase.auth.setSession({
        access_token:  authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      })

      const username = `@${firstName.toLowerCase()}.${lastName.toLowerCase()}`
      const { error: profileErr } = await supabase.rpc('create_profile', {
        p_email:        email,
        p_first_name:   firstName.trim(),
        p_last_name:    lastName.trim(),
        p_username:     username,
        p_department:   dept,
        p_year:         year,
        p_section:      section,
        p_usn:          usn.trim(),
        p_id_card_path: null,
      })
      if (profileErr) throw profileErr

      navigate('/home')
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: '100%', minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', padding: '40px 24px 60px',
    }}>

      <div style={{
        width: '100%', maxWidth: 520,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '28px 28px 32px',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Create your account</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Already have one?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          style={{
            width: '100%', height: 44, borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', background: 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer',
            color: 'var(--text)', marginBottom: 20, transition: 'background 0.15s',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--surface-2)'}
          onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
        >
          <GoogleIcon /> Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>or sign up with email</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionHeader number="1" title="Personal details" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="First name" required>
              <input className="q-input" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} />
              {errors.firstName && <span style={{ fontSize: 11.5, color: 'var(--danger)' }}>{errors.firstName}</span>}
            </Field>
            <Field label="Last name" required>
              <input className="q-input" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} />
              {errors.lastName && <span style={{ fontSize: 11.5, color: 'var(--danger)' }}>{errors.lastName}</span>}
            </Field>
          </div>

          <Field label="College email" required hint="Use your college-issued email address.">
            <input className="q-input" type="email" placeholder="your@gmail.com" value={email} onChange={e => setEmail(e.target.value)} />
            {errors.email && <span style={{ fontSize: 11.5, color: 'var(--danger)' }}>{errors.email}</span>}
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Password" required>
              <input className="q-input" type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} />
              {errors.password && <span style={{ fontSize: 11.5, color: 'var(--danger)' }}>{errors.password}</span>}
            </Field>
            <Field label="Confirm password" required>
              <div style={{ position: 'relative' }}>
                <input className="q-input" type="password" placeholder="Repeat password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ paddingRight: 36 }} />
                {pwMatch && <span style={{ position: 'absolute', right: 10, top: 11 }}><Icon name="check" size={16} stroke="var(--success)" strokeWidth={2.5} /></span>}
              </div>
              {errors.confirmPassword && <span style={{ fontSize: 11.5, color: 'var(--danger)' }}>{errors.confirmPassword}</span>}
            </Field>
          </div>

          <SectionHeader number="2" title="Academic details" />

          <Field label="Department / Branch" required>
            <select className="q-input" value={dept} onChange={e => setDept(e.target.value)} style={{ background: 'var(--surface)' }}>
              <option value="">Select your department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.dept && <span style={{ fontSize: 11.5, color: 'var(--danger)' }}>{errors.dept}</span>}
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Year" required>
              <select className="q-input" value={year} onChange={e => setYear(e.target.value)} style={{ background: 'var(--surface)' }}>
                <option value="">Select year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              {errors.year && <span style={{ fontSize: 11.5, color: 'var(--danger)' }}>{errors.year}</span>}
            </Field>
            <Field label="Section" required>
              <select className="q-input" value={section} onChange={e => setSection(e.target.value)} style={{ background: 'var(--surface)' }}>
                <option value="">Select section</option>
                {['A','B','C','D','E','F','G','H'].map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
              {errors.section && <span style={{ fontSize: 11.5, color: 'var(--danger)' }}>{errors.section}</span>}
            </Field>
          </div>

          <Field label="USN" required hint="Format: 1NH25CS098 — found on your college ID card.">
            <input className="q-input" placeholder="1NH25CS098" value={usn} onChange={e => setUsn(e.target.value.toUpperCase())} style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }} />
            {errors.usn && <span style={{ fontSize: 11.5, color: 'var(--danger)' }}>{errors.usn}</span>}
          </Field>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginTop: 4 }}>
            <div onClick={() => setAgreed(!agreed)} style={{
              width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
              border: `1.5px solid ${agreed ? 'var(--accent)' : errors.agreed ? 'var(--danger)' : 'var(--border-strong)'}`,
              background: agreed ? 'var(--accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.12s', cursor: 'pointer',
            }}>
              {agreed && <Icon name="check" size={11} stroke="#fff" strokeWidth={3} />}
            </div>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              I agree to Z3NTRUM's{' '}
              <span style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 2 }}>Terms of Service</span>
              {' '}and{' '}
              <span style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 2 }}>Privacy Policy</span>
            </span>
          </label>
          {errors.agreed && <span style={{ fontSize: 11.5, color: 'var(--danger)', marginTop: -8 }}>{errors.agreed}</span>}

          {serverError && <p style={{ fontSize: 12.5, color: 'var(--danger)', margin: 0 }}>{serverError}</p>}

          <button type="submit" className="q-btn q-btn-primary q-btn-lg" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
