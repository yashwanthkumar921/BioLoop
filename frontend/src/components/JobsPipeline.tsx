import React, { useState } from 'react'
import {
  CheckCircle,
  QrCode,
  ShieldCheck,
  Camera,
  Eye,
  Award,
  MapPin,
} from 'lucide-react'
import type { Batch, Role } from '../api'

interface JobsPipelineProps {
  mine: Batch[]
  role: Role
  onPickup: (batch: Batch, qrToken: string) => Promise<void>
  onDeliver: (batch: Batch) => Promise<void>
  onOpenVerify: (batch: Batch) => void
  onOpenQr: (batch: Batch) => void
  onOpenProof: (batch: Batch) => void
  onOpenDetail: (batch: Batch) => void
  onOpenCertificate: (batch: Batch) => void
}

export const JobsPipeline: React.FC<JobsPipelineProps> = ({
  mine,
  role,
  onPickup,
  onDeliver,
  onOpenVerify,
  onOpenQr,
  onOpenProof,
  onOpenDetail,
  onOpenCertificate,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [driverInputToken, setDriverInputToken] = useState<Record<string, string>>({})
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)

  const filtered = mine.filter((b) => (filterStatus === 'ALL' ? true : b.status === filterStatus))

  const handleDriverPickup = async (batch: Batch) => {
    const token = driverInputToken[batch.id] || batch.qrToken || ''
    if (!token) return
    setActionBusyId(batch.id)
    try {
      await onPickup(batch, token)
    } finally {
      setActionBusyId(null)
    }
  }

  const handleDeliver = async (batch: Batch) => {
    setActionBusyId(batch.id)
    try {
      await onDeliver(batch)
    } finally {
      setActionBusyId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header and Filter Pills */}
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Operations & Chain-of-Custody</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Track active logistics handshakes, verify digital intake, and review minted carbon certificates.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {['ALL', 'CLAIMED', 'IN_TRANSIT', 'DELIVERED', 'VERIFIED'].map((st) => (
            <button
              key={st}
              className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Batches Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No batches currently in this status tab.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map((batch) => (
            <div className="batch-card" key={batch.id}>
              <div className="batch-header">
                <span className={`status-pill status-${batch.status}`}>{batch.status}</span>
                <span className="waste-tag">{batch.wasteType.replaceAll('_', ' ')}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div className="batch-weight">{batch.weightKg} kg</div>
                {batch.co2OffsetKg && (
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
                    {batch.co2OffsetKg} kg CO₂e
                  </div>
                )}
              </div>

              {/* Stakeholder Routing Overview */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-subtle)' }}>From: </span>
                  <b>{batch.generatorOrg}</b>
                </div>
                {batch.processorOrg && (
                  <div>
                    <span style={{ color: 'var(--text-subtle)' }}>To: </span>
                    <b>{batch.processorOrg}</b>
                  </div>
                )}
                {batch.driverOrg && (
                  <div>
                    <span style={{ color: 'var(--text-subtle)' }}>Carrier: </span>
                    <span>{batch.driverOrg}</span>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {batch.pickupAddress}
              </div>

              {/* Driver QR Handshake Input / Quick Scan */}
              {role === 'DRIVER' && batch.status === 'CLAIMED' && (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 'var(--radius-md)', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--amber-400)', textTransform: 'uppercase' }}>
                    Pickup Bay Handshake
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      style={{ padding: '0.45rem', fontSize: '0.85rem' }}
                      placeholder="Enter 12-char QR code"
                      value={driverInputToken[batch.id] ?? (batch.qrToken || '')}
                      onChange={(e) =>
                        setDriverInputToken({ ...driverInputToken, [batch.id]: e.target.value.toUpperCase() })
                      }
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={actionBusyId === batch.id}
                      onClick={() => handleDriverPickup(batch)}
                    >
                      {actionBusyId === batch.id ? 'Verifying…' : 'Scan & Start'}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons Row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                {/* View QR Code (Generator or Admin) */}
                {batch.qrToken && (
                  <button className="btn btn-secondary btn-sm" onClick={() => onOpenQr(batch)}>
                    <QrCode size={14} /> Pickup QR
                  </button>
                )}

                {/* Driver Deliver Action */}
                {role === 'DRIVER' && batch.status === 'IN_TRANSIT' && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    disabled={actionBusyId === batch.id}
                    onClick={() => handleDeliver(batch)}
                  >
                    <CheckCircle size={14} /> Mark Delivered
                  </button>
                )}

                {/* Processor Verify Action */}
                {(role === 'PROCESSOR' || role === 'ADMIN') && batch.status === 'DELIVERED' && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => onOpenVerify(batch)}
                  >
                    <ShieldCheck size={14} /> Verify Intake & Mint
                  </button>
                )}

                {/* Upload Photo Proof */}
                <button className="btn btn-secondary btn-sm" onClick={() => onOpenProof(batch)} title="Add photo evidence">
                  <Camera size={14} /> Photo Proof
                </button>

                {/* View Certificate */}
                {batch.certificateCode && (
                  <button
                    className="btn btn-outline-emerald btn-sm"
                    onClick={() => onOpenCertificate(batch)}
                  >
                    <Award size={14} /> Certificate
                  </button>
                )}

                {/* View Detail & Audit Trail */}
                <button className="btn btn-secondary btn-sm" onClick={() => onOpenDetail(batch)} title="Audit Trail">
                  <Eye size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
