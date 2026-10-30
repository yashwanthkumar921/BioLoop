import React, { useEffect, useState } from 'react'
import {
  Factory,
  Truck,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  Lock,
  Phone,
  MapPin,
  RefreshCw,
  Search,
  KeyRound,
  ShieldAlert,
} from 'lucide-react'
import { api, type Role, type User } from '../api'

interface AdminMemberManagerProps {
  onNotify: (msg: string) => void
}

export const AdminMemberManager: React.FC<AdminMemberManagerProps> = ({ onNotify }) => {
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [filterRole, setFilterRole] = useState<'ALL' | 'PROCESSOR' | 'DRIVER'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Form states
  const [targetRole, setTargetRole] = useState<Role>('PROCESSOR')
  const [orgName, setOrgName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [recentProvisioned, setRecentProvisioned] = useState<{
    orgName: string
    email: string
    role: Role
    tempPass: string
  } | null>(null)

  const loadMembers = async () => {
    setLoading(true)
    try {
      const data = await api.admin.listMembers()
      setMembers(data)
    } catch (err) {
      console.error(err)
      onNotify('Failed to load network members.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!orgName.trim() || !email.trim() || !password) {
      setFormError('Please fill out all required fields.')
      return
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.')
      return
    }

    setSubmitting(true)
    try {
      await api.admin.createMember({
        orgName: orgName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: targetRole,
        address: address.trim() || 'Bengaluru, Karnataka',
        phone: phone.trim() || '+91 98800 00000',
        latitude: 12.9716,
        longitude: 77.5946,
      })
      setRecentProvisioned({
        orgName: orgName.trim(),
        email: email.trim().toLowerCase(),
        role: targetRole,
        tempPass: password,
      })
      onNotify(`Successfully provisioned ${targetRole.toLowerCase()} account for ${orgName.trim()}`)
      // Reset inputs
      setOrgName('')
      setEmail('')
      setPassword('')
      setAddress('')
      setPhone('')
      await loadMembers()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to provision member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMember = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the network?`)) {
      return
    }
    try {
      await api.admin.deleteMember(id)
      onNotify(`Removed member: ${name}`)
      await loadMembers()
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to delete member')
    }
  }

  const filtered = members.filter((m) => {
    if (filterRole !== 'ALL' && m.role !== filterRole) return false
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      m.orgName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.address && m.address.toLowerCase().includes(q))
    )
  })

  return (
    <div className="admin-manager-container">
      {/* Header Banner */}
      <div className="admin-header-banner">
        <div>
          <h2 className="admin-header-title">
            Network Personnel & Organization Control
          </h2>
          <p className="admin-header-sub">
            Only administrators can provision accounts for Bio-Processors and Logistics Carriers.
            Members log in at their dedicated portals using the credentials created below.
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={loadMembers}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={14} className={loading ? 'spin-anim' : ''} /> Refresh Directory
        </button>
      </div>

      <div className="admin-manager-grid">
        {/* LEFT COLUMN: ADD NEW MEMBER FORM */}
        <div className="admin-form-panel">
          <div className="panel-title-row">
            <PlusCircle size={20} className="text-emerald" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Provision New Member</h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Choose whether to add a commercial composting facility (Processor) or an urban EV transport carrier (Driver).
          </p>

          {/* Role Choice Toggle */}
          <div className="role-switch-pills">
            <button
              type="button"
              className={`role-pill-btn ${targetRole === 'PROCESSOR' ? 'active-proc' : ''}`}
              onClick={() => {
                setTargetRole('PROCESSOR')
                setFormError('')
              }}
            >
              <Factory size={16} />
              <span>Bio-Processor</span>
            </button>
            <button
              type="button"
              className={`role-pill-btn ${targetRole === 'DRIVER' ? 'active-driver' : ''}`}
              onClick={() => {
                setTargetRole('DRIVER')
                setFormError('')
              }}
            >
              <Truck size={16} />
              <span>Logistics Driver</span>
            </button>
          </div>

          {formError && (
            <div className="admin-error-box">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {recentProvisioned && (
            <div className="recent-success-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
                <CheckCircle2 size={18} />
                <span>Account Provisioned Successfully!</span>
              </div>
              <div style={{ fontSize: '0.84rem', marginTop: '0.4rem', color: '#cbd5e1' }}>
                Provide these credentials to the {recentProvisioned.role.toLowerCase()}:
              </div>
              <div className="cred-display-card">
                <div><strong>Organization:</strong> {recentProvisioned.orgName}</div>
                <div><strong>Login Portal:</strong> {recentProvisioned.role === 'PROCESSOR' ? 'Processor Portal' : 'Driver Portal'}</div>
                <div><strong>Email:</strong> <code>{recentProvisioned.email}</code></div>
                <div><strong>Password:</strong> <code>{recentProvisioned.tempPass}</code></div>
              </div>
            </div>
          )}

          <form onSubmit={handleCreateMember} className="admin-create-form">
            <div className="form-group-saas">
              <label className="form-label-saas">
                {targetRole === 'PROCESSOR' ? 'Facility / Bio-Park Name *' : 'Driver / Carrier Fleet Name *'}
              </label>
              <div className="input-with-icon">
                <Building2 size={16} className="input-prefix-icon" />
                <input
                  type="text"
                  required
                  className="input-field-saas"
                  placeholder={targetRole === 'PROCESSOR' ? 'e.g. Urban Compost Hub Phase 2' : 'e.g. Loop Rider 08 (CleanFleet)'}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group-saas">
              <label className="form-label-saas">Corporate Email (Login ID) *</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-prefix-icon" />
                <input
                  type="email"
                  required
                  className="input-field-saas"
                  placeholder={targetRole === 'PROCESSOR' ? 'ops@biopark.com' : 'driver08@carrier.in'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group-saas">
              <label className="form-label-saas">Assigned Password (min. 8 chars) *</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-prefix-icon" />
                <input
                  type="text"
                  required
                  className="input-field-saas"
                  placeholder="Set login password for member"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group-saas">
              <label className="form-label-saas">Facility or Operating Area Address *</label>
              <div className="input-with-icon">
                <MapPin size={16} className="input-prefix-icon" />
                <input
                  type="text"
                  required
                  className="input-field-saas"
                  placeholder="e.g. Whitefield Eco Zone, Bengaluru"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group-saas">
              <label className="form-label-saas">Contact Phone Number</label>
              <div className="input-with-icon">
                <Phone size={16} className="input-prefix-icon" />
                <input
                  type="tel"
                  className="input-field-saas"
                  placeholder="+91 98800 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
            >
              {submitting ? 'Provisioning...' : `Create ${targetRole === 'PROCESSOR' ? 'Processor' : 'Driver'} Account`}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: MEMBER DIRECTORY & CONTROLS */}
        <div className="admin-directory-panel">
          <div className="directory-header-row">
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Network Directory ({filtered.length})
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Active processors, logistics carriers, and commercial kitchens.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="directory-filter-tabs">
              <button
                type="button"
                className={`dir-filter-btn ${filterRole === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilterRole('ALL')}
              >
                All ({members.length})
              </button>
              <button
                type="button"
                className={`dir-filter-btn ${filterRole === 'PROCESSOR' ? 'active' : ''}`}
                onClick={() => setFilterRole('PROCESSOR')}
              >
                Processors ({members.filter((m) => m.role === 'PROCESSOR').length})
              </button>
              <button
                type="button"
                className={`dir-filter-btn ${filterRole === 'DRIVER' ? 'active' : ''}`}
                onClick={() => setFilterRole('DRIVER')}
              >
                Drivers ({members.filter((m) => m.role === 'DRIVER').length})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="directory-search-bar">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Search by organization name, email, or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-transparent"
            />
          </div>

          {/* Members List */}
          <div className="members-card-list">
            {filtered.length === 0 ? (
              <div className="empty-members-state">
                <ShieldAlert size={32} style={{ opacity: 0.4, margin: '0 auto 0.5rem' }} />
                <div>No network members matching this filter.</div>
              </div>
            ) : (
              filtered.map((m) => (
                <div key={m.id} className="member-item-card">
                  <div className="member-item-left">
                    <div
                      className={`member-avatar-box avatar-${m.role.toLowerCase()}`}
                    >
                      {m.role === 'PROCESSOR' && <Factory size={18} />}
                      {m.role === 'DRIVER' && <Truck size={18} />}
                      {m.role === 'GENERATOR' && <Building2 size={18} />}
                      {m.role === 'ADMIN' && <KeyRound size={18} />}
                    </div>
                    <div className="member-info">
                      <div className="member-name-row">
                        <span className="member-org-name">{m.orgName}</span>
                        <span className={`member-role-badge role-${m.role}`}>
                          {m.role}
                        </span>
                      </div>
                      <div className="member-details-row">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Mail size={13} /> {m.email}
                        </span>
                        {m.phone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Phone size={13} /> {m.phone}
                          </span>
                        )}
                        {m.address && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <MapPin size={13} /> {m.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {m.role !== 'ADMIN' && (
                    <button
                      type="button"
                      className="member-delete-btn"
                      onClick={() => handleDeleteMember(m.id, m.orgName)}
                      title={`Remove ${m.orgName} from network`}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

