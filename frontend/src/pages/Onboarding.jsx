import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/axios'

function Onboarding() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authChecked, setAuthChecked] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: '',
    salary: '',
    monthly_rent: '',
    other_expenses: '',
    city: '',
    existing_loans: ''
  })

  useEffect(() => {
    // If we have an auth code in URL, wait a bit for code exchange to complete
    const code = searchParams.get('code')
    console.log('[Onboarding] Checking auth, code in URL:', !!code)
    
    if (code) {
      // Give code exchange time to complete (it should set token in localStorage)
      const checkTimer = setTimeout(() => {
        const token = localStorage.getItem('authToken')
        console.log('[Onboarding] After code exchange, token present:', !!token)
        setAuthChecked(true)
        
        if (!token) {
          console.log('[Onboarding] No token after code exchange, redirecting to login')
          navigate('/')
        }
      }, 1000)
      return () => clearTimeout(checkTimer)
    }
    
    // No code in URL - check auth status directly
    console.log('[Onboarding] No code in URL, checking auth status')
    api.get('/auth/status')
      .then(res => {
        console.log('[Onboarding] Auth status:', res.data)
        setAuthChecked(true)
        if (!res.data.authenticated) {
          navigate('/')
        }
      })
      .catch(err => {
        console.error('[Onboarding] Auth check failed:', err)
        setAuthChecked(true)
        navigate('/')
      })
  }, [navigate, searchParams])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleNext = () => {
    if (step === 1 && !formData.full_name) {
      setError('Please enter your full name')
      return
    }
    if (step === 2 && !formData.salary) {
      setError('Please enter your monthly salary')
      return
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.full_name || !formData.salary) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.post('/api/user/profile', {
        full_name: formData.full_name,
        salary: parseFloat(formData.salary),
        monthly_rent: parseFloat(formData.monthly_rent) || 0,
        other_expenses: parseFloat(formData.other_expenses) || 0,
        city: formData.city,
        existing_loans: parseFloat(formData.existing_loans) || 0
      })

      if (response.data.success) {
        navigate('/dashboard?onboarding=complete')
      } else {
        setError(response.data.message || 'Failed to save profile')
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save profile. Please try again.'
      setError(msg)
      console.error('Onboarding error:', err)
    } finally {
      setLoading(false)
    }
  }

  const progress = (step / 3) * 100

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Verifying authentication...</p>
          <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-400">Help us personalize your financial insights</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-sm text-gray-400">
            <span>Step {step} of 3</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
            />
          </div>
        </div>

        {/* Form Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-white/10"
        >
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
                    placeholder="Enter your full name"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
                    placeholder="e.g., Mumbai, Delhi, Bangalore"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Income */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monthly Salary <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-400">₹</span>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      className="w-full pl-8 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
                      placeholder="30000"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Your monthly take-home salary</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monthly Rent
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-400">₹</span>
                    <input
                      type="number"
                      name="monthly_rent"
                      value={formData.monthly_rent}
                      onChange={handleChange}
                      className="w-full pl-8 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
                      placeholder="10000"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Expenses */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Other Monthly Expenses
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-400">₹</span>
                    <input
                      type="number"
                      name="other_expenses"
                      value={formData.other_expenses}
                      onChange={handleChange}
                      className="w-full pl-8 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
                      placeholder="5000"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Food, transport, utilities, etc.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Existing Loans (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-400">₹</span>
                    <input
                      type="number"
                      name="existing_loans"
                      value={formData.existing_loans}
                      onChange={handleChange}
                      className="w-full pl-8 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Personal loans, car loans, etc.</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
                >
                  Back
                </button>
              ) : (
                <div></div>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Complete Setup'}
                </button>
              )}
            </div>
          </form>
        </motion.div>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            Skip for now →
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default Onboarding
