import React, { useState, useEffect } from 'react'
import {
  Leaf,
  ShieldCheck,
  Truck,
  Factory,
  Utensils,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Building2,
  Phone,
  MapPin,
  Sparkles,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  X,
  KeyRound,
  Check,
  ArrowLeft,
} from 'lucide-react'
import type { Role } from '../api'

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<void>
  onRegister: (data: {
    email: string
    password: string
    orgName: string
    role: Role
    address: string
    phone: string
    latitude: number
    longitude: number
  }) => Promise<void>
  busy: boolean
  error: string
}

const REMEMBER_KEY = 'bioloop.remember_email'

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  onRegister,
  busy,
  error: serverError,
}) => {
  // Portal mode: KITCHEN (front default) | PROCESSOR | DRIVER | ADMIN
  const [portal, setPortal] = useState<'KITCHEN' | 'PROCESSOR' | 'DRIVER' | 'ADMIN'>('KITCHEN')

  // Kitchen tabs: 'login' | 'register'
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [localError, setLocalError] = useState<string>('')
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  // Login form state
  const [email, setEmail] = useState('kitchen@greenleaf.demo')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // Register form state (For Kitchen / Food Scraps Generator)
  const [regFullName, setRegFullName] = useState('')
  const [regOrg, setRegOrg] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')
  const [regConfirmPass, setRegConfirmPass] = useState('')
  const [showRegPass, setShowRegPass] = useState(false)
  const [showRegConfirmPass, setShowRegConfirmPass] = useState(false)
  const [regAddress, setRegAddress] = useState('Indiranagar, Bengaluru, Karnataka')
  const [regPhone, setRegPhone] = useState('+91 98765 43210')
  const [agreeTerms, setAgreeTerms] = useState(false)

  // Load remembered email
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) {
      setEmail(saved)
      setRememberMe(true)
    }
  }, [])

  // When portal changes, update default email and clear errors
  const handleSelectPortal = (selected: 'KITCHEN' | 'PROCESSOR' | 'DRIVER' | 'ADMIN') => {
    setPortal(selected)
    setLocalError('')
    setTab('login')
    if (selected === 'KITCHEN') {
      setEmail('kitchen@greenleaf.demo')
      setPassword('password123')
    } else if (selected === 'PROCESSOR') {
      setEmail('ops@urbancompost.demo')
      setPassword('password123')
    } else if (selected === 'DRIVER') {
      setEmail('driver@bioloop.demo')
      setPassword('password123')
    } else if (selected === 'ADMIN') {
      setEmail('admin@bioloop.com')
      setPassword('Admin@BioLoop2026!')
    }
  }

  // Email format validation
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Enter password', color: '#64746d' }
    let score = 0
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1
    if (/\d/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak (min 8 chars required)', color: '#ef4444' }
      case 2:
        return { score: 2, label: 'Fair (add numbers & symbols)', color: '#f59e0b' }
      case 3:
        return { score: 3, label: 'Good (secure password)', color: '#3b82f6' }
      case 4:
        return { score: 4, label: 'Strong (high entropy)', color: '#10b981' }
      default:
        return { score: 1, label: 'Weak', color: '#ef4444' }
    }
  }

  const passStrength = getPasswordStrength(regPass)
  const passwordsMatch = regPass.length > 0 && regPass === regConfirmPass

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!email || !isValidEmail(email)) {
      setLocalError('Please provide a valid email address.')
      return
    }
    if (!password) {
      setLocalError('Please enter your account password.')
      return
    }

    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, email.trim())
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }

    onLogin(email.trim(), password)
  }

  const handleRegisterKitchenSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (!regOrg.trim()) {
      setLocalError('Kitchen / Business name is required.')
      return
    }
    if (!regEmail || !isValidEmail(regEmail)) {
      setLocalError('Please enter a valid business email address.')
      return
    }
    if (regPass.length < 8) {
      setLocalError('Password must contain at least 8 characters.')
      return
    }
    if (regPass !== regConfirmPass) {
      setLocalError('Passwords do not match. Please re-enter.')
      return
    }
    if (!agreeTerms) {
      setLocalError('Please accept the BioLoop Circular Network Terms & ESG protocol.')
      return
    }

    onRegister({
      email: regEmail.trim(),
      password: regPass,
      orgName: regOrg.trim(),
      role: 'GENERATOR',
      address: regAddress.trim() || 'Bengaluru, Karnataka',
      phone: regPhone.trim(),
      latitude: 12.9716,
      longitude: 77.5946,
    })
  }

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail || !isValidEmail(forgotEmail)) {
      return
    }
    setForgotSent(true)
  }

  const displayedError = localError || serverError

  return (
    <div className="auth-fullscreen-container">
      {/* Background ambient lighting elements */}
      <div className="auth-ambient-glow auth-ambient-glow-1" />
      <div className="auth-ambient-glow auth-ambient-glow-2" />
      <div className="auth-grid-overlay" />

      <div className="auth-split-wrapper">
        {/* ============================================================ */}
        {/* LEFT COLUMN: HERO & IMPACT SHOWCASE                          */}
        {/* ============================================================ */}
        <section className="auth-hero-pane">
          {/* Top Brand Emblem */}
          <div className="auth-brand-badge">
            <div className="auth-leaf-icon-wrapper">
              <Leaf size={24} className="leaf-svg-anim" />
            </div>
            <div className="auth-brand-text-wrap">
              <div className="auth-brand-title">
                Bio<span>Loop</span>
              </div>
              <div className="auth-brand-network-status">
                <span className="live-status-dot" /> Bengaluru Grid Active
              </div>
            </div>
          </div>

          {/* Main Hero Header */}
          <div className="auth-hero-content">
            <div className="hero-pill-tag">
              <Sparkles size={14} className="text-emerald" />
              <span>Next-Gen Circular Bio-Economy</span>
            </div>

            <h1 className="auth-hero-heading">
              Urban Organic Traceability &{' '}
              <span className="text-gradient-emerald">Carbon Offset Network</span>
            </h1>

            <p className="auth-hero-description">
              Turn commercial organic kitchen waste into verifiable, audited carbon offsets. Connect food
              generators, composting bio-parks, and zero-emission logistics in real-time.
            </p>

            {/* Core Value Pillars */}
            <div className="auth-features-list">
              <div className="auth-feature-item">
                <div className="auth-feature-icon-box">
                  <Activity size={18} />
                </div>
                <div>
                  <div className="auth-feature-title">Proximity Waste Radar</div>
                  <div className="auth-feature-sub">
                    Sub-15km dynamic geospatial matching for ultra-fresh biomass routing.
                  </div>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon-box">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="auth-feature-title">Cryptographic Chain-of-Custody</div>
                  <div className="auth-feature-sub">
                    QR-verified handovers with GPS timestamps & contamination audit logs.
                  </div>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon-box">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <div className="auth-feature-title">Certified ESG Carbon Offsets</div>
                  <div className="auth-feature-sub">
                    Automated methane ($CH_4$) mitigation calculations with serial certificates.
                  </div>
                </div>
              </div>
            </div>

            {/* Live Impact Counters Widget */}
            <div className="auth-impact-card">
              <div className="auth-impact-header">
                <span>Verified Bengaluru Network Impact</span>
                <span className="auth-impact-pulse-tag">Live Feed</span>
              </div>
              <div className="auth-impact-stats-grid">
                <div className="auth-stat-box">
                  <div className="auth-stat-number">48,250<span className="unit">kg</span></div>
                  <div className="auth-stat-label">Organic Diverted</div>
                </div>
                <div className="auth-stat-box">
                  <div className="auth-stat-number">26.4<span className="unit">t</span></div>
                  <div className="auth-stat-label">CO₂e Avoided</div>
                </div>
                <div className="auth-stat-box">
                  <div className="auth-stat-number">99.4<span className="unit">%</span></div>
                  <div className="auth-stat-label">Purity Index</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Footer */}
          <div className="auth-hero-footer">
            <span>© 2026 BioLoop Platform</span>
            <span>·</span>
            <span>ISO 14064 Carbon Accounting</span>
            <span>·</span>
            <span>Bengaluru Central Node</span>
          </div>
        </section>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: SAAS AUTHENTICATION ENGINE                     */}
        {/* ============================================================ */}
        <section className="auth-form-pane">
          <div className="auth-card-container">
            {/* Top Multi-Portal Selector Tabs */}
            <div className="portal-selector-bar">
              <button
                type="button"
                className={`portal-tab-pill ${portal === 'KITCHEN' ? 'active-kitchen' : ''}`}
                onClick={() => handleSelectPortal('KITCHEN')}
              >
                <Utensils size={15} />
                <span>Kitchen (Front)</span>
              </button>
              <button
                type="button"
                className={`portal-tab-pill ${portal === 'PROCESSOR' ? 'active-processor' : ''}`}
                onClick={() => handleSelectPortal('PROCESSOR')}
              >
                <Factory size={15} />
                <span>Processor</span>
              </button>
              <button
                type="button"
                className={`portal-tab-pill ${portal === 'DRIVER' ? 'active-driver' : ''}`}
                onClick={() => handleSelectPortal('DRIVER')}
              >
                <Truck size={15} />
                <span>Driver</span>
              </button>
              <button
                type="button"
                className={`portal-tab-pill ${portal === 'ADMIN' ? 'active-admin' : ''}`}
                onClick={() => handleSelectPortal('ADMIN')}
              >
                <ShieldCheck size={15} />
                <span>Admin</span>
              </button>
            </div>

            {/* Error Message Banner */}
            {displayedError && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={18} className="auth-error-icon" />
                <div className="auth-error-text">{displayedError}</div>
                <button
                  type="button"
                  className="auth-error-dismiss"
                  onClick={() => setLocalError('')}
                  aria-label="Dismiss error"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* ======================================================== */}
            {/* PORTAL 1: KITCHEN (FOOD SCRAPS GENERATOR) - FRONT DEFAULT */}
            {/* ======================================================== */}
            {portal === 'KITCHEN' && (
              <div>
                {/* Kitchen Sign In / Register Tabs */}
                <div className="auth-tab-bar">
                  <button
                    type="button"
                    className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
                    onClick={() => {
                      setTab('login')
                      setLocalError('')
                    }}
                  >
                    Kitchen Sign In
                  </button>
                  <button
                    type="button"
                    className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
                    onClick={() => {
                      setTab('register')
                      setLocalError('')
                    }}
                  >
                    Register Kitchen
                  </button>
                </div>

                <div className="auth-header-copy">
                  <h2 className="auth-title">
                    {tab === 'login' ? 'Kitchen Portal' : 'Register Commercial Kitchen'}
                  </h2>
                  <p className="auth-sub">
                    {tab === 'login'
                      ? 'Sign in to post daily food scrap batches, request pickups, and earn carbon credits.'
                      : 'Create an account for your restaurant, hotel, or food kitchen in Bengaluru.'}
                  </p>
                </div>

                {/* Kitchen Login Form */}
                {tab === 'login' && (
                  <form onSubmit={handleLoginSubmit} className="auth-actual-form">
                    <div className="form-group-saas">
                      <label className="form-label-saas" htmlFor="kitchen-email">
                        Kitchen / Corporate Email
                      </label>
                      <div className="input-with-icon">
                        <Mail size={17} className="input-prefix-icon" />
                        <input
                          id="kitchen-email"
                          type="email"
                          required
                          className="input-field-saas"
                          placeholder="kitchen@greenleaf.demo"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group-saas">
                      <div className="label-with-aside">
                        <label className="form-label-saas" htmlFor="kitchen-pass">
                          Password
                        </label>
                        <button
                          type="button"
                          className="forgot-link-btn"
                          onClick={() => {
                            setForgotEmail(email)
                            setForgotSent(false)
                            setForgotModalOpen(true)
                          }}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="input-with-icon">
                        <Lock size={17} className="input-prefix-icon" />
                        <input
                          id="kitchen-pass"
                          type={showPassword ? 'text' : 'password'}
                          required
                          className="input-field-saas has-suffix"
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="input-suffix-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label="Toggle password"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-aux-row">
                      <label className="checkbox-label-saas">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="checkbox-input-saas"
                        />
                        <span>Remember my email</span>
                      </label>
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={busy}>
                      {busy ? (
                        <span className="submit-spinner-wrap">
                          <span className="btn-spinner" /> Authenticating…
                        </span>
                      ) : (
                        <span className="submit-btn-content">
                          Sign In to Kitchen Portal <ArrowRight size={17} />
                        </span>
                      )}
                    </button>
                  </form>
                )}

                {/* Kitchen Registration Form */}
                {tab === 'register' && (
                  <form onSubmit={handleRegisterKitchenSubmit} className="auth-actual-form">
                    <div className="form-row-2col">
                      <div className="form-group-saas">
                        <label className="form-label-saas">Kitchen / Restaurant Name *</label>
                        <div className="input-with-icon">
                          <Building2 size={16} className="input-prefix-icon" />
                          <input
                            type="text"
                            required
                            className="input-field-saas"
                            placeholder="e.g. GreenLeaf Cafe"
                            value={regOrg}
                            onChange={(e) => setRegOrg(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group-saas">
                        <label className="form-label-saas">Manager / Chef Name</label>
                        <div className="input-with-icon">
                          <UserIcon size={16} className="input-prefix-icon" />
                          <input
                            type="text"
                            className="input-field-saas"
                            placeholder="e.g. Yashwanth"
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-row-2col">
                      <div className="form-group-saas">
                        <label className="form-label-saas">Work Email *</label>
                        <div className="input-with-icon">
                          <Mail size={16} className="input-prefix-icon" />
                          <input
                            type="email"
                            required
                            className="input-field-saas"
                            placeholder="ops@restaurant.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group-saas">
                        <label className="form-label-saas">Contact Phone *</label>
                        <div className="input-with-icon">
                          <Phone size={16} className="input-prefix-icon" />
                          <input
                            type="tel"
                            required
                            className="input-field-saas"
                            placeholder="+91 98765 43210"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group-saas">
                      <label className="form-label-saas">Kitchen / Pickup Address *</label>
                      <div className="input-with-icon">
                        <MapPin size={16} className="input-prefix-icon" />
                        <input
                          type="text"
                          required
                          className="input-field-saas"
                          placeholder="e.g. 100ft Road, Indiranagar, Bengaluru"
                          value={regAddress}
                          onChange={(e) => setRegAddress(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-row-2col">
                      <div className="form-group-saas">
                        <label className="form-label-saas">Password (min. 8 chars) *</label>
                        <div className="input-with-icon">
                          <Lock size={16} className="input-prefix-icon" />
                          <input
                            type={showRegPass ? 'text' : 'password'}
                            required
                            className="input-field-saas has-suffix"
                            placeholder="Create password"
                            value={regPass}
                            onChange={(e) => setRegPass(e.target.value)}
                          />
                          <button
                            type="button"
                            className="input-suffix-btn"
                            onClick={() => setShowRegPass(!showRegPass)}
                            aria-label="Toggle password"
                          >
                            {showRegPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group-saas">
                        <label className="form-label-saas">Confirm Password *</label>
                        <div className="input-with-icon">
                          <Lock size={16} className="input-prefix-icon" />
                          <input
                            type={showRegConfirmPass ? 'text' : 'password'}
                            required
                            className="input-field-saas has-suffix"
                            placeholder="Confirm password"
                            value={regConfirmPass}
                            onChange={(e) => setRegConfirmPass(e.target.value)}
                          />
                          <button
                            type="button"
                            className="input-suffix-btn"
                            onClick={() => setShowRegConfirmPass(!showRegConfirmPass)}
                            aria-label="Toggle password"
                          >
                            {showRegConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password Strength Meter */}
                    {regPass && (
                      <div className="strength-container">
                        <div className="strength-header">
                          <span>Password Strength:</span>
                          <strong style={{ color: passStrength.color }}>{passStrength.label}</strong>
                        </div>
                        <div className="strength-bars">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className="strength-bar-unit"
                              style={{
                                backgroundColor:
                                  step <= passStrength.score ? passStrength.color : 'rgba(255,255,255,0.08)',
                              }}
                            />
                          ))}
                        </div>
                        {regConfirmPass && (
                          <div className="confirm-match-row">
                            {passwordsMatch ? (
                              <span className="match-success"><Check size={14} /> Passwords match</span>
                            ) : (
                              <span className="match-error"><AlertCircle size={14} /> Passwords do not match</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="form-aux-row">
                      <label className="checkbox-label-saas">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="checkbox-input-saas"
                        />
                        <span>I accept the BioLoop Organic Traceability & ESG protocol.</span>
                      </label>
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={busy}>
                      {busy ? (
                        <span className="submit-spinner-wrap">
                          <span className="btn-spinner" /> Creating Account…
                        </span>
                      ) : (
                        <span className="submit-btn-content">
                          Register Kitchen & Enter Portal <ArrowRight size={17} />
                        </span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* PORTAL 2: PROCESSOR LOGIN PAGE (BIO PARK)                 */}
            {/* ======================================================== */}
            {portal === 'PROCESSOR' && (
              <div>
                <div className="portal-header-badge proc-header-badge">
                  <Factory size={22} />
                  <span>Bio-Processor Login Portal</span>
                </div>

                <div className="auth-header-copy">
                  <h2 className="auth-title">Composting & Bio-Park Access</h2>
                  <p className="auth-sub">
                    Discover nearby organic batches, claim food scraps, and record conversion into certified bio-compost.
                  </p>
                </div>

                <div className="admin-provision-notice">
                  <KeyRound size={16} />
                  <div>
                    <strong>Admin Provisioned Access:</strong> Processor facility accounts are created and managed by the BioLoop Administrator. Contact your network admin if you do not have credentials.
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="auth-actual-form">
                  <div className="form-group-saas">
                    <label className="form-label-saas" htmlFor="proc-email">
                      Processor Facility Email
                    </label>
                    <div className="input-with-icon">
                      <Mail size={17} className="input-prefix-icon" />
                      <input
                        id="proc-email"
                        type="email"
                        required
                        className="input-field-saas"
                        placeholder="ops@urbancompost.demo"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group-saas">
                    <label className="form-label-saas" htmlFor="proc-pass">
                      Password
                    </label>
                    <div className="input-with-icon">
                      <Lock size={17} className="input-prefix-icon" />
                      <input
                        id="proc-pass"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="input-field-saas has-suffix"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="input-suffix-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit-btn btn-proc-accent"
                    disabled={busy}
                  >
                    {busy ? (
                      <span className="submit-spinner-wrap">
                        <span className="btn-spinner" /> Authenticating…
                      </span>
                    ) : (
                      <span className="submit-btn-content">
                        Sign In as Processor <ArrowRight size={17} />
                      </span>
                    )}
                  </button>

                  <div className="portal-sub-action">
                    <button
                      type="button"
                      className="portal-back-btn"
                      onClick={() => handleSelectPortal('KITCHEN')}
                    >
                      <ArrowLeft size={14} /> Back to Kitchen Portal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ======================================================== */}
            {/* PORTAL 3: DRIVER LOGIN PAGE (FLEET LOGISTICS)            */}
            {/* ======================================================== */}
            {portal === 'DRIVER' && (
              <div>
                <div className="portal-header-badge driver-header-badge">
                  <Truck size={22} />
                  <span>Logistics Carrier Login Portal</span>
                </div>

                <div className="auth-header-copy">
                  <h2 className="auth-title">Fleet Driver Access</h2>
                  <p className="auth-sub">
                    Sign in to view assigned pickup jobs, scan QR verification tokens, and complete zero-emission transfers.
                  </p>
                </div>

                <div className="admin-provision-notice">
                  <KeyRound size={16} />
                  <div>
                    <strong>Admin Provisioned Access:</strong> Carrier and vehicle driver credentials are created and managed by the BioLoop Administrator. Contact dispatch for your login.
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="auth-actual-form">
                  <div className="form-group-saas">
                    <label className="form-label-saas" htmlFor="driver-email">
                      Driver / Carrier Email
                    </label>
                    <div className="input-with-icon">
                      <Mail size={17} className="input-prefix-icon" />
                      <input
                        id="driver-email"
                        type="email"
                        required
                        className="input-field-saas"
                        placeholder="driver@bioloop.demo"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group-saas">
                    <label className="form-label-saas" htmlFor="driver-pass">
                      Password
                    </label>
                    <div className="input-with-icon">
                      <Lock size={17} className="input-prefix-icon" />
                      <input
                        id="driver-pass"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="input-field-saas has-suffix"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="input-suffix-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit-btn btn-driver-accent"
                    disabled={busy}
                  >
                    {busy ? (
                      <span className="submit-spinner-wrap">
                        <span className="btn-spinner" /> Authenticating…
                      </span>
                    ) : (
                      <span className="submit-btn-content">
                        Sign In as Driver <ArrowRight size={17} />
                      </span>
                    )}
                  </button>

                  <div className="portal-sub-action">
                    <button
                      type="button"
                      className="portal-back-btn"
                      onClick={() => handleSelectPortal('KITCHEN')}
                    >
                      <ArrowLeft size={14} /> Back to Kitchen Portal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ======================================================== */}
            {/* PORTAL 4: ADMIN GOVERNANCE CONSOLE (FIXED CREDENTIALS)   */}
            {/* ======================================================== */}
            {portal === 'ADMIN' && (
              <div>
                <div className="portal-header-badge admin-header-badge">
                  <ShieldCheck size={22} />
                  <span>Network Governance Console</span>
                </div>

                <div className="auth-header-copy">
                  <h2 className="auth-title">Administrator Portal</h2>
                  <p className="auth-sub">
                    Authorized oversight dashboard to audit transactions, monitor radar nodes, and provision Processors and Drivers.
                  </p>
                </div>

                <div className="admin-fixed-cred-notice">
                  <KeyRound size={16} />
                  <div>
                    <strong>Fixed Admin Credentials:</strong>
                    <div>Email: <code>admin@bioloop.com</code> (or <code>audit@bioloop.demo</code>)</div>
                    <div>Password: <code>Admin@BioLoop2026!</code> (or <code>password123</code>)</div>
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="auth-actual-form">
                  <div className="form-group-saas">
                    <label className="form-label-saas" htmlFor="admin-email">
                      Administrator Email
                    </label>
                    <div className="input-with-icon">
                      <Mail size={17} className="input-prefix-icon" />
                      <input
                        id="admin-email"
                        type="email"
                        required
                        className="input-field-saas"
                        placeholder="admin@bioloop.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group-saas">
                    <label className="form-label-saas" htmlFor="admin-pass">
                      Admin Password
                    </label>
                    <div className="input-with-icon">
                      <Lock size={17} className="input-prefix-icon" />
                      <input
                        id="admin-pass"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="input-field-saas has-suffix"
                        placeholder="Enter admin password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="input-suffix-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit-btn btn-admin-accent"
                    disabled={busy}
                  >
                    {busy ? (
                      <span className="submit-spinner-wrap">
                        <span className="btn-spinner" /> Authenticating…
                      </span>
                    ) : (
                      <span className="submit-btn-content">
                        Sign In as Administrator <ArrowRight size={17} />
                      </span>
                    )}
                  </button>

                  <div className="portal-sub-action">
                    <button
                      type="button"
                      className="portal-back-btn"
                      onClick={() => handleSelectPortal('KITCHEN')}
                    >
                      <ArrowLeft size={14} /> Back to Kitchen Portal
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setForgotModalOpen(false)}>
          <div className="modal-content forgot-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <KeyRound size={20} className="text-emerald" />
                <span>Reset Your Password</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setForgotModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {forgotSent ? (
                <div className="forgot-success-state">
                  <div className="forgot-success-icon">
                    <Check size={28} />
                  </div>
                  <h3>Password Reset Dispatched</h3>
                  <p>
                    If an account exists for <strong>{forgotEmail}</strong>, password reset
                    instructions have been delivered.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1rem' }}
                    onClick={() => setForgotModalOpen(false)}
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                    Enter the email address registered to your BioLoop account. We will transmit a secure link to reset your credentials.
                  </p>
                  <div className="form-group-saas" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label-saas" htmlFor="forgot-email-input">
                      Account Email
                    </label>
                    <div className="input-with-icon">
                      <Mail size={17} className="input-prefix-icon" />
                      <input
                        id="forgot-email-input"
                        type="email"
                        required
                        className="input-field-saas"
                        placeholder="name@company.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setForgotModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Send Reset Instructions
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
