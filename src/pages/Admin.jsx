import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Avatar from '../components/Avatar.jsx'
import Icon from '../components/Icon.jsx'
import Spinner from '../components/Spinner.jsx'
import { supabase, fullName } from '../lib/supabase'


function StudentCard({ student: p, tab, acting, onApprove, onReject }) {
  const name = fullName(p)

  return (
    <div className="q-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>

        {/* Left: info */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Avatar name={name} size={40} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{p.username} · {p.email}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['USN',        p.usn],
              ['Department', p.department],
              ['Year',       p.year ? `${p.year}${['','st','nd','rd','th'][p.year] || 'th'} Year` : '—'],
              ['Section',    p.section ? `Section ${p.section}` : '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{val || '—'}</div>
              </div>
            ))}
          </div>

          {tab === 'pending' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                className="q-btn q-btn-sm"
                style={{
                  background: 'color-mix(in oklch, var(--success) 15%, transparent)',
                  color: 'var(--success)',
                  border: '1px solid color-mix(in oklch, var(--success) 35%, transparent)',
                  flex: 1,
                }}
                onClick={onApprove}
                disabled={!!acting}
              >
                <Icon name="check" size={13} />
                {acting === 'approving' ? 'Approving…' : 'Approve'}
              </button>
              <button
                className="q-btn q-btn-sm q-btn-danger"
                style={{ flex: 1 }}
                onClick={onReject}
                disabled={!!acting}
              >
                <Icon name="close" size={13} />
                {acting === 'rejecting' ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          )}

          {tab === 'approved' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 13, color: 'var(--success)' }}>
              <Icon name="check" size={14} /> Approved
            </div>
          )}
          {tab === 'rejected' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 13, color: 'var(--danger)' }}>
              <Icon name="close" size={14} /> Rejected
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default function Admin() {
  const [tab,      setTab]      = useState('pending')
  const [students, setStudents] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [counts,   setCounts]   = useState({ pending: 0, approved: 0, rejected: 0 })
  const [acting,   setActing]   = useState({})

  useEffect(() => { fetchStudents() }, [tab])

  useEffect(() => {
    fetchCounts()
    const ch = supabase.channel('admin_watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStudents()
        fetchCounts()
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [tab])

  const fetchStudents = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .eq('status', tab)
      .order('created_at', { ascending: false })
    if (data) setStudents(data)
    setLoading(false)
  }

  const fetchCounts = async () => {
    const statuses = ['pending', 'approved', 'rejected']
    const results = await Promise.all(
      statuses.map(s =>
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('status', s)
      )
    )
    setCounts({
      pending:  results[0].count || 0,
      approved: results[1].count || 0,
      rejected: results[2].count || 0,
    })
  }

  const approve = async (p) => {
    setActing(a => ({ ...a, [p.id]: 'approving' }))
    await supabase.from('profiles').update({ status: 'approved', id_verified: true }).eq('id', p.id)
    setStudents(s => s.filter(x => x.id !== p.id))
    setActing(a => { const n = { ...a }; delete n[p.id]; return n })
    fetchCounts()
  }

  const reject = async (p) => {
    setActing(a => ({ ...a, [p.id]: 'rejecting' }))
    await supabase.rpc('delete_rejected_user', { p_user_id: p.id })
    setStudents(s => s.filter(x => x.id !== p.id))
    setActing(a => { const n = { ...a }; delete n[p.id]; return n })
    fetchCounts()
  }

  const TAB_LABELS = [
    { key: 'pending',  label: 'Pending',  color: 'var(--accent)' },
    { key: 'approved', label: 'Approved', color: 'var(--success)' },
    { key: 'rejected', label: 'Rejected', color: 'var(--danger)' },
  ]

  return (
    <div className="q-page">
      <Sidebar />
      <main className="q-main">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26 }}>Admin Panel</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Review student registrations and verify college IDs.
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            {TAB_LABELS.map(({ key, label, color }) => (
              <div key={key} className="q-card" style={{ flex: 1, padding: '14px 16px', cursor: 'pointer', border: tab === key ? `1.5px solid ${color}` : undefined }} onClick={() => setTab(key)}>
                <div style={{ fontSize: 22, fontWeight: 700, color }}>{counts[key]}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="q-tabs" style={{ marginBottom: 20 }}>
            {TAB_LABELS.map(({ key, label }) => (
              <button key={key} className={`q-tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>
                {label} {counts[key] > 0 && <span style={{ marginLeft: 4, background: 'var(--surface-3)', borderRadius: 99, padding: '1px 7px', fontSize: 11 }}>{counts[key]}</span>}
              </button>
            ))}
          </div>

          {loading ? <Spinner /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {students.map(p => (
                <StudentCard
                  key={p.id}
                  student={p}
                  tab={tab}
                  acting={acting[p.id]}
                  onApprove={() => approve(p)}
                  onReject={() => reject(p)}
                />
              ))}
              {students.length === 0 && (
                <div className="q-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-faint)', fontSize: 14 }}>
                  {tab === 'pending' ? '🎉 No pending approvals' :
                   tab === 'approved' ? 'No approved students yet.' :
                   'No rejected students.'}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
