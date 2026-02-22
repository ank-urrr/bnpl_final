import { motion } from 'framer-motion'
import { useState } from 'react'

function Sidebar({ activeSection, setActiveSection, onLogout }) {
  const [isOpen, setIsOpen] = useState(true)

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'health', label: 'Financial Health', icon: '💰' },
    { id: 'transactions', label: 'Transactions', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="w-64 bg-[#121212] border-r h-screen flex flex-col" style={{ borderColor: 'rgba(212,175,55,0.15)' }}
    >
      {/* Logo Section */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <img src="/logo.png" alt="FinPilot Logo" className="w-8 h-8 rounded-lg object-contain bg-[#121212] p-0.5 border border-[rgba(212,175,55,0.4)] shadow-[0_0_10px_rgba(212,175,55,0.2)]" />
            <div className="flex items-baseline gap-0.5 mt-1">
              <h1 className="text-xl font-bold text-[#D4AF37]">Fin</h1>
              <h1 className="text-xl font-bold text-[#F5F5F5]">Pilot</h1>
            </div>
          </div>
          <p className="text-xs text-[#A1A1AA] tracking-widest uppercase">Financial Intelligence</p>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-300 ${
              activeSection === item.id
                ? 'bg-[#1E1E1E] text-[#D4AF37] border-l-2 border-[#D4AF37]'
                : 'text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[rgba(212,175,55,0.05)]'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium text-sm">{item.label}</span>
            {activeSection === item.id && (
              <motion.div
                layoutId="activeIndicator"
                className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D4AF37]"
              />
            )}
          </motion.button>
        ))}
      </nav>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[rgba(212,175,55,0.1)] to-transparent mx-4"></div>

      {/* Logout Button */}
      <div className="p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className="w-full px-4 py-2.5 bg-[#1E1E1E] hover:bg-[rgba(220,38,38,0.1)] text-[#DC2626] border border-[rgba(220,38,38,0.2)] rounded transition-all font-medium text-sm"
        >
          🚪 Logout
        </motion.button>
      </div>
    </motion.div>
  )
}

export default Sidebar
