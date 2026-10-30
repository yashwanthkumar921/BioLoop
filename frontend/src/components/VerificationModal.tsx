import React, { useState } from 'react'
import { ShieldCheck, AlertTriangle, X, Leaf } from 'lucide-react'
import type { Batch, WasteType } from '../api'

interface VerificationModalProps {
  batch: Batch
  onVerify: (verifiedWeightKg: number, contaminationPct: number, notes: string) => Promise<void>
  onClose: () => void
}

const MULTIPLIERS: Record<WasteType, number> = {
  RAW_VEGETABLE: 1.0,
  COOKED_MEAT: 1.3,
  COFFEE_GROUNDS: 0.8,
  MIXED_ORGANIC: 1.05,
  DAIRY: 1.15,
  BAKERY: 0.9,
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  batch,
  onVerify,
  onClose,
}) => {
  const [weight, setWeight] = useState<number>(batch.weightKg)
  const [contamination, setContamination] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const isRejected = contamination > 25
  const multiplier = MULTIPLIERS[batch.wasteType] || 1.0
  const estimatedOffset = (weight * 0.58 * multiplier).toFixed(2)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (weight <= 0) {
      setError('Verified weight must be greater than 0 kg')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onVerify(weight, contamination, notes)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'rgba(52, 211, 153, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Intake & Quality Verification</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                {batch.generatorOrg} · Batch #{batch.id.substring(0, 8)}
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.3rem' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.65rem 0.9rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="form-group">
            <label className="form-label">Scale Verified Net Weight (kg)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                className="input-field"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                kg (declared: {batch.weightKg})
              </span>
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Contamination Assessment</label>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: isRejected ? '#f87171' : contamination > 10 ? '#fbbf24' : '#34d399',
                }}
              >
                {contamination}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={contamination}
              onChange={(e) => setContamination(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: isRejected ? '#ef4444' : '#10b981' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
              <span>0% (Clean)</span>
              <span>10% (Tolerable)</span>
              <span>25% Max Rejection Threshold</span>
              <span>50%</span>
            </div>
          </div>

          {/* Real-time status impact preview */}
          {isRejected ? (
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '0.85rem',
              }}
            >
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
              <div>
                <strong>Rejection Warning:</strong> Contamination exceeds 25%. Submitting will reject this batch and no digital carbon certificate will be issued.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#6ee7b7',
                fontSize: '0.85rem',
              }}
            >
              <Leaf size={20} style={{ flexShrink: 0, color: '#34d399' }} />
              <div>
                <strong>Carbon Offset Projected:</strong> ~{estimatedOffset} kg CO₂e saved. A verifiable digital certificate will be minted.
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Inspection & Contamination Notes (optional)</label>
            <textarea
              className="textarea-field"
              rows={2}
              placeholder="e.g. Clean organic matter, minor plastic packaging removed."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${isRejected ? 'btn-secondary' : 'btn-primary'}`}
              style={{ flex: 1, ...(isRejected ? { background: '#ef4444', color: '#fff' } : {}) }}
              disabled={submitting}
            >
              {submitting ? 'Processing…' : isRejected ? 'Submit Rejection' : 'Issue Verified Certificate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

