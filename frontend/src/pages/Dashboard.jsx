import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import '../styles/Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [salary, setSalary] = useState(30000)
  const [editingSalary, setEditingSalary] = useState(false)

  const [riskData, setRiskData] = useState(null)
  const [records, setRecords] = useState([])
  const [syncMessage, setSyncMessage] = useState('')

  useEffect(() => {
    // Check authentication
    api.get('/auth/status')
      .then(res => {
        if (!res.data.authenticated) {
          navigate('/')
        } else {
          setUserEmail(res.data.email || '')
          loadData()

          // Auto-sync if coming from OAuth callback
          if (searchParams.get('auth') === 'success') {
            syncEmails()
          }
        }
      })
      .catch(() => navigate('/'))
  }, [navigate, searchParams])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load salary
      const salaryRes = await api.get('/api/user/salary')
      setSalary(salaryRes.data.salary)

      // Load records
      const recordsRes = await api.get('/api/bnpl/records')
      setRecords(recordsRes.data.records || [])

      // Load risk score
      const riskRes = await api.get('/api/risk-score')
      setRiskData(riskRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const syncEmails = async () => {
    setSyncing(true)
    setSyncMessage('Syncing emails...')

    try {
      const res = await api.get('/api/emails/sync')
      setSyncMessage(`✓ Synced ${res.data.bnpl_count} BNPL records from ${res.data.synced_count} emails`)

      // Reload data after sync
      await loadData()

      setTimeout(() => setSyncMessage(''), 5000)
    } catch (error) {
      setSyncMessage('✗ Error syncing emails')
      console.error('Sync error:', error)
    } finally {
      setSyncing(false)
    }
  }

  const updateSalary = async () => {
    try {
      await api.post('/api/user/salary', { salary })
      setEditingSalary(false)
      await loadData()
    } catch (error) {
      console.error('Error updating salary:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await api.get('/auth/logout')
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getRiskColor = (score) => {
    if (score < 20) return '#10b981'
    if (score < 50) return '#f59e0b'
    return '#ef4444'
  }

  const getRiskLabel = (level) => {
    const labels = {
      'Low': '🟢 Low Risk',
      'Medium': '🟡 Medium Risk',
      'High': '🔴 High Risk',
      'None': '⚪ No Data'
    }
    return labels[level] || level
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>FinPilot</h1>
          <p className="user-email">{userEmail}</p>
        </div>
        <div className="header-actions">
          <button
            className="sync-btn"
            onClick={syncEmails}
            disabled={syncing}
          >
            {syncing ? '⏳ Syncing...' : '🔄 Sync Emails'}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {syncMessage && (
        <div className={`sync-message ${syncMessage.includes('✗') ? 'error' : 'success'}`}>
          {syncMessage}
        </div>
      )}

      <div className="salary-section">
        <label>Monthly Salary:</label>
        {editingSalary ? (
          <div className="salary-edit">
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(Number(e.target.value))}
              className="salary-input"
            />
            <button onClick={updateSalary} className="save-btn">Save</button>
            <button onClick={() => setEditingSalary(false)} className="cancel-btn">Cancel</button>
          </div>
        ) : (
          <div className="salary-display">
            <span className="salary-value">₹{salary.toLocaleString()}</span>
            <button onClick={() => setEditingSalary(true)} className="edit-btn">Edit</button>
          </div>
        )}
      </div>

      {riskData && (
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Total Outstanding</h3>
            <p className="metric-value">₹{riskData.total_outstanding.toLocaleString()}</p>
          </div>

          <div className="metric-card">
            <h3>Monthly Obligation</h3>
            <p className="metric-value">₹{riskData.monthly_obligation.toLocaleString()}</p>
          </div>

          <div className="metric-card">
            <h3>Debt-to-Income Ratio</h3>
            <p className="metric-value">{(riskData.debt_ratio * 100).toFixed(1)}%</p>
          </div>

          <div className="metric-card risk-card" style={{ borderColor: getRiskColor(riskData.risk_score) }}>
            <h3>Risk Score</h3>
            <p className="metric-value" style={{ color: getRiskColor(riskData.risk_score) }}>
              {riskData.risk_score}
            </p>
            <p className="risk-label">{getRiskLabel(riskData.risk_level)}</p>
          </div>
        </div>
      )}

      <div className="records-section">
        <h2>BNPL Records ({records.length})</h2>

        {records.length === 0 ? (
          <div className="empty-state">
            <p>No BNPL commitments detected.</p>
            <p className="empty-hint">Click "Sync Emails" to scan your Gmail for BNPL transactions.</p>
          </div>
        ) : (
          <div className="records-table-container">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Installments</th>
                  <th>Due Date</th>
                  <th>Email Subject</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.vendor}</td>
                    <td>₹{record.amount.toLocaleString()}</td>
                    <td>{record.installments}</td>
                    <td>{record.due_date || 'N/A'}</td>
                    <td className="subject-cell">{record.email_subject}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
