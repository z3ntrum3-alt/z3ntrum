import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import PostCard from '../components/PostCard.jsx'
import PanelSection from '../components/PanelSection.jsx'
import PersonRow from '../components/PersonRow.jsx'
import Icon from '../components/Icon.jsx'
import Spinner from '../components/Spinner.jsx'
import { supabase, fmt, fullName } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'

const POST_TYPES = ['General', 'Help Request', 'Project']

export default function Home() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [posts, setPosts]       = useState([])
  const [people, setPeople]     = useState([])
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('All')
  const [modal, setModal]       = useState(false)
  const [postType, setPostType] = useState('General')
  const [postText, setPostText] = useState('')
  const [posting, setPosting]   = useState(false)
  const [posted, setPosted]     = useState(false)

  useEffect(() => {
    if (!profile) return
    fetchAll()

    const ch = supabase.channel('home_posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, fetchPosts)
      .on('postgres_changes', { event: 'DELETE',  schema: 'public', table: 'posts' }, fetchPosts)
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [profile?.id])

  const fetchAll = () => Promise.all([fetchPosts(), fetchPeople(), fetchEvents()])

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(id, first_name, last_name, username, department)')
      .order('created_at', { ascending: false })
      .limit(30)
    if (data) setPosts(data)
    setLoading(false)
  }

  const fetchPeople = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', profile.id)
      .limit(5)
    if (data) setPeople(data)
  }

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('created_at').limit(3)
    if (data) setEvents(data)
  }

  const submitPost = async () => {
    if (!postText.trim() || posting) return
    setPosting(true)
    const type = postType === 'Help Request' ? 'help' : postType === 'Project' ? 'project' : 'general'
    await supabase.from('posts').insert({ author_id: profile.id, content: postText.trim(), type })
    setPostText('')
    setPostType('General')
    setPosting(false)
    setPosted(true)
    setModal(false)
    setTimeout(() => setPosted(false), 2500)
  }

  const removePost = async (id) => {
    await supabase.from('posts').delete().eq('id', id)
  }

  const deptKey = (dept) => {
    if (!dept) return null
    const d = dept.toLowerCase()
    if (d.includes('computer') || d.includes('information')) return 'CS'
    if (d.includes('design')) return 'Design'
    if (d.includes('bio')) return 'Bio'
    if (d.includes('econ')) return 'Econ'
    if (d.includes('mech') || d.includes('civil') || d.includes('electrical') || d.includes('chemical')) return 'Eng'
    return null
  }

  const filtered = tab === 'All' ? posts
    : tab === 'Help'     ? posts.filter(p => p.type === 'help')
    : posts.filter(p => p.type === 'project')

  return (
    <div className="q-page" style={{ position: 'relative' }}>
      <Sidebar />

      <main className="q-main">
        <div style={{ maxWidth: 580, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <h1 style={{ fontSize: 24 }}>Home</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>What's happening on campus today.</p>
            </div>
            <button className="q-btn q-btn-primary" onClick={() => setModal(true)}>
              <Icon name="plus" size={14} /> New post
            </button>
          </div>

          <div className="q-tabs" style={{ marginBottom: 2 }}>
            {['All', 'Help', 'Projects'].map(t => (
              <button key={t} className={`q-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>

          {posted && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px',
              background: 'color-mix(in oklch, var(--success) 12%, var(--surface))',
              border: '1px solid color-mix(in oklch, var(--success) 30%, transparent)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13, color: 'var(--success)', fontWeight: 500,
            }}>
              <Icon name="check" size={14} /> Posted
            </div>
          )}

          {loading ? <Spinner /> : filtered.length === 0 ? (
            <div className="q-empty">
              <div className="q-empty-icon">
                <Icon name="home" size={22} stroke="var(--text-faint)" />
              </div>
              <p className="q-empty-title">{tab === 'All' ? 'Nothing posted yet' : `No ${tab.toLowerCase()} posts yet`}</p>
              <p className="q-empty-body">
                {tab === 'All' ? 'Be the first to share something with campus — a project, a question, or just what you\'re working on.' : `No ${tab.toLowerCase()} posts have been shared yet.`}
              </p>
              <button className="q-btn q-btn-secondary q-btn-sm" onClick={() => setModal(true)}>
                <Icon name="plus" size={13} /> New post
              </button>
            </div>
          ) : filtered.map(p => (
            <PostCard
              key={p.id}
              postId={p.id}
              author={{ name: fullName(p.author), username: p.author.username }}
              dept={deptKey(p.author.department)}
              time={fmt(p.created_at)}
              badge={p.type === 'help' ? 'Help Request' : p.type === 'project' ? 'Project' : null}
              helpButton={p.type === 'help' && p.author_id !== profile.id}
              isOwn={p.author_id === profile.id}
              onRemove={p.author_id === profile.id ? () => removePost(p.id) : undefined}
              content={p.content}
            />
          ))}
        </div>
      </main>

      <aside className="q-rightpanel">
        <PanelSection title="People you might know" action="See all" onAction={() => navigate('/search')}>
          {people.slice(0, 3).map(p => (
            <PersonRow key={p.id} p={{ name: fullName(p), username: p.username, dept: p.department, section: p.section }} />
          ))}
        </PanelSection>
        <PanelSection title="Upcoming events" action="View all" onAction={() => navigate('/events')}>
          {events.map((e, i) => (
            <div key={e.id} onClick={() => navigate('/events')} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 0', borderTop: i ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{e.name}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{e.event_date}</span>
            </div>
          ))}
        </PanelSection>
      </aside>

      {modal && (
        <div className="q-modal-backdrop" onClick={() => setModal(false)}>
          <div className="q-modal" onClick={e => e.stopPropagation()}>
            <button className="q-btn q-btn-ghost q-btn-sm" style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, padding: 0, borderRadius: 8 }} onClick={() => setModal(false)}>
              <Icon name="close" size={14} />
            </button>
            <h2 style={{ marginBottom: 4 }}>New post</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Share an update, project, or ask for help.</p>
            <textarea className="q-textarea" rows={5} placeholder="What's on your mind?" value={postText} onChange={e => setPostText(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 14, marginBottom: 18 }}>
              {POST_TYPES.map(t => (
                <button key={t} onClick={() => setPostType(t)} className="q-btn" style={{
                  flex: 1, fontSize: 12,
                  background: postType === t ? 'var(--accent-soft)' : 'var(--surface-2)',
                  color: postType === t ? 'var(--accent)' : 'var(--text-muted)',
                  border: `1px solid ${postType === t ? 'var(--accent)' : 'transparent'}`,
                  fontWeight: 500,
                }}>{t}</button>
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
