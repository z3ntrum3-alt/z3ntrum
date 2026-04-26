import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar.jsx'
import DeptPill from './DeptPill.jsx'
import Icon from './Icon.jsx'
import { supabase, getConversationId, fullName } from '../lib/supabase'
import { useAuth } from '../context/AuthContext.jsx'

export default function PostCard({ postId, author, dept, time, content, badge, helpButton, isOwn, onRemove }) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [offered, setOffered]     = useState(false)
  const [offerModal, setOfferModal] = useState(false)
  const [message, setMessage]     = useState('')
  const [sending, setSending]     = useState(false)

  const openOffer = () => {
    setMessage(`Hey ${author.name.split(' ')[0]}, I saw your post and I think I can help! `)
    setOfferModal(true)
  }

  const sendOffer = async () => {
    if (!message.trim() || sending || !profile) return
    setSending(true)

    // Insert help_offer record (triggers notification automatically via DB trigger)
    if (postId) {
      await supabase.from('help_offers').upsert({ post_id: postId, offerer_id: profile.id, message: message.trim() })
    }

    // Send DM — we need the receiver's profile id; fetch by username
    const { data: receiverProfile } = await supabase.from('profiles').select('id').eq('username', author.username).single()
    if (receiverProfile) {
      const convId = getConversationId(profile.id, receiverProfile.id)
      await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id:   profile.id,
        receiver_id: receiverProfile.id,
        content:     message.trim(),
      })
    }

    setOffered(true)
    setOfferModal(false)
    setSending(false)
    navigate('/messages')
  }

  return (
    <>
      <div className="q-card q-card-hover" style={{ padding: 16, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Avatar name={author.name} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: 13.5 }}>{author.name}</span>
              {dept && <DeptPill dept={dept} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-faint)' }}>
              <span>{author.username}</span>
              <span>·</span>
              <span>{time}</span>
            </div>
          </div>
          {badge && (
            <span className="q-pill" style={{
              background: badge === 'Help Request' || badge === 'Help'
                ? 'color-mix(in oklch, var(--accent) 15%, transparent)'
                : 'var(--surface-2)',
              color: badge === 'Help Request' || badge === 'Help'
                ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: 600,
            }}>{badge}</span>
          )}
        </div>
        <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>{content}</div>
        {(helpButton || isOwn) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            {isOwn && onRemove && (
              <button className="q-btn q-btn-sm" style={{ background: 'color-mix(in oklch, var(--success) 12%, transparent)', color: 'var(--success)', border: '1px solid color-mix(in oklch, var(--success) 30%, transparent)' }} onClick={onRemove}>
                <Icon name="check" size={12} /> Mark resolved
              </button>
            )}
            {helpButton && !isOwn && (
              <button className="q-btn q-btn-sm"
                style={offered ? {
                  background: 'color-mix(in oklch, var(--success) 12%, transparent)',
                  color: 'var(--success)',
                  border: '1px solid color-mix(in oklch, var(--success) 30%, transparent)',
                } : { border: '1px solid var(--border-strong)', color: 'var(--text)' }}
                onClick={offered ? undefined : openOffer}
              >
                <Icon name={offered ? 'check' : 'sparkle'} size={12} />
                {offered ? 'Message sent' : 'Offer help'}
              </button>
            )}
          </div>
        )}
      </div>

      {offerModal && (
        <div className="q-modal-backdrop" onClick={() => setOfferModal(false)}>
          <div className="q-modal" onClick={e => e.stopPropagation()}>
            <button className="q-btn q-btn-ghost q-btn-sm" style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, padding: 0, borderRadius: 8 }} onClick={() => setOfferModal(false)}>
              <Icon name="close" size={14} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Avatar name={author.name} size={36} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{author.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{author.username}</div>
              </div>
            </div>
            <h2 style={{ marginBottom: 4 }}>Offer help</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Write a message — {author.name.split(' ')[0]} will receive it in their inbox.
            </p>
            <div style={{ padding: '10px 14px', marginBottom: 14, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, borderLeft: '3px solid var(--accent)' }}>
              {typeof content === 'string' ? content : 'Help request'}
            </div>
            <textarea className="q-textarea" rows={4} placeholder="Describe how you can help…" value={message} onChange={e => setMessage(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button className="q-btn q-btn-ghost" onClick={() => setOfferModal(false)}>Cancel</button>
              <button className="q-btn q-btn-primary" onClick={sendOffer} disabled={sending}>
                <Icon name="send" size={14} /> {sending ? 'Sending…' : 'Send message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
