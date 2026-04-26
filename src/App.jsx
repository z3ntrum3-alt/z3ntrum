import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Spinner from './components/Spinner.jsx'

import Login           from './pages/Login.jsx'
import Signup          from './pages/Signup.jsx'
import CompleteProfile from './pages/CompleteProfile.jsx'
import Pending         from './pages/Pending.jsx'
import Home            from './pages/Home.jsx'
import Help            from './pages/Help.jsx'
import Profile         from './pages/Profile.jsx'
import Messages        from './pages/Messages.jsx'
import Events          from './pages/Events.jsx'
import Search          from './pages/Search.jsx'
import Contact         from './pages/Contact.jsx'
import Settings        from './pages/Settings.jsx'
import Notifications   from './pages/Notifications.jsx'
import Admin          from './pages/Admin.jsx'
import AuthCallback   from './pages/AuthCallback.jsx'

function profileComplete(p) {
  return p && p.first_name && p.last_name && p.username &&
         p.usn && p.department && p.year && p.section
}

function Guard({ children }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  const isAdmin = profile?.role === 'admin'

  // Admins skip the profile completeness check — they go straight to the app
  if (!isAdmin && !profileComplete(profile) && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />
  }

  // Students must wait for admin approval
  if (!isAdmin &&
      profile?.status === 'pending' &&
      location.pathname !== '/pending') {
    return <Navigate to="/pending" replace />
  }

  return children
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/home" replace />
  return children
}

// Logged-in only, no completeness check (for complete-profile and pending pages)
function AuthOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Admin-only guard
function AdminGuard({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role !== 'admin') return <Navigate to="/home" replace />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />

            <Route path="/login"  element={<GuestOnly><Login /></GuestOnly>} />
            <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Profile gate — must be logged in but no completeness check */}
            <Route path="/complete-profile" element={<AuthOnly><CompleteProfile /></AuthOnly>} />
            <Route path="/pending"          element={<AuthOnly><Pending /></AuthOnly>} />

            {/* Admin panel — admins only */}
            <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />

            {/* Main app — requires login + complete profile + approved */}
            <Route path="/home"          element={<Guard><Home /></Guard>} />
            <Route path="/help"          element={<Guard><Help /></Guard>} />
            <Route path="/messages"      element={<Guard><Messages /></Guard>} />
            <Route path="/events"        element={<Guard><Events /></Guard>} />
            <Route path="/notifications" element={<Guard><Notifications /></Guard>} />
            <Route path="/search"        element={<Guard><Search /></Guard>} />
            <Route path="/profile"       element={<Guard><Profile /></Guard>} />
            <Route path="/contact"       element={<Guard><Contact /></Guard>} />
            <Route path="/settings"      element={<Guard><Settings /></Guard>} />

            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
