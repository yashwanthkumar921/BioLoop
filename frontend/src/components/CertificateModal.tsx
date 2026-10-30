import React from 'react'
import { Award, Printer, X, ShieldCheck } from 'lucide-react'

interface CertificateModalProps {
  code: string
  batchId: string
  weightKg: number
  co2OffsetKg: number
  verifiedAt: string
  orgName?: string
  onClose: () => void
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  code,
  batchId,
  weightKg,
  co2OffsetKg,
  verifiedAt,
  orgName = 'GreenLeaf Kitchen',
  onClose,
}) => {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 580, padding: '2.5rem' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            BioLoop ESG Carbon Registry
          </span>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.3rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Certificate Body Container */}
        <div
          id="printable-cert"
          style={{
            border: '2px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.02))',
            position: 'relative',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--emerald-400)',
                border: '2px solid var(--emerald-400)',
              }}
            >
              <Award size={28} />
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              Certificate of Verified Organic Diversion
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Standard EPA Organic Waste Landfill Avoidance Protocol (0.58 kg CO₂e/kg)
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
              Issued to Producer
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--emerald-400)', marginTop: '0.2rem' }}>
              {orgName}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>DIVERTED MASS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.2rem' }}>{weightKg} kg</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>CO₂e AVOIDED</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--emerald-400)', marginTop: '0.2rem' }}>
                {co2OffsetKg} kg
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', fontSize: '0.78rem', color: 'var(--text-subtle)', textAlign: 'left' }}>
            <div>
              <div><b>Certificate:</b> <span style={{ fontFamily: 'var(--font-mono)' }}>{code}</span></div>
              <div><b>Batch UUID:</b> {batchId.substring(0, 16)}…</div>
              <div><b>Verified Date:</b> {new Date(verifiedAt).toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--emerald-400)', fontWeight: 600 }}>
              <ShieldCheck size={18} /> MINTED & AUDITED
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handlePrint}>
            <Printer size={16} /> Print Official Certificate
          </button>
        </div>
      </div>
    </div>
  )
}
