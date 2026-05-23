import { useState } from 'react'
import { Building2, KeyRound, Mail, ShieldCheck, Smartphone } from 'lucide-react'
import { sendOtp, verifyOtp } from '../lib/authService'

export default function AuthPage() {
  const [step, setStep] = useState('send')
  const [login, setLogin] = useState('')
  const [token, setToken] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const destination = await sendOtp(login)
      setLogin(destination)
      setStep('verify')
      setMessage(`OTP sent to ${destination}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await verifyOtp(login, token.trim())
      setMessage('Verified successfully')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="brand big">
          <div className="brand-mark"><Building2 size={28} /></div>
          <div>
            <h1>IndustryOps ERP Lite</h1>
            <p>Offline-ready operations management for growing businesses.</p>
          </div>
        </div>
        <h2>Manage inventory, sales, purchases, expenses, customers, suppliers, and reports from one secure dashboard.</h2>
        <div className="feature-grid">
          <span><ShieldCheck /> Role-ready Supabase security</span>
          <span><Smartphone /> Phone or email OTP login</span>
          <span><KeyRound /> Multi-tenant database design</span>
        </div>
      </div>

      <form className="auth-card" onSubmit={step === 'send' ? handleSend : handleVerify}>
        <div className="auth-icon"><Mail size={26} /></div>
        <h2>{step === 'send' ? 'Sign in with OTP' : 'Enter your OTP'}</h2>
        <p className="muted">Use email for instant testing. Phone OTP works after enabling a Supabase SMS provider.</p>

        {step === 'send' ? (
          <label>
            Email or phone number
            <input
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              placeholder="you@company.com or +8801XXXXXXXXX"
              required
            />
          </label>
        ) : (
          <>
            <label>
              OTP code
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="6 digit code"
                required
              />
            </label>
            <button type="button" className="link-button" onClick={() => setStep('send')}>Change destination</button>
          </>
        )}

        {message ? <div className="alert success">{message}</div> : null}
        {error ? <div className="alert danger">{error}</div> : null}
        <button className="primary-button" disabled={loading}>{loading ? 'Please wait...' : step === 'send' ? 'Send OTP' : 'Verify & Continue'}</button>
      </form>
    </div>
  )
}
