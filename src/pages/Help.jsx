import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import PostCard from '../components/PostCard.jsx'
import PanelSection from '../components/PanelSection.jsx'
import PersonRow from '../components/PersonRow.jsx'
import Icon from '../components/Icon.jsx'
import Spinner from '../components/Spinner.jsx'
import { supabase, fmt, fullName } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'

export default function Help() {
  const { profile } = useAuth()
  const [posts, setPosts]         = useState([])
  const [people, setPeople]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('Public')
  const [modal, setModal]         = useState(false)
  const [visibility, setVisibility] = useState('public')
  const [text, setText]           = useState('')
  const [posting, setPosting]     = useState(false)

  useEffect(() => {
    if (!profile) return
    fetchPosts()
    fetchPeople()

    const ch = supabase.channel('help_posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts', filter: `type=eq.help` }, fetchPosts)
      .on('postgres_changes', { event: 'DELETE',  schema: 'public', table: 'posts' }, fetchPosts)
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [profile?.id])

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(id, first_name, last_name, username, department)')
      .eq('type', 'help')
      .order('created_at', { ascending: false })
    if (data) setPosts(data)
    setLoading(false)
  }

  const fetchPeople = async () => {
    const { data } = await supabase.from('profiles').select('*').neq('id', profile.id).limit(5)
    if (data) setPeople(data)
  }

  const submitPost = async () => {
    if (!text.trim() || posting) return
    setPosting(true)
    await supabase.from('posts').insert({ author_id: profile.id, content: text.trim(), type: 'help', visibility })
    setText('')
    setModal(false)
    setPosting(false)
  }

  const removePost = async (id) => {
    await supabase.from('posts').delete().eq('id', id)
  }

  const deptKey = (dept) => {
    if (!dept) return null
    const d = dept.toLowerCase()
    if (d.includes('computer') || d.includes('information')) return 'CS'
    if (d.includes('design'))  return 'Design'
    if (d.includes('bio'))     return 'Bio'
    if (d.includes('mech') || d.includes('civil') || d.includes('electrical') || d.includes('chemical')) return 'Eng'
    return null
  }

  return (
    <div className="q-page" style={{ position: 'relative' }}>
      <Sidebar />

      <main className="q-main">
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h1 style={{ fontSize: 24 }}>Help Feed</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Ask anything. Someone in your section probably has the answer.
              </p>
            </div>
            <button className="q-btn q-btn-primary" onClick={() => setModal(true)}>
              <Icon name="plus" size={14} /> Post a help request
            </button>
          </div>

          <div className="q-tabs" style={{ marginBottom: 14 }}>
            <button className={`q-tab${tab === 'Public' ? ' active' : ''}`} onClick={() => setTab('Public')}>Public</button>
            <button className={`q-tab${tab === 'Private' ? ' active' : ''}`} onClick={() => setTab('Private')}>My Posts</button>
          </div>

          {loading ? <Spinner /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(tab === 'Public' ? posts : posts.filter(p => p.author_id === profile.id)).map(p => (
                <PostCard
                  key={p.id}
                  postId={p.id}
                  author={{ name: fullName(p.author), username: p.author.username }}
                  dept={deptKey(p.author.department)}
                  time={fmt(p.created_at)}
                  helpButton={p.author_id !== profile.id}
                  isOwn={p.author_id === profile.id}
                  onRemove={p.author_id === profile.id ? () => removePost(p.id) : undefined}
                  content={p.content}
                />
              ))}
              {posts.length === 0 && (
                <div className="q-empty">
                  <div className="q-empty-icon">
                    <Icon name="sparkle" size={22} stroke="var(--text-faint)" />
                  </div>
                  <p className="q-empty-title">No help requests yet</p>
                  <p className="q-empty-body">
                    When classmates post questions, they'll show up here. Post your own to get the ball rolling.
                  </p>
                  <button className="q-btn q-btn-secondary q-btn-sm" onClick={() => setModal(true)}>
                    <Icon name="plus" size={13} /> Post a help request
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <aside className="q-rightpanel">
        <div className="q-card" style={{ padding: 14, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Icon name="sparkle" size={14} stroke="var(--accent)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>How matching works</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Help posts are surfaced to students whose interests, courses, or skills match the topic. Public posts reach the whole campus.
          </p>
        </div>
        <PanelSection title="Suggested matches">
          {people.slice(0, 3).map(p => (
            <PersonRow key={p.id} p={{ name: fullName(p), username: p.username, dept: p.department, section: p.section }} action="Connect" />
          ))}
        </PanelSection>
      </aside>

      {modal && (
        <div className="q-modal-backdrop" onClick={() => setModal(false)}>
          <div className="q-modal" onClick={e => e.stopPropagation()}>
            <button className="q-btn q-btn-ghost q-btn-sm" style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, padding: 0, borderRadius: 8 }} onClick={() => setModal(false)}>
              <Icon name="close" size={14} />
            </button>
            <h2 style={{ marginBottom: 4 }}>Post a help request</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
              Be specific. Posts with a course or topic get answered 3× faster.
            </p>
            <textarea className="q-textarea" rows={5} placeholder="What do you need help with?" value={text} onChange={e => setText(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 14, marginBottom: 18 }}>
              {[['public','🌍 Public'],['private','🔒 Private']].map(([v, label]) => (
                <button key={v} onClick={() => setVisibility(v)} className="q-btn" style={{
                  flex: 1,
                  background: visibility === v ? 'var(--accent-soft)' : 'var(--surface-2)',
                  color: visibility === v ? 'var(--accent)' : 'var(--text-muted)',
                  border: `1px solid ${visibility === v ? 'var(--accent)' : 'transparent'}`,
                  fontWeight: 500,
                }}>{label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="q-btn q-btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="q-btn q-btn-primary" onClick={submitPost} disabled={posting}>
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
