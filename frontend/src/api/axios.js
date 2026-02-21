import axios from 'axios'

const getApiUrl = () => {
  // Use environment variable if set, otherwise default based on environment
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Development: use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:5000'
  }
  
  // Production: use current domain (assuming backend is on same domain or use relative paths)
  // For GitHub Pages, this would need a backend server accessible from that domain
  return window.location.origin
}

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default api

