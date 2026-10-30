import React, { useState } from 'react'
import { PlusCircle, Navigation, Clock, Check, Leaf } from 'lucide-react'
import type { WasteType } from '../api'

interface PostBatchProps {
  defaultLat: number
  defaultLng: number
  onCreate: (payload: {
    wasteType: WasteType
    weightKg: number
    latitude: number
    longitude: number
    pickupAddress: string
    expiryTime?: string
    notes?: string
  }) => Promise<void>
}

const TYPE_DESCRIPTIONS: Record<WasteType, { label: string; desc: string; multiplier: number }> = {
  RAW_VEGETABLE: { label: 'Raw Vegetable Scraps', desc: 'Pre-consumer prep trimmings, peelings & leaves', multiplier: 1.0 },
  COOKED_MEAT: { label: 'Cooked Food & Meat', desc: 'Commercial kitchen overproduction & buffet items', multiplier: 1.3 },
  COFFEE_GROUNDS: { label: 'Spent Coffee Grounds', desc: 'Clean, separated espresso grounds', multiplier: 0.8 },
  MIXED_ORGANIC: { label: 'Mixed Organic Food Waste', desc: 'Assorted compostable food surplus', multiplier: 1.05 },
  DAIRY: { label: 'Dairy & Cheese', desc: 'Expired milk, yoghurt, cheese trimmings', multiplier: 1.15 },
  BAKERY: { label: 'Bakery Surplus', desc: 'Day-old breads, dough, non-frosted pastries', multiplier: 0.9 },
}

export const PostBatch: React.FC<PostBatchProps> = ({ defaultLat, defaultLng, onCreate }) => {
  const [wasteType, setWasteType] = useState<WasteType>('RAW_VEGETABLE')
  const [weightKg, setWeightKg] = useState<string>('50')
  const [address, setAddress] = useState<string>('GreenLeaf Kitchen Loading Bay, Indiranagar, Bengaluru')
  const [notes, setNotes] = useState<string>('Clean pre-consumer trimmings, sorted in standard 50L crates.')
  const [lat, setLat] = useState<number>(defaultLat)
  const [lng, setLng] = useState<number>(defaultLng)
  const [hours, setHours] = useState<number>(4)
  const [loadingGps, setLoadingGps] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const currentMultiplier = TYPE_DESCRIPTIONS[wasteType]?.multiplier || 1.0
  const parsedWeight = parseFloat(weightKg) || 0
  const projectedCO2e = (parsedWeight * 0.58 * currentMultiplier).toFixed(2)

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setLoadingGps(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude)
          setLng(pos.coords.longitude)
          setLoadingGps(false)
        },
        () => {
          setLoadingGps(false)
        }
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (parsedWeight <= 0) {
      setError('Please provide a valid weight greater than 0 kg')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const expiry = new Date(Date.now() + hours * 3600000).toISOString()
      await onCreate({
        wasteType,
        weightKg: parsedWeight,
        latitude: lat,
        longitude: lng,
        pickupAddress: address,
        expiryTime: expiry,
        notes,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish batch')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
      <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--emerald-500), var(--emerald-600))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <PlusCircle size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Publish Organic Waste Batch</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Create a time-bounded pickup window for nearby verified processors and drivers.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Waste Type Grid Selector */}
          <div className="form-group">
            <label className="form-label">Select Waste Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem' }}>
              {(Object.keys(TYPE_DESCRIPTIONS) as WasteType[]).map((type) => {
                const isSelected = wasteType === type
                const item = TYPE_DESCRIPTIONS[type]
                return (
                  <div
                    key={type}
                    onClick={() => setWasteType(type)}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '1px solid var(--emerald-400)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isSelected ? '#34d399' : 'var(--text-main)' }}>
                        {item.label}
                      </span>
                      {isSelected && <Check size={16} color="#34d399" />}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
                      {item.desc}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mass Input & Presets */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Approximate Total Mass (kg)</label>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {['15', '30', '50', '100', '250'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => setWeightKg(preset)}
                  >
                    {preset} kg
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              step="0.5"
              min="1"
              required
              className="input-field"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="e.g. 50"
            />
          </div>

          {/* Real-time Environmental Benefit Banner */}
          <div
            style={{
              padding: '0.9rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Leaf size={22} color="var(--emerald-400)" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                  Projected Environmental Impact
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6ee7b7', fontWeight: 600 }}>
                  Avoids landfill methane generation
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--emerald-400)' }}>
                ~{projectedCO2e}
              </span>{' '}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>kg CO₂e</span>
            </div>
          </div>

          {/* Location & GPS */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Pickup Loading Dock & Address</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={handleUseCurrentLocation}
                disabled={loadingGps}
              >
                <Navigation size={12} /> {loadingGps ? 'Locating…' : 'Detect GPS'}
              </button>
            </div>
            <input
              type="text"
              required
              className="input-field"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Building, street, loading gate number"
            />
          </div>

          {/* Window & Shelf Life */}
          <div className="form-group">
            <label className="form-label">Pickup Window Expiration</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {[
                { h: 2, label: '2 Hours (Hot/Bakery)' },
                { h: 4, label: '4 Hours (Standard)' },
                { h: 8, label: '8 Hours (Full Shift)' },
                { h: 24, label: '24 Hours (Chilled)' },
              ].map((opt) => (
                <button
                  key={opt.h}
                  type="button"
                  className={`btn btn-sm ${hours === opt.h ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setHours(opt.h)}
                >
                  <Clock size={13} /> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Handling Instructions / Notes</label>
            <textarea
              className="textarea-field"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. In loading bay rear alley; call security on arrival."
            />
          </div>

          {/* Action button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '0.5rem' }}
            disabled={submitting}
          >
            {submitting ? 'Publishing to Network…' : 'Publish Pickup Window to Marketplace'}
          </button>
        </form>
      </div>
    </div>
  )
}
