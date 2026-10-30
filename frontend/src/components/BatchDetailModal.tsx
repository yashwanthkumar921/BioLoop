import React, { useEffect, useState } from 'react'
import { X, User, Truck, Factory, ShieldCheck, Clock, Image as ImageIcon } from 'lucide-react'
import { api, type Batch, type BatchEvent, type ProofUpload } from '../api'

interface BatchDetailModalProps {
  batch: Batch
  onClose: () => void
}

export const BatchDetailModal: React.FC<BatchDetailModalProps> = ({ batch, onClose }) => {
  const [events, setEvents] = useState<BatchEvent[]>([])
  const [proofs, setProofs] = useState<ProofUpload[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    Promise.all([api.getEvents(batch.id), api.getProofs(batch.id)])
      .then(([evs, prs]) => {
        setEvents(evs)
        setProofs(prs)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [batch.id])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className={`status-pill status-${batch.status}`}>{batch.status}</span>
              <span className="waste-tag">{batch.wasteType.replaceAll('_', ' ')}</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.4rem' }}>
              {batch.weightKg} kg · {batch.generatorOrg}
            </h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.3rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Chain of Custody Stakeholders */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--emerald-400)', fontSize: '0.75rem', fontWeight: 700 }}>
              <User size={14} /> GENERATOR
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.2rem' }}>{batch.generatorOrg}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{batch.pickupAddress}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--blue-400)', fontSize: '0.75rem', fontWeight: 700 }}>
              <Factory size={14} /> PROCESSOR
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.2rem' }}>{batch.processorOrg || 'Not claimed yet'}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--amber-400)', fontSize: '0.75rem', fontWeight: 700 }}>
              <Truck size={14} /> CARRIER
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.2rem' }}>{batch.driverOrg || 'Awaiting route dispatch'}</div>
          </div>
        </div>

        {/* Verification Summary if available */}
        {batch.certificateCode && (
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--emerald-400)', fontWeight: 700, fontSize: '0.85rem' }}>
                <ShieldCheck size={18} /> CERTIFICATE ISSUED
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, marginTop: '0.2rem' }}>
                {batch.certificateCode}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>CO₂e PREVENTED</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--emerald-400)' }}>
                {batch.co2OffsetKg} kg
              </div>
            </div>
          </div>
        )}

        {/* Uploaded photo proofs */}
        {proofs.length > 0 && (
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ImageIcon size={16} color="var(--emerald-400)" /> Photo Evidence ({proofs.length})
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.65rem' }}>
              {proofs.map((p) => (
                <a
                  key={p.id}
                  href={p.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    style={{
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle)',
                      background: 'rgba(0,0,0,0.3)',
                    }}
                  >
                    <img
                      src={p.fileUrl}
                      alt={p.kind}
                      style={{ width: '100%', height: '90px', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ padding: '0.35rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {p.kind}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Audit Event Timeline */}
        <div>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={16} color="var(--emerald-400)" /> Audit Trail ({events.length} Events)
          </h4>
          {loading ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading audit trail…</div>
          ) : events.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No recorded events.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {events.map((evt) => (
                <div
                  key={evt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.6rem 0.8rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--emerald-400)',
                      marginTop: '6px',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{evt.toStatus}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                        {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {evt.note || 'State updated'} · by <b>{evt.actorName}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
