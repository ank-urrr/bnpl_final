import { useEffect } from 'react'
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

  const getLoginUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)
    return `${apiUrl}/auth/login`
  }

  const handleLogin = () => {
    window.location.href = getLoginUrl()
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>BNPL Guardian</h1>
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

        <button className="login-btn" onClick={handleLogin}>
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            className="google-icon"
          />
          Connect with Gmail
        </button>

        <p className="privacy-note">
          We only read emails to detect BNPL transactions. Your data stays secure.
        </p>
      </div>
    </div>
  )
}

export default Login
