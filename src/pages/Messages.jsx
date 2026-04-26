import { useEffect, useRef, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Avatar from '../components/Avatar.jsx'
import Icon from '../components/Icon.jsx'
import Spinner from '../components/Spinner.jsx'
import { supabase, getConversationId, fmt, fullName } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '🔥']

function buildGroups(profile) {
  const g = [{ key: 'college', name: 'Z3NTRUM — College-wide', meta: 'All students', icon: '◯' }]
  if (profile?.section)    g.unshift({ key: `section_${profile.section}`,  name: `Section ${profile.section} Chat`, meta: `Section ${profile.section}`, icon: '✦' })
  if (profile?.department) g.unshift({ key: `dept_${profile.department}`,  name: profile.department,                meta: 'Department',                 icon: '◇' })
  if (profile?.year)       g.splice(1, 0, { key: `year_${profile.year}`,   name: `Year ${profile.year}`,           meta: `Class of ${2022 + 4 - +profile.year}`, icon: '◐' })
  return g
}

function MsgBubble({ msg, from, time, children, mine, question, indent, onUnsend, onReact, currentUserId }) {
  const [hovered,    setHovered]    = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!showPicker) return
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPicker])

  const reactionGroups = {}
  msg?.reactions?.forEach(r => {
    if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = { count: 0, hasMe: false }
    reactionGroups[r.emoji].count++
    if (r.user_id === currentUserId) reactionGroups[r.emoji].hasMe = true
  })

  const bg    = mine ? 'var(--accent)' : question ? 'color-mix(in oklch, var(--accent) 8%, var(--surface))' : 'var(--surface)'
  const color = mine ? '#fff' : 'var(--text)'
  const showActions = msg && (hovered || showPicker)

  return (
    <div
      ref={wrapperRef}
      style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', gap: 3, marginLeft: indent ? 36 : 0, position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {indent && (
        <div style={{ position: 'absolute', left: -18, top: -10, bottom: 8, width: 14, borderLeft: '1.5px solid var(--border-strong)', borderBottom: '1.5px solid var(--border-strong)', borderBottomLeftRadius: 8 }} />
      )}
      {!mine && from && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{from}</span>
          {question && <span className="q-pill" style={{ background: 'color-mix(in oklch, var(--accent) 15%, transparent)', color: 'var(--accent)', fontSize: 9.5, height: 16, padding: '0 7px', fontWeight: 600 }}>QUESTION</span>}
        </div>
      )}

      {/* Bubble row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexDirection: mine ? 'row-reverse' : 'row', position: 'relative' }}>

        {/* Emoji picker — floats above the bubble */}
        {showPicker && (
          <div style={{
            position: 'absolute',
            [mine ? 'right' : 'left']: 0,
            bottom: 'calc(100% + 6px)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '6px 8px',
            display: 'flex',
            gap: 2,
            boxShadow: 'var(--shadow-md)',
            zIndex: 50,
          }}>
            {REACTION_EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => { onReact?.(msg.id, e); setShowPicker(false) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '3px 5px', borderRadius: 8, lineHeight: 1, transition: 'transform 0.1s' }}
                onMouseEnter={ev => ev.currentTarget.style.transform = 'scale(1.35)'}
                onMouseLeave={ev => ev.currentTarget.style.transform = 'scale(1)'}
              >{e}</button>
            ))}
          </div>
        )}

        {/* Hover action buttons */}
        {showActions && (
          <div style={{ display: 'flex', gap: 3 }}>
            <button
              onClick={() => setShowPicker(p => !p)}
              title="React"
              style={{
                width: 26, height: 26, borderRadius: '50%',
                border: '1px solid var(--border)',
                background: showPicker ? 'var(--surface-2)' : 'var(--surface)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
              }}
            >😊</button>
            {mine && (
              <button
                onClick={() => onUnsend?.(msg.id)}
                title="Unsend"
                style={{
                  width: 26, height: 26, borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: 'var(--danger)',
                }}
              >✕</button>
            )}
          </div>
        )}

        {/* The actual bubble */}
        <div style={{
          background: bg, color, padding: '9px 13px',
          borderRadius: 14, borderTopLeftRadius: mine ? 14 : 4, borderTopRightRadius: mine ? 4 : 14,
          border: mine ? 'none' : '1px solid var(--border)',
          borderLeft: question && !mine ? '3px solid var(--accent)' : (mine ? 'none' : '1px solid var(--border)'),
          maxWidth: 380, fontSize: 13.5, lineHeight: 1.5, boxShadow: mine ? 'none' : 'var(--shadow-sm)',
        }}>
          {children}
        </div>
      </div>

      <span style={{ fontSize: 10.5, color: 'var(--text-faint)', marginLeft: mine ? 0 : 4, marginRight: mine ? 4 : 0 }}>{time}</span>

      {/* Reaction pills */}
      {Object.keys(reactionGroups).length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: mine ? 'flex-end' : 'flex-start', marginTop: 2 }}>
          {Object.entries(reactionGroups).map(([emoji, { count, hasMe }]) => (
            <button
              key={emoji}
              onClick={() => onReact?.(msg.id, emoji)}
              style={{
                background: hasMe ? 'color-mix(in oklch, var(--accent) 18%, var(--surface))' : 'var(--surface-2)',
                border: `1px solid ${hasMe ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 20, padding: '2px 8px',
                fontSize: 12.5, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                color: 'var(--text)',
              }}
            >
              {emoji}
              {count > 1 && <span style={{ fontSize: 11, color: hasMe ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600 }}>{count}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function DMChat({ other, currentUser, onConversationDeleted }) {
  const convId = getConversationId(currentUser.id, other.id)
  const [msgs, setMsgs]         = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const bottomRef = useRef(null)
  const menuRef   = useRef(null)

  useEffect(() => {
    fetchMsgs()
    const ch = supabase.channel(`conv_${convId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
        (payload) => setMsgs(m => [...m, { ...payload.new, reactions: [] }]))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
        (payload) => setMsgs(m => m.filter(x => x.id !== payload.old.id)))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reactions' },
        (payload) => {
          const r = payload.new
          setMsgs(m => m.map(msg => msg.id === r.message_id
            ? { ...msg, reactions: [...(msg.reactions || []).filter(x => x.id !== r.id), r] }
            : msg
          ))
        })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message_reactions' },
        (payload) => {
          const r = payload.old
          setMsgs(m => m.map(msg => msg.id === r.message_id
            ? { ...msg, reactions: (msg.reactions || []).filter(x => x.id !== r.id) }
            : msg
          ))
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [convId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const fetchMsgs = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, reactions:message_reactions(*)')
      .eq('conversation_id', convId)
      .order('created_at')
    if (data) setMsgs(data)
    setLoading(false)
    await supabase.from('messages').update({ read: true }).eq('conversation_id', convId).eq('receiver_id', currentUser.id).eq('read', false)
  }

  const send = async () => {
    if (!input.trim()) return
    await supabase.from('messages').insert({ conversation_id: convId, sender_id: currentUser.id, receiver_id: other.id, content: input.trim() })
    setInput('')
  }

  const unsendMsg = async (msgId) => {
    setMsgs(m => m.filter(x => x.id !== msgId))
    await supabase.from('messages').delete().eq('id', msgId).eq('sender_id', currentUser.id)
  }

  const reactToMsg = async (msgId, emoji) => {
    const msg     = msgs.find(m => m.id === msgId)
    const existing = msg?.reactions?.find(r => r.user_id === currentUser.id && r.emoji === emoji)

    if (existing) {
      setMsgs(m => m.map(msg2 => msg2.id === msgId
        ? { ...msg2, reactions: msg2.reactions.filter(r => r.id !== existing.id) }
        : msg2
      ))
      await supabase.from('message_reactions').delete().eq('id', existing.id)
    } else {
      const tempId = `tmp-${Date.now()}`
      setMsgs(m => m.map(msg2 => msg2.id === msgId
        ? { ...msg2, reactions: [...(msg2.reactions || []), { id: tempId, message_id: msgId, user_id: currentUser.id, emoji }] }
        : msg2
      ))
      const { data } = await supabase.from('message_reactions').insert({ message_id: msgId, user_id: currentUser.id, emoji }).select().single()
      if (data) {
        setMsgs(m => m.map(msg2 => msg2.id === msgId
          ? { ...msg2, reactions: msg2.reactions.map(r => r.id === tempId ? data : r) }
          : msg2
        ))
      }
    }
  }

  const deleteConversation = async () => {
    setDeleting(true)
    await supabase.from('messages').delete().eq('conversation_id', convId)
    setMsgs([])
    setDeleting(false)
    setConfirmDelete(false)
    setMenuOpen(false)
    onConversationDeleted?.(other.id)
  }

  const otherName = fullName(other)

  return (
    <>
      {/* Header */}
      <div style={{ height: 60, padding: '0 16px 0 22px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name={otherName} size={36} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{otherName}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{other.username} · {other.department?.split(' ')[0]}</div>
        </div>

        {/* ⋮ options */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)',
              background: menuOpen ? 'var(--surface-2)' : 'transparent',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, letterSpacing: 1,
            }}
            title="Chat options"
          >⋮</button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: 40, right: 0, zIndex: 100,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, boxShadow: 'var(--shadow-md)',
              minWidth: 190, padding: '6px 0', overflow: 'hidden',
            }}>
              <button
                onClick={() => { setConfirmDelete(true); setMenuOpen(false) }}
                style={{
                  width: '100%', padding: '9px 16px', border: 'none', background: 'transparent',
                  color: 'var(--danger)', fontSize: 13, textAlign: 'left', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'color-mix(in oklch, var(--danger) 10%, transparent)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Icon name="close" size={13} /> Delete conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg)' }}>
        {loading ? <Spinner /> : msgs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 13, marginTop: 40 }}>
            Start the conversation with {otherName.split(' ')[0]}!
          </div>
        ) : msgs.map(m => (
          <MsgBubble
            key={m.id}
            msg={m}
            from={m.sender_id !== currentUser.id ? otherName : null}
            mine={m.sender_id === currentUser.id}
            time={fmt(m.created_at)}
            onUnsend={unsendMsg}
            onReact={reactToMsg}
            currentUserId={currentUser.id}
          >
            {m.content}
          </MsgBubble>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 22px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--surface-2)', borderRadius: 10, padding: '4px 4px 4px 14px' }}>
          <input
            className="q-input"
            placeholder={`Message ${otherName.split(' ')[0]}…`}
            style={{ border: 'none', background: 'transparent', boxShadow: 'none', height: 36, padding: 0 }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button className="q-btn q-btn-primary q-btn-sm" style={{ height: 30, width: 30, padding: 0, borderRadius: 7 }} onClick={send}>
            <Icon name="send" size={13} />
          </button>
        </div>
      </div>

      {/* Delete conversation modal */}
      {confirmDelete && (
        <div className="q-modal-backdrop" onClick={() => setConfirmDelete(false)}>
          <div className="q-modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: 8, color: 'var(--danger)' }}>Delete conversation?</h2>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
              All messages with <strong>{otherName}</strong> will be permanently deleted for both of you. This cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="q-btn q-btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="q-btn q-btn-danger" onClick={deleteConversation} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function CommunityChat({ group, currentUser }) {
  const [msgs, setMsgs]       = useState([])
  const [input, setInput]     = useState('')
  const [isQ, setIsQ]         = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchMsgs()
    const ch = supabase.channel(`comm_${group.key}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages', filter: `group_id=eq.${group.key}` },
        async payload => {
          const { data: sender } = await supabase.from('profiles').select('first_name, last_name, username').eq('id', payload.new.sender_id).single()
          setMsgs(m => [...m, { ...payload.new, sender }])
        })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [group.key])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const fetchMsgs = async () => {
    const { data } = await supabase
      .from('community_messages')
      .select('*, sender:profiles!community_messages_sender_id_fkey(first_name, last_name, username)')
      .eq('group_id', group.key)
      .order('created_at')
      .limit(50)
    if (data) setMsgs(data)
    setLoading(false)
  }

  const send = async () => {
    if (!input.trim()) return
    await supabase.from('community_messages').insert({ sender_id: currentUser.id, group_id: group.key, content: input.trim(), is_question: isQ })
    setInput('')
    setIsQ(false)
  }

  return (
    <>
      <div style={{ height: 60, padding: '0 22px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 16 }}>{group.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{group.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{group.meta}</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--bg)' }}>
        {loading ? <Spinner /> : msgs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 13, marginTop: 40 }}>No messages yet. Say hi!</div>
        ) : msgs.map(m => (
          <MsgBubble key={m.id} from={m.sender_id !== currentUser.id ? fullName(m.sender) : null} mine={m.sender_id === currentUser.id} time={fmt(m.created_at)} question={m.is_question}>
            {m.content}
          </MsgBubble>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '12px 22px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--surface-2)', borderRadius: 10, padding: '4px 4px 4px 4px' }}>
          <button className="q-btn q-btn-ghost q-btn-sm" style={{ height: 30, padding: '0 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 7, background: isQ ? 'color-mix(in oklch, var(--accent) 20%, transparent)' : 'color-mix(in oklch, var(--accent) 12%, transparent)', color: 'var(--accent)', outline: isQ ? '1.5px solid var(--accent)' : 'none' }} onClick={() => setIsQ(q => !q)}>
            <Icon name="question" size={11} /> Question
          </button>
          <input className="q-input" placeholder={`Message ${group.name}…`} style={{ border: 'none', background: 'transparent', boxShadow: 'none', height: 36, padding: 0 }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
          <button className="q-btn q-btn-primary q-btn-sm" style={{ height: 30, width: 30, padding: 0, borderRadius: 7 }} onClick={send}>
            <Icon name="send" size={13} />
          </button>
        </div>
      </div>
    </>
  )
}

export default function Messages() {
  const { profile } = useAuth()
  const [tab, setTab]             = useState('Personal')
  const [conversations, setConvs] = useState([])
  const [allUsers, setAllUsers]   = useState([])
  const [activeId, setActiveId]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const groups = buildGroups(profile)

  useEffect(() => {
    if (!profile) return
    fetchAll()
    const ch = supabase.channel(`msgs_sidebar_${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchConversations)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [profile?.id])

  const fetchAll = async () => {
    await Promise.all([fetchConversations(), fetchAllUsers()])
    setLoading(false)
  }

  const fetchAllUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('status', 'approved')
      .neq('id', profile.id)
      .order('first_name')
    if (data) setAllUsers(data)
  }

  const fetchConversations = async () => {
    const { data: sent }     = await supabase.from('messages').select('receiver_id, created_at, content').eq('sender_id', profile.id).order('created_at', { ascending: false })
    const { data: received } = await supabase.from('messages').select('sender_id, created_at, content, read').eq('receiver_id', profile.id).order('created_at', { ascending: false })

    const partnerMap = new Map()
    sent?.forEach(m => { if (!partnerMap.has(m.receiver_id)) partnerMap.set(m.receiver_id, { lastAt: m.created_at, last: m.content, unread: 0 }) })
    received?.forEach(m => {
      const ex = partnerMap.get(m.sender_id)
      if (!ex || new Date(m.created_at) > new Date(ex.lastAt)) {
        partnerMap.set(m.sender_id, { lastAt: m.created_at, last: m.content, unread: ex ? ex.unread + (!m.read ? 1 : 0) : (!m.read ? 1 : 0) })
      } else if (ex && !m.read) {
        ex.unread++
      }
    })

    if (partnerMap.size === 0) return

    const { data: profiles } = await supabase.from('profiles').select('*').in('id', [...partnerMap.keys()])
    const convs = (profiles || []).map(p => ({ ...p, ...partnerMap.get(p.id) })).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt))
    setConvs(convs)
    if (!activeId && convs.length > 0) setActiveId(convs[0].id)
  }

  const handleConversationDeleted = (partnerId) => {
    setConvs(prev => prev.filter(c => c.id !== partnerId))
    setActiveId(null)
  }

  const activeConv  = conversations.find(c => c.id === activeId) || allUsers.find(u => u.id === activeId)
  const activeGroup = groups.find(g => g.key === activeId) || groups[0]

  // Build merged list: people with convs first (sorted by recency), then rest alphabetically
  const convIds = new Set(conversations.map(c => c.id))
  const others  = allUsers.filter(u => !convIds.has(u.id))
  const q       = search.toLowerCase()
  const filterFn = p => !q || fullName(p).toLowerCase().includes(q) || (p.username || '').toLowerCase().includes(q)
  const filteredConvs  = conversations.filter(filterFn)
  const filteredOthers = others.filter(filterFn)

  return (
    <div className="q-page">
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', minWidth: 0, background: 'var(--bg)' }}>
        {/* Sidebar list */}
        <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 14px 10px' }}>
            <h2 style={{ marginBottom: 10, fontFamily: "'TheTide', var(--font-sans)", fontWeight: 'normal', fontSize: 24, letterSpacing: '0.01em' }}>Messages</h2>
            <div className="q-tabs" style={{ width: '100%', marginBottom: 10 }}>
              <button className={`q-tab${tab === 'Personal' ? ' active' : ''}`} style={{ flex: 1 }} onClick={() => { setTab('Personal') }}>Personal</button>
              <button className={`q-tab${tab === 'Community' ? ' active' : ''}`} style={{ flex: 1 }} onClick={() => { setTab('Community'); setActiveId(groups[0].key) }}>Community</button>
            </div>
            {tab === 'Personal' && (
              <input
                className="q-input"
                placeholder="Search people…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ height: 32, fontSize: 12.5 }}
              />
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
            {tab === 'Personal' ? (
              loading ? <Spinner size={20} /> : (
                <>
                  {filteredConvs.length > 0 && (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 8px 4px' }}>Recent</div>
                      {filteredConvs.map(c => (
                        <div key={c.id} onClick={() => setActiveId(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', borderRadius: 8, background: activeId === c.id ? 'var(--surface-2)' : 'transparent', cursor: 'pointer' }}>
                          <Avatar name={fullName(c)} size={36} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: c.unread ? 600 : 500, fontSize: 13 }}>{fullName(c)}</span>
                              <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{fmt(c.lastAt)}</span>
                            </div>
                            <div style={{ fontSize: 12, color: c.unread ? 'var(--text)' : 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: c.unread ? 500 : 400 }}>{c.last}</div>
                          </div>
                          {c.unread > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 999, minWidth: 18, height: 18, fontSize: 10, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{c.unread}</span>}
                        </div>
                      ))}
                    </>
                  )}
                  {filteredOthers.length > 0 && (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 8px 4px' }}>
                        {filteredConvs.length > 0 ? 'All students' : 'Students'}
                      </div>
                      {filteredOthers.map(u => (
                        <div key={u.id} onClick={() => setActiveId(u.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px', borderRadius: 8, background: activeId === u.id ? 'var(--surface-2)' : 'transparent', cursor: 'pointer' }}>
                          <Avatar name={fullName(u)} size={36} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{fullName(u)}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.username} · {u.department?.split(' ')[0]}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {filteredConvs.length === 0 && filteredOthers.length === 0 && (
                    <div style={{ padding: '20px 10px', fontSize: 12.5, color: 'var(--text-faint)', textAlign: 'center' }}>No students found.</div>
                  )}
                </>
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 0' }}>
                {groups.map(g => (
                  <div key={g.key} onClick={() => setActiveId(g.key)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', borderRadius: 8, cursor: 'pointer', background: activeId === g.key ? 'var(--surface-2)' : 'transparent' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--accent)' }}>{g.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{g.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{g.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!profile ? <Spinner /> : tab === 'Personal' ? (
            activeConv
              ? <DMChat key={activeConv.id} other={activeConv} currentUser={profile} onConversationDeleted={handleConversationDeleted} />
              : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 13 }}>Select a conversation or start one from Search</div>
          ) : (
            <CommunityChat key={activeId} group={activeGroup} currentUser={profile} />
          )}
        </div>
      </main>
    </div>
  )
}
