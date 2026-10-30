import React, { useState } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import type { ProofKind } from '../api'

interface ProofUploadModalProps {
  batchId: string
  defaultKind?: ProofKind
  onUpload: (kind: ProofKind, file: File) => Promise<void>
  onClose: () => void
}

export const ProofUploadModal: React.FC<ProofUploadModalProps> = ({
  batchId,
  defaultKind = 'PICKUP',
  onUpload,
  onClose,
}) => {
  const [kind, setKind] = useState<ProofKind>(defaultKind)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      setFile(selected)
      const reader = new FileReader()
      reader.onload = (evt) => {
        setPreview(evt.target?.result as string)
      }
      reader.readAsDataURL(selected)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select an image file to upload')
      return
    }
    setUploading(true)
    setError('')
    try {
      await onUpload(kind, file)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <Camera size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Upload Proof of Custody</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Batch #{batchId.substring(0, 8)}</div>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Evidence Category</label>
            <select className="select-field" value={kind} onChange={(e) => setKind(e.target.value as ProofKind)}>
              <option value="PICKUP">Pickup bay confirmation photo</option>
              <option value="DELIVERY">Delivery dock receipt photo</option>
              <option value="CONTAMINATION">Contamination inspection photo</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Photo Evidence</label>
            <div
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: preview ? 'transparent' : 'rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                position: 'relative',
              }}
              onClick={() => document.getElementById('proof-file-input')?.click()}
            >
              {preview ? (
                <div style={{ width: '100%', maxHeight: '200px', overflow: 'hidden', borderRadius: '8px' }}>
                  <img src={preview} alt="Evidence preview" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
                </div>
              ) : (
                <>
                  <Upload size={32} color="var(--emerald-400)" />
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Click to browse or drop photo</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>PNG, JPG or WEBP up to 15MB</div>
                </>
              )}
              <input
                id="proof-file-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading || !file}>
              {uploading ? 'Uploading…' : 'Save Proof'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
