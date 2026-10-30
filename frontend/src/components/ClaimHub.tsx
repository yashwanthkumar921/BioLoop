import React, { useState } from 'react'
import { ShoppingBag, Truck, Clock, MapPin } from 'lucide-react'
import type { Batch, NearbyBatch, Role } from '../api'

interface ClaimHubProps {
  nearby: NearbyBatch[]
  openJobs: Batch[]
  role: Role
  onClaim: (id: string) => Promise<void>
  onAccept: (id: string) => Promise<void>
}

export const ClaimHub: React.FC<ClaimHubProps> = ({
  nearby,
  openJobs,
  role,
  onClaim,
  onAccept,
}) => {
  const [activeTab, setActiveTab] = useState<'batches' | 'transport'>('batches')
  const [busyId, setBusyId] = useState<string | null>(null)

  const handleClaim = async (id: string) => {
    setBusyId(id)
    try {
      await onClaim(id)
    } finally {
      setBusyId(null)
    }
  }

  const handleAccept = async (id: string) => {
    setBusyId(id)
    try {
      await onAccept(id)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header and Filter Tabs */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Organic Nutrient Marketplace</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Claim active batches for composting/digestion, or accept carrier transport jobs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.25)', padding: '0.3rem', borderRadius: 'var(--radius-md)' }}>
          <button
            className={`btn btn-sm ${activeTab === 'batches' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('batches')}
          >
            <ShoppingBag size={14} /> Available Batches ({nearby.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'transport' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('transport')}
          >
            <Truck size={14} /> Open Transport Jobs ({openJobs.length})
          </button>
        </div>
      </div>

      {/* Available Batches Tab */}
      {activeTab === 'batches' && (
        <div>
          {nearby.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>No live organic batches currently inside the search radius.</p>
            </div>
          ) : (
            <div className="cards-grid">
              {nearby.map((b) => (
                <div className="batch-card" key={b.id}>
                  <div className="batch-header">
                    <span className="waste-tag">{b.wasteType.replaceAll('_', ' ')}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} /> Live Window
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div className="batch-weight">{b.weightKg} kg</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
                      {b.distanceKm.toFixed(1)} km away
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{b.orgName}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={13} /> {b.pickupAddress}
                    </div>
                  </div>

                  {b.notes && <div className="batch-notes">{b.notes}</div>}

                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                    {role === 'PROCESSOR' || role === 'ADMIN' ? (
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={busyId === b.id}
                        onClick={() => handleClaim(b.id)}
                      >
                        {busyId === b.id ? 'Claiming…' : 'Claim Batch for Processing'}
                      </button>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textAlign: 'center' }}>
                        Sign in as Processor to claim batches
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Open Transport Jobs Tab */}
      {activeTab === 'transport' && (
        <div>
          {openJobs.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                No transport jobs awaiting drivers. Batches will appear here once claimed by a processor.
              </p>
            </div>
          ) : (
            <div className="cards-grid">
              {openJobs.map((job) => (
                <div className="batch-card" key={job.id}>
                  <div className="batch-header">
                    <span className="status-pill status-CLAIMED">ROUTE DISPATCH READY</span>
                    <span className="waste-tag">{job.wasteType.replaceAll('_', ' ')}</span>
                  </div>

                  <div className="batch-weight">{job.weightKg} kg</div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--emerald-400)', fontWeight: 700 }}>ORIGIN:</span>
                      <span>{job.generatorOrg}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--blue-400)', fontWeight: 700 }}>DESTINATION:</span>
                      <span>{job.processorOrg}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                    <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    Pickup at: {job.pickupAddress}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                    {role === 'DRIVER' || role === 'ADMIN' ? (
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={busyId === job.id}
                        onClick={() => handleAccept(job.id)}
                      >
                        {busyId === job.id ? 'Accepting…' : 'Accept Route & Dispatch'}
                      </button>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textAlign: 'center' }}>
                        Sign in as Driver to accept routes
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
