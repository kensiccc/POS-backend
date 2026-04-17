import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginPage({ onLogin, errorMessage }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onLogin(email, password)
      navigate('/', { replace: true })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-view">
      <div className="login-panel">
        <div className="login-brand">
          <h1>House Blend POS</h1>
          <p>Secure access for cashiers and managers.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@houseblend.local"
            required
          />

          <label>Password</label>
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {errorMessage && <div className="form-error">{errorMessage}</div>}

          <button type="submit" className="login-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="login-help">
            <p>Use demo credentials:</p>
            <p><strong>admin@houseblend.local</strong> / Admin123!</p>
            <p><strong>cashier@houseblend.local</strong> / Cashier123!</p>
            <p className="login-note">Make sure the backend is running at <strong>http://localhost:3000</strong> or update <code>VITE_API_URL</code> in <code>pos.jsx/.env</code>.</p>
          </div>
        </form>
      </div>
    </div>
  )
}
