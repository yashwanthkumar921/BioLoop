import React from 'react'
import { QrCode, X, Check, Copy } from 'lucide-react'

interface QrCodeModalProps {
  token: string
  batchId: string
  orgName: string
  wasteType: string
  weightKg: number
  onClose: () => void
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  token,
  batchId,
  orgName,
  wasteType,
  weightKg,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false)

  const copyToken = () => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 440, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <QrCode className="text-emerald-400" size={22} color="#34d399" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Pickup Handshake Token</h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.3rem' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {orgName} · Batch #{batchId.substring(0, 8)}<br />
          Present this secure handshake token to the verified driver at the pickup bay.
        </p>

        {/* Visual QR Simulator */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            margin: '0.5rem auto',
            width: '210px',
            height: '210px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {/* Stylized QR Matrix Pattern */}
          <div
            style={{
              width: '160px',
              height: '160px',
              background: `repeating-conic-gradient(#111827 0% 25%, #ffffff 0% 50%) 50% / 20px 20px`,
              border: '6px solid #111827',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '2px solid #111827',
                fontWeight: 800,
                fontSize: '0.85rem',
                letterSpacing: '0.1em',
                color: '#059669',
              }}
            >
              BIOLOOP
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
            Verification Code
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.4rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: '#34d399',
              marginTop: '0.2rem',
            }}
          >
            {token}
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-around' }}>
          <span><b>Type:</b> {wasteType}</span>
          <span><b>Weight:</b> {weightKg} kg</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={copyToken}>
            {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
