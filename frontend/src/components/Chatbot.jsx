import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendMessage = async (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const newHistory = [...messages, { role: 'user', content: text }]
    setMessages(newHistory)
    setInput('')
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/api/chat', {
        message: text,
        history: newHistory,
      })
      const reply = res.data.reply || 'Sorry, I could not generate a response.'
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      console.error('Chat error:', err)
      const msg = err.response?.data?.error || 'Chatbot is unavailable right now.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-full bg-[#D4AF37] text-[#121212] font-semibold shadow-lg shadow-[rgba(212,175,55,0.4)] flex items-center gap-2"
      >
        <span>💬</span>
        <span>Ask Guardian AI</span>
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-6 z-50 w-80 max-h-[70vh] bg-[#121212] border border-[rgba(212,175,55,0.3)] rounded-2xl shadow-2xl flex flex-col"
          >
            <div className="px-4 py-3 border-b border-[rgba(212,175,55,0.2)] flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#F5F5F5]">Guardian Assistant</p>
                <p className="text-xs text-[#A1A1AA]">Ask anything about your BNPL health</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#A1A1AA] hover:text-[#F5F5F5] text-lg leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm bg-[#050505]">
              {messages.length === 0 && (
                <p className="text-[#A1A1AA] text-xs">
                  Try questions like:
                  <br />• &quot;Is my BNPL risk too high?&quot;
                  <br />• &quot;How can I reduce my monthly EMI?&quot;
                </p>
              )}
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`max-w-[85%] p-2 rounded-lg ${
                    m.role === 'user'
                      ? 'ml-auto bg-[#D4AF37] text-[#121212]'
                      : 'mr-auto bg-[#1E1E1E] text-[#F5F5F5] border border-[rgba(212,175,55,0.2)]'
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {loading && (
                <p className="text-xs text-[#A1A1AA]">Thinking...</p>
              )}
              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}
            </div>

            <form onSubmit={sendMessage} className="p-3 border-t border-[rgba(212,175,55,0.2)] bg-[#050505]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your BNPL risk..."
                  className="flex-1 px-3 py-2 bg-[#121212] border border-[#27272a] rounded-lg text-sm text-[#F5F5F5] placeholder-[#6b7280] focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-3 py-2 rounded-lg bg-[#D4AF37] text-[#121212] text-sm font-semibold disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Chatbot

