import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Avatar from '../components/Avatar.jsx'
import DeptPill from '../components/DeptPill.jsx'
import Icon from '../components/Icon.jsx'
import Spinner from '../components/Spinner.jsx'
import { supabase, fmt, fullName } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'

export default function Profile() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [helpPosts, setHelpPosts] = useState([])
  const [loading, setLoading]     = useState(true)
  const [helpModal, setHelpModal] = useState(false)
  const [helpText, setHelpText]   = useState('')
  const [helpVis, setHelpVis]     = useState('public')
  const [posting, setPosting]     = useState(false)

  useEffect(() => {
    if (!profile) return
    fetchHelpPosts()
  }, [profile?.id])

  const fetchHelpPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', profile.id)
      .eq('type', 'help')
      .order('created_at', { ascending: false })
    if (data) setHelpPosts(data)
    setLoading(false)
  }

  const removeHelpPost = async (id) => {
    await supabase.from('posts').delete().eq('id', id)
    setHelpPosts(p => p.filter(h => h.id !== id))
  }

  const postHelp = async () => {
    if (!helpText.trim() || posting) return
    setPosting(true)
    const { data } = await supabase.from('posts').insert({
      author_id: profile.id, content: helpText.trim(), type: 'help', visibility: helpVis,
    }).select().single()
    if (data) setHelpPosts(p => [data, ...p])
    setHelpText('')
    setHelpModal(false)
    setPosting(false)
  }

  if (!profile) return <div className="q-page"><Sidebar /><main className="q-main"><Spinner /></main></div>

  const name = fullName(profile)

  return (
    <div className="q-page" style={{ position: 'relative' }}>
      <Sidebar />
      <main className="q-main" style={{ padding: 0 }}>
        <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 28px 40px' }}>

          {/* Hero */}
          <div className="q-card" style={{ overflow: 'hidden', padding: 0 }}>
            <div style={{ padding: '24px 24px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ borderRadius: '50%', border: '3px solid var(--border)', flexShrink: 0 }}>
                <Avatar name={name} size={72} />
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 24 }}>{name}</h1>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{profile.username}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {profile.department && <DeptPill dept={profile.department.split(' ')[0]} />}
                  {profile.section && <span className="q-pill q-pill-outline">Section {profile.section}</span>}
                  {profile.year && <span className="q-pill q-pill-outline">Year {profile.year}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="q-btn q-btn-secondary q-btn-sm" onClick={() => navigate('/settings')}>
                  <Icon name="settings" size={14} /> Edit profile
                </button>
              </div>
            </div>
            <div style={{ padding: '0 24px 22px' }}>
              <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.55, maxWidth: 620 }}>
                {profile.bio || 'No bio yet — add one in Settings.'}
              </p>
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, color: 'var(--accent)', fontSize: 13, textDecoration: 'none' }}>
                  {profile.website} <Icon name="external" size={12} />
                </a>
              )}
            </div>
          </div>

          {/* Academic info */}
          <div style={{ marginTop: 24, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {profile.usn && (
              <div className="q-card" style={{ padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>USN</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.06em' }}>{profile.usn}</span>
              </div>
            )}
            {profile.department && (
              <div className="q-card" style={{ padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dept</span>
                <span style={{ fontSize: 13 }}>{profile.department}</span>
              </div>
            )}
          </div>

          {/* Help posts */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="q-section-label">My Help Posts</span>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{helpPosts.length} active</span>
            </div>

            {loading ? <Spinner size={20} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {helpPosts.map(h => (
                  <div key={h.id} className="q-card" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="q-pill" style={{
                        fontSize: 10,
                        background: h.visibility === 'public' ? 'var(--accent-soft)' : 'var(--surface-2)',
                        color: h.visibility === 'public' ? 'var(--accent)' : 'var(--text-muted)',
                      }}>{h.visibility === 'public' ? 'Public' : 'Private'}</span>
                      <button
                        className="q-btn q-btn-ghost q-btn-sm"
                        style={{ height: 22, padding: '0 8px', fontSize: 11, color: 'var(--success)', gap: 4 }}
                        onClick={() => removeHelpPost(h.id)}
                      >
                        <Icon name="check" size={11} /> Resolved
                      </button>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.5 }}>{h.content}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>{fmt(h.created_at)} ago</div>
                  </div>
                ))}
                {helpPosts.length === 0 && (
                  <div className="q-card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                    No active help posts
                  </div>
                )}
              </div>
            )}
            <button className="q-btn q-btn-secondary" style={{ marginTop: 14, width: '100%' }} onClick={() => setHelpModal(true)}>
              <Icon name="plus" size={14} /> Post a help request
            </button>
          </div>
        </div>
      </main>

      {helpModal && (
        <div className="q-modal-backdrop" onClick={() => setHelpModal(false)}>
          <div className="q-modal" onClick={e => e.stopPropagation()}>
            <button className="q-btn q-btn-ghost q-btn-sm" style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, padding: 0, borderRadius: 8 }} onClick={() => setHelpModal(false)}>
              <Icon name="close" size={14} />
            </button>
            <h2 style={{ marginBottom: 4 }}>Post a help request</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Be specific. Posts with a course or topic get answered 3× faster.</p>
            <textarea className="q-textarea" rows={4} placeholder="What do you need help with?" value={helpText} onChange={e => setHelpText(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 14, marginBottom: 18 }}>
              {[['public','🌍 Public'],['private','🔒 Private']].map(([v, label]) => (
                <button key={v} onClick={() => setHelpVis(v)} className="q-btn" style={{
                  flex: 1,
                  background: helpVis === v ? 'var(--accent-soft)' : 'var(--surface-2)',
                  color: helpVis === v ? 'var(--accent)' : 'var(--text-muted)',
                  border: `1px solid ${helpVis === v ? 'var(--accent)' : 'transparent'}`,
                  fontWeight: 500,
                }}>{label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="q-btn q-btn-ghost" onClick={() => setHelpModal(false)}>Cancel</button>
              <button className="q-btn q-btn-primary" onClick={postHelp} disabled={posting}>{posting ? 'Posting…' : 'Post'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
