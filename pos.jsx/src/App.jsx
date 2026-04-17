import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import POSPage from './pages/POSPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import { fetchMe, login as loginRequest } from './services/api'

function App() {
  const [darkMode, setDarkMode] = useState(() =>
    localStorage.getItem('hb_dark') === 'true'
  )
  const [token, setToken] = useState(() => localStorage.getItem('hb_token'))
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(!!token)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    localStorage.setItem('hb_dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    if (!token) {
      return
    }

    fetchMe(token)
      .then((profile) => {
        setUser(profile)
        setAuthLoading(false)
      })
      .catch(() => {
        setToken(null)
        setUser(null)
        localStorage.removeItem('hb_token')
        setAuthLoading(false)
      })
  }, [token])

  const handleLogin = async (email, password) => {
    try {
      setAuthError('')
      const { token: newToken, user: profile } = await loginRequest(email, password)
      setToken(newToken)
      setUser(profile)
      localStorage.setItem('hb_token', newToken)
      setAuthError('')
    } catch (error) {
      setAuthError(error.message)
      throw error
    }
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('hb_token')
  }

  const toggleDark = () => setDarkMode(!darkMode)

  if (authLoading) {
    return <div className="loading-screen">Loading session…</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} errorMessage={authError} />}
        />
        <Route
          path="/"
          element={token ? (
            <POSPage
              darkMode={darkMode}
              onToggleDark={toggleDark}
              token={token}
              currentUser={user}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )}
        />
        <Route
          path="/dashboard"
          element={token ? (
            <DashboardPage
              darkMode={darkMode}
              onToggleDark={toggleDark}
              token={token}
              currentUser={user}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
