import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Avatar from '../components/Avatar.jsx'
import Icon from '../components/Icon.jsx'
import Spinner from '../components/Spinner.jsx'
import { supabase, fullName, getConversationId } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'

function SearchRow({ p, onMessage }) {
  return (
    <div className="q-card q-card-hover" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar name={fullName(p)} size={40} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{fullName(p)}</div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
          {p.username} {p.department ? `· ${p.department.split(' ')[0]}` : ''} {p.section ? `· Section ${p.section}` : ''}
        </div>
      </div>
      <button
        className="q-btn q-btn-secondary q-btn-sm"
        onClick={() => onMessage(p)}
      >
        <Icon name="messages" size={12} /> Message
      </button>
    </div>
  )
}

export default function Search() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [q, setQ]           = useState('')
  const [results, setResults] = useState([])
  const [recent, setRecent]   = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!profile) return
    loadRecent()
  }, [profile?.id])

  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
    const t = setTimeout(() => runSearch(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const loadRecent = async () => {
    const { data } = await supabase.from('profiles').select('*').neq('id', profile.id).limit(6)
    if (data) setRecent(data)
  }

  const runSearch = async (query) => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', profile.id)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,username.ilike.%${query}%,usn.ilike.%${query}%,department.ilike.%${query}%`)
      .limit(20)
    if (data) setResults(data)
    setLoading(false)
  }

  const handleMessage = async (other) => {
    const convId = getConversationId(profile.id, other.id)
    await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id:   profile.id,
      receiver_id: other.id,
      content:     `Hey ${other.first_name}! 👋`,
    })
    navigate('/messages')
  }

  const list = q.trim() ? results : recent

  return (
    <div className="q-page">
      <Sidebar />
      <main className="q-main">
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <input
              className="q-input"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search students by name, username, USN or department…"
              style={{ height: 52, fontSize: 16, paddingLeft: 44, paddingRight: 14 }}
              autoFocus
            />
            <span style={{ position: 'absolute', left: 14, top: 17 }}>
              <Icon name="search" size={18} stroke="var(--text-faint)" />
            </span>
            {q && (
              <button className="q-btn q-btn-ghost q-btn-sm" onClick={() => setQ('')} style={{ position: 'absolute', right: 8, top: 8, width: 36, height: 36, padding: 0, borderRadius: 8 }}>
                <Icon name="close" size={14} />
              </button>
            )}
          </div>

          {q ? (
            <>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 10, paddingLeft: 4 }}>
                {loading ? 'Searching…' : `${results.length} ${results.length === 1 ? 'result' : 'results'} for "${q}"`}
              </div>
              {loading ? <Spinner /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {list.map(p => <SearchRow key={p.id} p={p} onMessage={handleMessage} />)}
                  {results.length === 0 && (
                    <div className="q-empty">
                      <div className="q-empty-icon">
                        <Icon name="search" size={22} stroke="var(--text-faint)" />
                      </div>
                      <p className="q-empty-title">No results for "{q}"</p>
                      <p className="q-empty-body">Try searching by name, username, USN, or department.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <span className="q-section-label" style={{ display: 'block', marginBottom: 10, paddingLeft: 4 }}>People on Z3NTRUM</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recent.map(p => <SearchRow key={p.id} p={p} onMessage={handleMessage} />)}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
