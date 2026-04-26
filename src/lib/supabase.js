import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://gxamlfchejbkakmhbwoh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4YW1sZmNoZWpia2FrbWhid29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDc5NTMsImV4cCI6MjA5MjcyMzk1M30.4YRxlScFrQEqj_ni1Z04bo6cT4AGFsxrAGkpIv6U4kA'
)

export const getConversationId = (uid1, uid2) =>
  [uid1, uid2].sort().join('_')

export const fmt = (ts) => {
  const d = new Date(ts)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export const fullName = (p) => p ? `${p.first_name} ${p.last_name}` : ''
