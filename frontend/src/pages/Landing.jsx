import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api/axios'

function Landing() {
  const navigate = useNavigate()

  useEffect(() => {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121212] via-[#1A1A1A] to-[#121212]">
      {/* Navigation */}
      <nav className="border-b backdrop-blur-sm" style={{ borderColor: 'rgba(212,175,55,0.15)' }}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="text-2xl font-bold"
          >
            <span className="text-[#D4AF37]">BNPL</span>
            <span className="text-[#F5F5F5] ml-2">Guardian</span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-[#A1A1AA]"
          >
            Financial Intelligence Platform
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center space-y-8"
        >
          {/* Main Headline */}
          <motion.div variants={itemVariants}>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="text-[#F5F5F5]">Master Your</span>
              <br />
              <span className="text-[#D4AF37]">Buy Now Pay Later</span>
              <br />
              <span className="text-[#F5F5F5]">Obligations</span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p 
            variants={itemVariants}
            className="text-xl text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed"
          >
            Elite financial intelligence for BNPL management. Track commitments, 
            assess risk, and optimize your financial health with precision analytics.
          </motion.p>

          {/* CTA Button */}
          <motion.div variants={itemVariants} className="pt-4">
            <button 
              onClick={handleLogin}
              className="group px-8 py-3 bg-[#D4AF37] text-[#121212] font-semibold rounded text-lg transition-all duration-300 hover:shadow-lg hover:shadow-[rgba(212,175,55,0.3)] hover:-translate-y-1 flex items-center gap-3 mx-auto"
            >
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google" 
                className="w-5 h-5"
              />
              <span>Connect with Gmail</span>
            </button>
          </motion.div>

          {/* Security Note */}
          <motion.p 
            variants={itemVariants}
            className="text-sm text-[#A1A1AA] pt-2"
          >
            Read-only access to BNPL emails. Your data remains secure and private.
          </motion.p>
        </motion.div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[rgba(212,175,55,0.2)] to-transparent max-w-6xl mx-auto"></div>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-8"
        >
          {[
            {
              title: "Auto-Detection",
              description: "Intelligently identifies BNPL transactions from email headers with 99% accuracy.",
              icon: "📧"
            },
            {
              title: "Risk Analytics",
              description: "Real-time risk assessment powered by sophisticated financial algorithms.",
              icon: "⚠️"
            },
            {
              title: "Financial Health",
              description: "Comprehensive analysis of obligations, disposable income, and savings ratio.",
              icon: "📊"
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="luxury-card p-8 space-y-4 transition-all hover:shadow-lg" style={{ borderColor: 'rgba(212,175,55,0.25)' }}
            >
              <div className="text-4xl">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-[#F5F5F5]">
                {feature.title}
              </h3>
              <p className="text-[#A1A1AA] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Trust Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-[#1E1E1E] to-[#242424] border rounded p-8 md:p-12 text-center space-y-3" style={{ borderColor: 'rgba(212,175,55,0.15)' }}
        >
          <p className="text-[#A1A1AA]">Trusted by financial-conscious users</p>
          <p className="text-2xl font-semibold text-[#F5F5F5]">
            Privacy-First • Secure • Intelligent
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-24" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
        <div className="max-w-6xl mx-auto px-6 py-12 text-center text-[#A1A1AA] text-sm">
          <p>© 2026 BNPL Guardian. Financial intelligence, reimagined.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
