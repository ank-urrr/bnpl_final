import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'
import DashboardSection from '../components/DashboardSection'
import FinancialHealthSection from '../components/FinancialHealthSection'
import TransactionsSection from '../components/TransactionsSection'
import EditProfileModal from '../components/EditProfileModal'

function NewDashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [profile, setProfile] = useState(null)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [showProfileModal, setShowProfileModal] = useState(false)
  
  const [riskData, setRiskData] = useState(null)
  const [records, setRecords] = useState([])
  const [affordability, setAffordability] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    checkAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount; checkAuth uses navigate/searchParams

  const checkAuth = async () => {
    try {
      const res = await api.get('/auth/status')
      if (!res.data.authenticated) {
        navigate('/')
      } else {
        setUserEmail(res.data.email || '')
        await loadData()
        
        // Auto-sync if coming from OAuth or onboarding
        if (searchParams.get('auth') === 'success' || searchParams.get('onboarding') === 'complete') {
          setTimeout(() => syncEmails(), 1000)
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setLoading(false)
      showMessage('error', 'Failed to connect to backend. Please check your connection.')
      setTimeout(() => navigate('/'), 2000)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // Load profile
      const profileRes = await api.get('/api/user/profile')
      if (profileRes.data.success) {
        setProfile(profileRes.data.data)
      }
      
      // Load records
      const recordsRes = await api.get('/api/bnpl/records')
      setRecords(recordsRes.data.records || [])
      
      // Load risk score
      const riskRes = await api.get('/api/risk-score')
      setRiskData(riskRes.data)
      
      // Load affordability
      const affordRes = await api.get('/api/affordability')
      setAffordability(affordRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
      showMessage('error', 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const syncEmails = async () => {
    setSyncing(true)
    showMessage('info', 'Syncing emails...')
    
    try {
      const res = await api.get('/api/emails/sync')
      
      if (res.data.success) {
        showMessage('success', res.data.message)
        await loadData()
      } else {
        showMessage('error', res.data.message || 'Sync failed')
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to sync emails'
      showMessage('error', errorMsg)
      console.error('Sync error:', error)
    } finally {
      setSyncing(false)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const handleLogout = async () => {
    try {
      await api.get('/auth/logout')
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile)
    showMessage('success', 'Profile updated successfully')
    loadData()
  }

  const handleRecordPaid = (updatedAnalysis, updatedAffordability) => {
    setRiskData(updatedAnalysis)
    setAffordability(updatedAffordability)
    showMessage('success', '✓ Payment recorded successfully')
    loadData()
  }

  const getRiskColor = (score) => {
    if (score < 20) return '#10b981'
    if (score < 50) return '#f59e0b'
    return '#ef4444'
  }

  const getRiskGradient = (score) => {
    if (score < 20) return 'from-green-500 to-emerald-600'
    if (score < 50) return 'from-yellow-500 to-orange-600'
    return 'from-red-500 to-rose-600'
  }

  // Chart data
  const pieData = riskData ? [
    { name: 'BNPL Debt', value: riskData.monthly_obligation },
    { name: 'Available', value: Math.max(0, (profile?.salary || 30000) - riskData.monthly_obligation) }
  ] : []

  const COLORS = ['#8b5cf6', '#10b981']

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] flex">
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-[#1E1E1E] border-b border-[rgba(212,175,55,0.1)] sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 w-full">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-[#F5F5F5]">
                  {activeSection === 'dashboard' && 'BNPL Analytics'}
                  {activeSection === 'health' && 'Financial Health'}
                  {activeSection === 'transactions' && 'Transactions'}
                  {activeSection === 'settings' && 'Settings'}
                </h1>
                <p className="text-sm text-[#A1A1AA]">{userEmail}</p>
              </div>
              
              <div className="flex items-center gap-3">
                {activeSection === 'health' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowProfileModal(true)}
                    className="px-4 py-2 bg-[#D4AF37] text-[#121212] rounded font-semibold hover:shadow-lg hover:shadow-[rgba(212,175,55,0.3)] transition text-sm"
                  >
                    ✏️ Edit Profile
                  </motion.button>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={syncEmails}
                  disabled={syncing}
                  className="px-4 py-2 bg-[#1E1E1E] border border-[rgba(212,175,55,0.3)] text-[#D4AF37] rounded font-semibold hover:border-[rgba(212,175,55,0.5)] transition text-sm disabled:opacity-50"
                >
                  {syncing ? '⏳ Syncing...' : '🔄 Sync Emails'}
                </motion.button>
              </div>
            </div>
          </div>
        </header>

        {/* Message Banner */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-7xl mx-auto px-6 py-3 mt-4 rounded ${
              message.type === 'success' ? 'bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] text-[#22C55E]' :
              message.type === 'error' ? 'bg-[rgba(220,38,38,0.1)] border border-[rgba(220,38,38,0.3)] text-[#DC2626]' :
              'bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.3)] text-[#D4AF37]'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-8 w-full">
            <AnimatePresence mode="wait">
              {activeSection === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Welcome Section */}
                  <motion.div className="mb-8">
                    <h2 className="text-3xl font-bold text-[#F5F5F5] mb-2">
                      Welcome back, {profile?.full_name || 'User'}! 👋
                    </h2>
                    <p className="text-[#A1A1AA]">
                      Here's your BNPL financial overview
                    </p>
                  </motion.div>

                  {/* Dashboard Section Component */}
                  {riskData && (
                    <DashboardSection profile={profile} riskData={riskData} records={records} affordability={affordability} />
                  )}
                </motion.div>
              )}

              {activeSection === 'health' && (
                <motion.div
                  key="health"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {riskData && (
                    <FinancialHealthSection 
                      profile={profile} 
                      riskData={riskData} 
                      onProfileUpdate={handleProfileUpdate}
                    />
                  )}
                </motion.div>
              )}

              {activeSection === 'transactions' && (
                <motion.div
                  key="transactions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <TransactionsSection records={records} riskData={riskData} onRecordPaid={handleRecordPaid} />
                </motion.div>
              )}

              {activeSection === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="luxury-card p-8 border-[rgba(212,175,55,0.2)] space-y-6"
                  >
                    <h3 className="text-2xl font-bold text-[#D4AF37]">⚙️ Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-[#1E1E1E] rounded border border-[rgba(212,175,55,0.15)]">
                        <div>
                          <p className="text-[#F5F5F5] font-semibold">Email</p>
                          <p className="text-gray-400 text-sm">{userEmail}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div>
                          <p className="text-white font-semibold">Full Name</p>
                          <p className="text-gray-400 text-sm">{profile?.full_name || 'Not set'}</p>
                        </div>
                        <button
                          onClick={() => setShowProfileModal(true)}
                          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition"
                        >
                          Edit
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div>
                          <p className="text-white font-semibold">Monthly Salary</p>
                          <p className="text-gray-400 text-sm">₹{profile?.salary?.toLocaleString() || '0'}</p>
                        </div>
                        <button
                          onClick={() => setShowProfileModal(true)}
                          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-red-500/10 to-rose-600/10 backdrop-blur-lg rounded-2xl p-8 border border-red-500/30"
                  >
                    <h3 className="text-2xl font-bold text-red-400 mb-4">🚪 Logout</h3>
                    <p className="text-gray-300 mb-6">Sign out from your account</p>
                    <button
                      onClick={handleLogout}
                      className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition font-semibold"
                    >
                      Logout
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal 
        profile={profile} 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)}
        onSave={handleProfileUpdate}
      />
    </div>
  )
}

export default NewDashboard
