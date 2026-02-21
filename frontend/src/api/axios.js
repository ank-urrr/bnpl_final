import axios from 'axios'

const getApiUrl = () => {
  // Priority 1: Use environment variable if set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Priority 2: Development environment
  if (import.meta.env.DEV) {
    return 'http://localhost:5000'
  }
  
  // Priority 3: Production - check if we're on GitHub Pages
  const hostname = window.location.hostname
  if (hostname.includes('github.io')) {
    // GitHub Pages - use a backend service (Heroku, Railway, etc.)
    // You need to set VITE_API_URL environment variable during build
    console.warn('GitHub Pages detected. Please set VITE_API_URL environment variable.')
    return 'http://localhost:5000' // Fallback - won't work on GitHub Pages
  }
  
  // Priority 4: Same domain (for self-hosted deployments)
  return window.location.origin
}

// Flag to track if code exchange is in progress
let codeExchangePromise = Promise.resolve()

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Handle auth code exchange on page load
const urlParams = new URLSearchParams(window.location.search)
const authCode = urlParams.get('code')

console.log('[Auth] Checking for auth code:', authCode)
console.log('[Auth] Token in storage:', !!localStorage.getItem('authToken'))

if (authCode && !localStorage.getItem('authToken')) {
  console.log('[Auth] Exchanging code for token:', authCode)
  // Create a promise for code exchange and make it global
  codeExchangePromise = axios.get(`${getApiUrl()}/auth/exchange-code?code=${authCode}`)
    .then(res => {
      console.log('[Auth] Code exchange successful:', res.data)
      if (res.data.token) {
        localStorage.setItem('authToken', res.data.token)
        console.log('[Auth] Token saved to localStorage')
        // Clean up URL to remove code parameter
        const newUrl = window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
        console.log('[Auth] URL cleaned:', newUrl)
      }
    })
    .catch(err => {
      console.error('[Auth] Code exchange failed:', err.response?.data || err.message)
      // Redirect to login on failure after a short delay
      setTimeout(() => {
        console.log('[Auth] Redirecting to login due to exchange failure')
        window.location.href = '/'
      }, 500)
    })
} else if (authCode && localStorage.getItem('authToken')) {
  console.log('[Auth] Token already exists, cleaning URL')
  const newUrl = window.location.pathname
  window.history.replaceState({}, document.title, newUrl)
}

// Add a global interceptor that waits for code exchange THEN adds token
api.interceptors.request.use(
  async config => {
    // Wait for code exchange to complete before making API calls
    if (codeExchangePromise) {
      try {
        await codeExchangePromise
      } catch (err) {
        console.error('[Auth] Code exchange promise failed:', err)
      }
    }
    
    // Add token to request
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`)
    return config
  },
  error => {
    console.error('[API] Request error:', error)
    return Promise.reject(error)
  }
)

// Add error interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear it
      localStorage.removeItem('authToken')
      window.location.href = '/'
    }
    if (error.response?.status === 0 || error.message === 'Network Error') {
      console.error('Backend service unavailable. Make sure the backend is running.')
    }
    return Promise.reject(error)
  }
)

export default api


