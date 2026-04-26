import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon.jsx'

const STEP_TITLES = ['Name', 'Academics', 'Verify', 'Username']

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [first, setFirst] = useState('Aanya')
  const [last, setLast] = useState('Rao')
  const [dept, setDept] = useState('CS')
  const [year, setYear] = useState(3)
  const [section, setSection] = useState('B')
  const [usn, setUsn] = useState('1NH25EE098')
  const [verifyState, setVerifyState] = useState('upload') // 'upload' | 'pending'
  const [uploaded, setUploaded] = useState(false)
  const [username, setUsername] = useState('aanya')
  const navigate = useNavigate()
  const total = 4

  const taken = ['admin', 'aanya.r', 'rohan'].includes(username)
  const validName = username.length >= 3 && !taken

  const handleNext = () => {
    if (step === 3 && uploaded) {
      setVerifyState('pending')
    } else {
      setStep(step + 1)
    }
  }

  return (
    <div style={{
      width: '100%', minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <span className="q-brand" style={{ fontSize: 36 }}>Z3NTRUM</span>
      </div>

      <div style={{
        width: 460, background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{
              flex: 1, height: 3, borderRadius: 999,
              background: n <= step ? 'var(--accent)' : 'var(--surface-3)',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        {/* Step labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          {STEP_TITLES.map((t, i) => (
            <span key={t} style={{
              fontSize: 10.5, fontWeight: 500, letterSpacing: '0.03em',
              color: (i + 1) === step ? 'var(--accent)' : 'var(--text-faint)',
            }}>{t}</span>
          ))}
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 500, marginBottom: 4, letterSpacing: '0.04em' }}>
          STEP {step} OF {total}
        </div>

        {/* ── Step 1: Name ── */}
        {step === 1 && (
          <>
            <h1 style={{ fontSize: 22, marginBottom: 6 }}>What's your name?</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 22 }}>
              This is how others will recognize you.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>First name</label>
                <input className="q-input" value={first} onChange={e => setFirst(e.target.value)} placeholder="Aanya" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Last name</label>
                <input className="q-input" value={last} onChange={e => setLast(e.target.value)} placeholder="Rao" />
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Academics ── */}
        {step === 2 && (
          <>
            <h1 style={{ fontSize: 22, marginBottom: 6 }}>Your academic details</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 22 }}>
              We use this to set up your section chat, feed, and department tag.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Department</label>
                <select className="q-input" value={dept} onChange={e => setDept(e.target.value)} style={{ background: 'var(--surface)' }}>
                  <option value="CS">Computer Science</option>
                  <option value="EE">Electrical Engineering</option>
                  <option value="ME">Mechanical Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Bio">Biology</option>
                  <option value="Econ">Economics</option>
                  <option value="Lit">Literature</option>
                  <option value="Eng">English</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Year</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4].map(y => (
                    <button key={y} onClick={() => setYear(y)} className="q-btn" style={{
                      flex: 1, height: 36, borderRadius: 999,
                      background: year === y ? 'var(--accent)' : 'transparent',
                      color: year === y ? '#fff' : 'var(--text)',
                      border: `1px solid ${year === y ? 'var(--accent)' : 'var(--border-strong)'}`,
                      fontWeight: 600,
                    }}>{y}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Section</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['A', 'B', 'C', 'D', 'E', 'F'].map(s => (
                    <button key={s} onClick={() => setSection(s)} className="q-btn" style={{
                      flex: 1, height: 36, minWidth: 44, borderRadius: 999,
                      background: section === s ? 'var(--accent)' : 'transparent',
                      color: section === s ? '#fff' : 'var(--text)',
                      border: `1px solid ${section === s ? 'var(--accent)' : 'var(--border-strong)'}`,
                      fontWeight: 600,
                    }}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>USN</label>
                <input
                  className="q-input"
                  value={usn}
                  onChange={e => setUsn(e.target.value.toUpperCase())}
                  placeholder="1NH25EE098"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                />
                <p style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 6 }}>
                  Format: <span style={{ fontFamily: 'var(--font-mono)' }}>1NH25EE098</span> — your university serial number from your ID card.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── Step 3a: Upload ── */}
        {step === 3 && verifyState === 'upload' && (
          <>
            <h1 style={{ fontSize: 22, marginBottom: 6 }}>Verify you're a student</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
              Upload a clear photo of your <b>college ID card</b>. We use this to confirm your USN and protect the community.
            </p>

            {!uploaded ? (
              <label htmlFor="id-upload" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: '32px 20px',
                border: '2px dashed var(--border-strong)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--surface-2)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'center',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-soft)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--surface-2)' }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent)',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="M17 8l-5-5-5 5" />
                    <path d="M12 3v12" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Drag & drop your ID card here</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    or <span style={{ color: 'var(--accent)', fontWeight: 500 }}>click to browse</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                  PNG, JPG up to 5MB · Both sides if possible
                </div>
                <input id="id-upload" type="file" accept="image/*" hidden onChange={() => setUploaded(true)} />
              </label>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: 14, border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', background: 'var(--surface-2)',
              }}>
                <div className="q-placeholder" style={{ width: 56, height: 40, flexShrink: 0 }}>ID</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>college_id_front.jpg</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>2.4 MB · Uploaded just now</div>
                </div>
                <button className="q-btn q-btn-ghost q-btn-sm" onClick={() => setUploaded(false)}>
                  <Icon name="close" size={12} /> Remove
                </button>
              </div>
            )}

            <div style={{
              marginTop: 16, padding: 12,
              background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <div style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>
                <Icon name="sparkle" size={14} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                <b style={{ color: 'var(--text)' }}>We review within 48 hours.</b> Make sure your name, photo, and USN are clearly visible. Your ID is encrypted and only seen by our verification team.
              </div>
            </div>
          </>
        )}

        {/* ── Step 3b: Pending ── */}
        {step === 3 && verifyState === 'pending' && (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: 16, margin: '8px auto 18px',
              background: 'var(--accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)',
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>
            <h1 style={{ fontSize: 22, marginBottom: 8, textAlign: 'center' }}>Pending review</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.55, textAlign: 'center' }}>
              Thanks, Aanya. Your ID is in the queue. Most students are verified within 48 hours — we'll email you the moment you're approved.
            </p>

            <div style={{
              padding: 16, border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', background: 'var(--surface-2)',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {[
                { state: 'done',    label: 'ID uploaded',      meta: 'Just now' },
                { state: 'active',  label: 'Under review',     meta: 'Estimated 24–48 hours' },
                { state: 'pending', label: 'Verified',          meta: 'You can pick a username' },
                { state: 'pending', label: 'Welcome to Z3NTRUM',  meta: 'Account active' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 999, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: s.state === 'done' ? 'var(--accent)' : s.state === 'active' ? 'var(--accent-soft)' : 'var(--surface-3)',
                    color: s.state === 'done' ? '#fff' : s.state === 'active' ? 'var(--accent)' : 'var(--text-faint)',
                    border: s.state === 'active' ? '2px solid var(--accent)' : 'none',
                  }}>
                    {s.state === 'done'
                      ? <Icon name="check" size={11} strokeWidth={3} />
                      : s.state === 'active'
                        ? <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)', display: 'block' }} />
                        : <span style={{ width: 4, height: 4, borderRadius: 999, background: 'var(--text-faint)', display: 'block' }} />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: s.state === 'pending' ? 400 : 600, color: s.state === 'pending' ? 'var(--text-muted)' : 'var(--text)' }}>{s.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{s.meta}</div>
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11.5, color: 'var(--text-faint)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
              You can close this page — we'll notify you at <b style={{ color: 'var(--text-muted)' }}>aanya@stanford.edu</b>.
            </p>
          </>
        )}

        {/* ── Step 4: Username ── */}
        {step === 4 && (
          <>
            <h1 style={{ fontSize: 22, marginBottom: 6 }}>Choose a username</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 22 }}>
              How you'll show up in DMs and tags.
            </p>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-faint)', fontSize: 14 }}>@</span>
              <input
                className="q-input"
                style={{ paddingLeft: 26, paddingRight: 38 }}
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-z0-9._]/gi, '').toLowerCase())}
                placeholder="username"
              />
              <span style={{ position: 'absolute', right: 12, top: 12 }}>
                {validName && username.length > 0 && <Icon name="check" size={18} stroke="var(--success)" strokeWidth={2.4} />}
                {taken && <Icon name="x" size={18} stroke="var(--danger)" strokeWidth={2.4} />}
              </span>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 8 }}>
              {taken ? 'That username is taken.' : validName ? 'Available.' : 'Pick at least 3 characters.'}
              {' · '} Username can only be changed once every 60 days.
            </p>
          </>
        )}

        {/* Footer — hidden on pending state */}
        {!(step === 3 && verifyState === 'pending') && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
            <button
              className="q-btn q-btn-ghost"
              style={{ visibility: step > 1 ? 'visible' : 'hidden' }}
              onClick={() => setStep(step - 1)}
            >
              <Icon name="arrowLeft" size={14} /> Back
            </button>
            {step < 4 ? (
              <button
                className="q-btn q-btn-primary"
                disabled={step === 3 && !uploaded}
                style={step === 3 && !uploaded ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                onClick={handleNext}
              >
                {step === 3 ? 'Submit for review' : 'Next'}
              </button>
            ) : (
              <button className="q-btn q-btn-primary" onClick={() => navigate('/home')}>Finish setup</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
