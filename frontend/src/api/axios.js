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

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Check if token is in URL and store it
const urlParams = new URLSearchParams(window.location.search)
const tokenFromUrl = urlParams.get('token')
if (tokenFromUrl) {
  localStorage.setItem('authToken', tokenFromUrl)
  // Clean up URL to remove token parameter
  const newUrl = window.location.pathname
  window.history.replaceState({}, document.title, newUrl)
}

// Add request interceptor to include JWT token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
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


