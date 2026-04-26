import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import DeptPill from '../components/DeptPill.jsx'
import Icon from '../components/Icon.jsx'
import Spinner from '../components/Spinner.jsx'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'

const TAGS = ['CS', 'ECE', 'ME', 'CE', 'EE', 'IS', 'Design', 'Bio', 'All Students']

export default function Events() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [events,  setEvents]  = useState([])
  const [rsvpd,   setRsvpd]   = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)

  // new event form state
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [eventDate,   setEventDate]   = useState('')
  const [tag,         setTag]         = useState('All Students')
  const [isDept,      setIsDept]      = useState(false)
  const [creating,    setCreating]    = useState(false)
  const [formError,   setFormError]   = useState('')

  useEffect(() => {
    if (!profile) return
    fetchEvents()
    fetchRsvps()

    const ch = supabase.channel('events_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, payload => {
        setEvents(ev => [payload.new, ...ev])
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'events' }, payload => {
        setEvents(ev => ev.filter(e => e.id !== payload.old.id))
      })
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [profile?.id])

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('created_at')
    if (data) setEvents(data)
    setLoading(false)
  }

  const fetchRsvps = async () => {
    const { data } = await supabase.from('event_rsvps').select('event_id').eq('user_id', profile.id)
    if (data) setRsvpd(new Set(data.map(r => r.event_id)))
  }

  const toggleRsvp = async (eventId) => {
    const going = rsvpd.has(eventId)
    if (going) {
      await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', profile.id)
      setRsvpd(r => { const n = new Set(r); n.delete(eventId); return n })
    } else {
      await supabase.from('event_rsvps').insert({ event_id: eventId, user_id: profile.id })
      setRsvpd(r => new Set([...r, eventId]))
    }
  }

  const createEvent = async () => {
    if (!name.trim() || !eventDate.trim()) {
      setFormError('Event name and date are required.')
      return
    }
    setCreating(true)
    setFormError('')
    const { error } = await supabase.from('events').insert({
      name:        name.trim(),
      description: description.trim(),
      event_date:  eventDate.trim(),
      tag,
      is_dept:     isDept,
    })
    if (error) { setFormError(error.message); setCreating(false); return }
    setName(''); setDescription(''); setEventDate(''); setTag('All Students'); setIsDept(false)
    setModal(false)
    setCreating(false)
  }

  const deleteEvent = async (id) => {
    setEvents(ev => ev.filter(e => e.id !== id))
    await supabase.from('events').delete().eq('id', id)
  }

  return (
    <div className="q-page">
      <Sidebar />
      <main className="q-main">
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 26 }}>Events</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                What's happening on campus.
              </p>
            </div>
            {isAdmin && (
              <button className="q-btn q-btn-primary" onClick={() => setModal(true)}>
                <Icon name="plus" size={14} /> Create Event
              </button>
            )}
          </div>

          {/* Event grid */}
          {loading ? <Spinner /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {events.map(e => {
                const going = rsvpd.has(e.id)
                return (
                  <div key={e.id} className="q-card q-card-hover" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>

                      {/* Date block */}
                      <div style={{
                        width: 52, height: 56, flexShrink: 0,
                        background: 'var(--accent-soft)', borderRadius: 12,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {e.event_date.split(' ')[0]}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', lineHeight: 1.1 }}>
                          {e.event_date.split(' ')[1]}
                        </div>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: 15 }}>{e.name}</span>
                          {e.is_dept
                            ? <DeptPill dept={e.tag} />
                            : <span className="q-pill q-pill-accent">{e.tag}</span>
                          }
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0, marginBottom: 10 }}>
                          {e.description}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-faint)' }}>
                          <Icon name="calendar" size={12} />
                          {e.event_date}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                        <button
                          className="q-btn q-btn-sm"
                          style={going ? {
                            background: 'color-mix(in oklch, var(--success) 12%, transparent)',
                            color: 'var(--success)',
                            border: '1px solid color-mix(in oklch, var(--success) 30%, transparent)',
                          } : { border: '1px solid var(--border-strong)', color: 'var(--text)' }}
                          onClick={() => toggleRsvp(e.id)}
                        >
                          {going ? <><Icon name="check" size={12} /> Going</> : 'RSVP'}
                        </button>
                        {isAdmin && (
                          <button
                            className="q-btn q-btn-ghost q-btn-sm"
                            style={{ color: 'var(--danger)', fontSize: 11 }}
                            onClick={() => deleteEvent(e.id)}
                          >
                            <Icon name="close" size={11} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {events.length === 0 && (
                <div className="q-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-faint)', fontSize: 13.5 }}>
                  {isAdmin ? 'No events yet — create the first one!' : 'No upcoming events.'}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Create Event modal — admins only */}
      {modal && (
        <div className="q-modal-backdrop" onClick={() => setModal(false)}>
          <div className="q-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <button className="q-btn q-btn-ghost q-btn-sm"
              style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, padding: 0, borderRadius: 8 }}
              onClick={() => setModal(false)}>
              <Icon name="close" size={14} />
            </button>

            <h2 style={{ marginBottom: 4 }}>Create Event</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              This event will be visible to all students immediately.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Event name *</label>
                <input className="q-input" placeholder="Spring Hackathon" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Description</label>
                <textarea className="q-textarea" rows={2} placeholder="What's it about?" value={description} onChange={e => setDescription(e.target.value)} style={{ minHeight: 60 }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Date & time *</label>
                <input className="q-input" placeholder="May 12 · 8pm" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Format: May 12 · 8pm</span>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Tag</label>
                  <select className="q-input" value={tag} onChange={e => setTag(e.target.value)} style={{ cursor: 'pointer' }}>
                    {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'flex-end' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Dept only?</label>
                  <button
                    role="switch" aria-checked={isDept}
                    onClick={() => setIsDept(d => !d)}
                    style={{
                      width: 36, height: 20, borderRadius: 999, border: 'none', padding: 0,
                      background: isDept ? 'var(--accent)' : 'var(--border-strong)',
                      position: 'relative', cursor: 'pointer', transition: 'background 0.15s',
                    }}>
                    <span style={{
                      position: 'absolute', top: 3, left: isDept ? 19 : 3,
                      width: 14, height: 14, borderRadius: 999, background: '#fff',
                      transition: 'left 0.15s', display: 'block',
                    }} />
                  </button>
                </div>
              </div>

              {formError && <p style={{ fontSize: 12.5, color: 'var(--danger)', margin: 0 }}>{formError}</p>}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button className="q-btn q-btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button className="q-btn q-btn-primary" onClick={createEvent} disabled={creating}>
                  <Icon name="plus" size={14} /> {creating ? 'Creating…' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
