import { useEffect, useState } from 'react'
import {
  api,
  getToken,
  setToken,
  type Batch,
  type EsgSummary,
  type NearbyBatch,
  type Role,
  type User,
} from './api'
import { AuthScreen } from './components/AuthScreen'
import { WasteMap } from './components/WasteMap'
import { ClaimHub } from './components/ClaimHub'
import { PostBatch } from './components/PostBatch'
import { JobsPipeline } from './components/JobsPipeline'
import { ImpactDashboard } from './components/ImpactDashboard'
import { VerificationModal } from './components/VerificationModal'
import { QrCodeModal } from './components/QrCodeModal'
import { ProofUploadModal } from './components/ProofUploadModal'
import { BatchDetailModal } from './components/BatchDetailModal'
import { CertificateModal } from './components/CertificateModal'
import { AdminMemberManager } from './components/AdminMemberManager'

import {
  MapPin,
  ShoppingBag,
  PlusCircle,
  Truck,
  Award,
  LogOut,
  Leaf,
  RefreshCw,
  Users,
} from 'lucide-react'

type View = 'map' | 'claim' | 'post' | 'jobs' | 'impact' | 'admin-members'

const BLR = { lat: 12.9716, lng: 77.5946 }

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [view, setView] = useState<View>('map')
  const [error, setError] = useState<string>('')
  const [notice, setNotice] = useState<string>('')
  const [busy, setBusy] = useState<boolean>(false)

  // Data states
  const [nearby, setNearby] = useState<NearbyBatch[]>([])
  const [openJobs, setOpenJobs] = useState<Batch[]>([])
  const [mine, setMine] = useState<Batch[]>([])
  const [esg, setEsg] = useState<EsgSummary | null>(null)
  const [searchRadius, setSearchRadius] = useState<number>(15)

  // Modals
  const [verifyingBatch, setVerifyingBatch] = useState<Batch | null>(null)
  const [qrBatch, setQrBatch] = useState<Batch | null>(null)
  const [proofBatch, setProofBatch] = useState<Batch | null>(null)
  const [detailBatch, setDetailBatch] = useState<Batch | null>(null)
  const [activeCertificate, setActiveCertificate] = useState<{
    code: string
    batchId: string
    weightKg: number
    co2OffsetKg: number
    verifiedAt: string
  } | null>(null)

  // Auto-login from stored token
  useEffect(() => {
    if (!getToken()) return
    api
      .me()
      .then((u) => {
        setUser(u)
        setView(u.role === 'GENERATOR' ? 'post' : u.role === 'DRIVER' ? 'jobs' : 'map')
      })
      .catch(() => setToken(null))
  }, [])

  // Refresh data
  async function refresh(current = user, radius = searchRadius) {
    if (!current) return
    const lat = current.latitude ?? BLR.lat
    const lng = current.longitude ?? BLR.lng
    try {
      const [n, jobs, m, e] = await Promise.all([
        api.nearby(lat, lng, radius),
        api.openJobs(),
        api.mine(),
        api.esg(),
      ])
      setNearby(n)
      setOpenJobs(jobs)
      setMine(m)
      setEsg(e)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (user) {
      refresh(user, searchRadius)
    }
  }, [user, searchRadius])

  const showNotification = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(''), 4000)
  }

  async function handleLogin(email: string, pass: string) {
    setBusy(true)
    setError('')
    try {
      const res = await api.login(email, pass)
      setToken(res.token)
      setUser(res.user)
      setView(res.user.role === 'GENERATOR' ? 'post' : res.user.role === 'DRIVER' ? 'jobs' : 'map')
      showNotification(`Signed in as ${res.user.orgName}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleRegister(data: {
    email: string
    password: string
    orgName: string
    role: Role
    address: string
    phone: string
    latitude: number
    longitude: number
  }) {
    setBusy(true)
    setError('')
    try {
      const res = await api.register(data)
      setToken(res.token)
      setUser(res.user)
      setView(res.user.role === 'GENERATOR' ? 'post' : res.user.role === 'DRIVER' ? 'jobs' : 'map')
      showNotification(`Registered and signed in as ${res.user.orgName}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  // If not logged in, render modern AuthScreen
  if (!user) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} busy={busy} error={error} />
  }

  return (
    <div className="app-container">
      {/* Modern Sidebar */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-icon-wrap">
            <Leaf size={22} />
          </div>
          <div>
            <h1 className="brand-title">BioLoop</h1>
            <div className="brand-subtitle">Urban Nutrient Network</div>
          </div>
        </div>

        {/* Current Active Profile Tag */}
        <div className="profile-pill">
          <div className="profile-org">{user.orgName}</div>
          <span className={`profile-role-tag role-${user.role}`}>
            {user.role === 'GENERATOR' && '🥬 Generator'}
            {user.role === 'PROCESSOR' && '🏭 Processor'}
            {user.role === 'DRIVER' && '🚚 Carrier'}
            {user.role === 'ADMIN' && '🛡️ Administrator'}
          </span>
        </div>

        {/* Navigation items */}
        <nav className="nav-group">
          <button
            className={`nav-link ${view === 'map' ? 'active' : ''}`}
            onClick={() => setView('map')}
          >
            <span className="nav-icon"><MapPin size={18} /></span>
            <span>Waste Radar</span>
            {nearby.length > 0 && <span className="status-pill status-AVAILABLE" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>{nearby.length}</span>}
          </button>

          <button
            className={`nav-link ${view === 'claim' ? 'active' : ''}`}
            onClick={() => setView('claim')}
          >
            <span className="nav-icon"><ShoppingBag size={18} /></span>
            <span>Marketplace</span>
          </button>

          {(user.role === 'GENERATOR' || user.role === 'ADMIN') && (
            <button
              className={`nav-link ${view === 'post' ? 'active' : ''}`}
              onClick={() => setView('post')}
            >
              <span className="nav-icon"><PlusCircle size={18} /></span>
              <span>Post Batch</span>
            </button>
          )}

          <button
            className={`nav-link ${view === 'jobs' ? 'active' : ''}`}
            onClick={() => setView('jobs')}
          >
            <span className="nav-icon"><Truck size={18} /></span>
            <span>Operations</span>
            {mine.length > 0 && <span className="status-pill status-CLAIMED" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>{mine.length}</span>}
          </button>

          <button
            className={`nav-link ${view === 'impact' ? 'active' : ''}`}
            onClick={() => setView('impact')}
          >
            <span className="nav-icon"><Award size={18} /></span>
            <span>ESG & Offsets</span>
          </button>

          {user.role === 'ADMIN' && (
            <button
              className={`nav-link ${view === 'admin-members' ? 'active' : ''}`}
              onClick={() => setView('admin-members')}
            >
              <span className="nav-icon"><Users size={18} /></span>
              <span>Network Personnel</span>
            </button>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            className="signout-btn"
            onClick={() => {
              setToken(null)
              setUser(null)
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="main-wrapper">
        {/* Sticky Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <h2 className="page-title">
              {view === 'map' && 'Live Biomass Proximity Radar'}
              {view === 'claim' && 'Organic Nutrient Marketplace'}
              {view === 'post' && 'Publish Pickup Window'}
              {view === 'jobs' && 'Operations & Handshake Hub'}
              {view === 'impact' && 'ESG Audit & Carbon Offsets'}
              {view === 'admin-members' && 'Network Personnel & Access Control'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Authenticated User Status */}
            <div className="active-user-badge">
              <span className="active-user-dot" />
              <span className="active-user-name">{user.orgName}</span>
              <span className={`active-role-tag role-${user.role}`}>{user.role}</span>
            </div>

            {/* Manual Refresh */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => refresh()}
              title="Refresh data"
              style={{ padding: '0.45rem' }}
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </header>

        {/* Feedback notices */}
        {notice && (
          <div style={{ margin: '1rem 2rem 0', padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', color: '#34d399', fontSize: '0.88rem' }}>
            {notice}
          </div>
        )}

        {error && (
          <div style={{ margin: '1rem 2rem 0', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        {/* Body View Content */}
        <main className="content-area">
          {view === 'map' && (
            <WasteMap
              nearby={nearby}
              radius={searchRadius}
              onRadiusChange={(r) => setSearchRadius(r)}
              canClaim={user.role === 'PROCESSOR' || user.role === 'ADMIN'}
              onClaim={async (id) => {
                try {
                  await api.claim(id)
                  showNotification('Batch successfully claimed!')
                  await refresh()
                  setView('jobs')
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Could not claim batch')
                }
              }}
              onSelectBatch={(id) => {
                const b = mine.find((x) => x.id === id)
                if (b) setDetailBatch(b)
              }}
            />
          )}

          {view === 'claim' && (
            <ClaimHub
              nearby={nearby}
              openJobs={openJobs}
              role={user.role}
              onClaim={async (id) => {
                try {
                  await api.claim(id)
                  showNotification('Batch successfully claimed!')
                  await refresh()
                  setView('jobs')
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Could not claim batch')
                }
              }}
              onAccept={async (id) => {
                try {
                  await api.accept(id)
                  showNotification('Route accepted! Check Operations tab for pickup.')
                  await refresh()
                  setView('jobs')
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Could not accept job')
                }
              }}
            />
          )}

          {view === 'post' && (
            <PostBatch
              defaultLat={user.latitude ?? BLR.lat}
              defaultLng={user.longitude ?? BLR.lng}
              onCreate={async (payload) => {
                try {
                  await api.create(payload)
                  showNotification('Pickup window published to the marketplace!')
                  await refresh()
                  setView('jobs')
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to publish batch')
                }
              }}
            />
          )}

          {view === 'jobs' && (
            <JobsPipeline
              mine={mine}
              role={user.role}
              onPickup={async (batch, qrToken) => {
                try {
                  await api.status(batch.id, { status: 'IN_TRANSIT', qrToken })
                  showNotification('Pickup handshake verified! Batch is now In Transit.')
                  await refresh()
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Pickup handshake failed')
                }
              }}
              onDeliver={async (batch) => {
                try {
                  await api.status(batch.id, { status: 'DELIVERED' })
                  showNotification('Batch delivered to processor facility!')
                  await refresh()
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Delivery status update failed')
                }
              }}
              onOpenVerify={(batch) => setVerifyingBatch(batch)}
              onOpenQr={(batch) => setQrBatch(batch)}
              onOpenProof={(batch) => setProofBatch(batch)}
              onOpenDetail={(batch) => setDetailBatch(batch)}
              onOpenCertificate={(batch) => {
                if (batch.certificateCode) {
                  setActiveCertificate({
                    code: batch.certificateCode,
                    batchId: batch.id,
                    weightKg: batch.weightKg,
                    co2OffsetKg: batch.co2OffsetKg || 0,
                    verifiedAt: batch.createdAt,
                  })
                }
              }}
            />
          )}

          {view === 'impact' && (
            <ImpactDashboard
              esg={esg}
              onOpenCertificate={(cert) => setActiveCertificate(cert)}
            />
          )}

          {view === 'admin-members' && (
            <AdminMemberManager onNotify={showNotification} />
          )}
        </main>
      </div>

      {/* Verification Modal */}
      {verifyingBatch && (
        <VerificationModal
          batch={verifyingBatch}
          onVerify={async (verifiedWeightKg, contaminationPct, notes) => {
            try {
              await api.verify(verifyingBatch.id, {
                verifiedWeightKg,
                contaminationPct,
                contaminationNotes: notes,
              })
              showNotification('Batch verification recorded and certificate minted!')
              await refresh()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Verification failed')
            }
          }}
          onClose={() => setVerifyingBatch(null)}
        />
      )}

      {/* QR Code Handshake Modal */}
      {qrBatch && qrBatch.qrToken && (
        <QrCodeModal
          token={qrBatch.qrToken}
          batchId={qrBatch.id}
          orgName={qrBatch.generatorOrg}
          wasteType={qrBatch.wasteType}
          weightKg={qrBatch.weightKg}
          onClose={() => setQrBatch(null)}
        />
      )}

      {/* Photo Proof Upload Modal */}
      {proofBatch && (
        <ProofUploadModal
          batchId={proofBatch.id}
          onUpload={async (kind, file) => {
            try {
              await api.uploadProof(proofBatch.id, kind, file)
              showNotification(`Photo proof for ${kind} uploaded successfully!`)
              await refresh()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Upload failed')
            }
          }}
          onClose={() => setProofBatch(null)}
        />
      )}

      {/* Full Audit Detail Modal */}
      {detailBatch && (
        <BatchDetailModal
          batch={detailBatch}
          onClose={() => setDetailBatch(null)}
        />
      )}

      {/* Official Certificate Modal */}
      {activeCertificate && (
        <CertificateModal
          code={activeCertificate.code}
          batchId={activeCertificate.batchId}
          weightKg={activeCertificate.weightKg}
          co2OffsetKg={activeCertificate.co2OffsetKg}
          verifiedAt={activeCertificate.verifiedAt}
          orgName={user.orgName}
          onClose={() => setActiveCertificate(null)}
        />
      )}
    </div>
  )
}
