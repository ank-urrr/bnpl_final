import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import '../styles/Login.css'

function Login() {
  const navigate = useNavigate()

  useEffect(() => {
    // Check if already authenticated
    api.get('/auth/status')
      .then(res => {
        if (res.data.authenticated) {
          navigate('/dashboard')
        }
      })
      .catch(err => console.log('Not authenticated'))
  }, [navigate])

  const [backendAvailable, setBackendAvailable] = useState(null)

  useEffect(() => {
    let mounted = true
    api.get('/api/health')
      .then(() => mounted && setBackendAvailable(true))
      .catch(() => mounted && setBackendAvailable(false))
    return () => { mounted = false }
  }, [])

  const getLoginUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)
    return `${apiUrl}/auth/login`
  }

  const handleLogin = async () => {
    const loginUrl = getLoginUrl()
    try {
      await api.get('/api/health')
      window.location.href = loginUrl
    } catch (e) {
      window.alert('Backend service is unavailable from this site. Please try again later or contact the administrator.')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>FinPilot</h1>
        <p className="subtitle">Track your Buy Now Pay Later commitments</p>

        <div className="features">
          <div className="feature">
            <span className="icon">📧</span>
            <span>Auto-detect BNPL emails</span>
          </div>
          <div className="feature">
            <span className="icon">📊</span>
            <span>Calculate debt ratio</span>
          </div>
          <div className="feature">
            <span className="icon">⚠️</span>
            <span>Risk assessment</span>
          </div>
        </div>

        <button className="login-btn" onClick={handleLogin} disabled={backendAvailable === false}>
          <img
            src="https://www.google.com/favicon.ico"
            alt="Google"
            className="google-icon"
          />
          {backendAvailable === false ? 'Connect unavailable' : 'Connect with Gmail'}
        </button>

        {backendAvailable === false && (
          <p className="privacy-note" style={{ color: '#FFD580' }}>
            Backend not reachable from this site. Deploy the backend and set `VITE_API_URL` in production to enable Gmail integration.
          </p>
        )}

        <p className="privacy-note">
          We only read emails to detect BNPL transactions. Your data stays secure.
        </p>
      </div>
    </div>
  )
}

export default Login
