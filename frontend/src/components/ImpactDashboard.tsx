import React, { useState } from 'react'
import { Leaf, Award, Recycle, Search, ExternalLink } from 'lucide-react'
import type { EsgSummary } from '../api'

interface ImpactDashboardProps {
  esg: EsgSummary | null
  onOpenCertificate: (cert: {
    code: string
    batchId: string
    weightKg: number
    co2OffsetKg: number
    verifiedAt: string
  }) => void
}

export const ImpactDashboard: React.FC<ImpactDashboardProps> = ({ esg, onOpenCertificate }) => {
  const [search, setSearch] = useState('')

  if (!esg) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>No verified organic diversion data recorded yet.</p>
      </div>
    )
  }

  const maxOffset = Math.max(...esg.byType.map((r) => Number(r.co2OffsetKg)), 1)
  const filteredCerts = esg.certificates.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.batchId.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI Cards Banner */}
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald-400)' }}>
            <Leaf size={24} />
          </div>
          <div>
            <div className="kpi-val">{Number(esg.totalCo2OffsetKg).toFixed(1)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>kg</span></div>
            <div className="kpi-label">CO₂e Avoided (EPA Model)</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--blue-400)' }}>
            <Recycle size={24} />
          </div>
          <div>
            <div className="kpi-val">{Number(esg.totalDivertedKg).toFixed(1)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>kg</span></div>
            <div className="kpi-label">Organic Waste Diverted</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--amber-400)' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="kpi-val">{esg.verifiedBatches}</div>
            <div className="kpi-label">Minted ESG Certificates</div>
          </div>
        </div>
      </div>

      {/* Carbon Offset by Stream Breakdown */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Diversion by Organic Stream</h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
              Avoided methane potential weighted by biomass type
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {esg.byType.map((row) => {
            const percentage = Math.round((Number(row.co2OffsetKg) / maxOffset) * 100)
            return (
              <div key={row.wasteType}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{row.wasteType.replaceAll('_', ' ')}</span>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{Number(row.divertedKg).toFixed(1)} kg diverted</span>
                    <span style={{ fontWeight: 700, color: 'var(--emerald-400)' }}>
                      {Number(row.co2OffsetKg).toFixed(2)} kg CO₂e
                    </span>
                  </div>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--emerald-500), var(--emerald-400))',
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Audited Digital Certificates Registry Table */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Audited Digital Certificates</h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
              Verifiable proof records for corporate Scope 3 and circular economy reporting
            </div>
          </div>

          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search code or UUID…"
              className="input-field"
              style={{ paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6, fontSize: '0.82rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-subtle)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Certificate Code</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Verified Weight</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>CO₂e Avoided</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Verification Timestamp</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Official Certificate</th>
              </tr>
            </thead>
            <tbody>
              {filteredCerts.map((c) => (
                <tr key={c.code} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.85rem 0.5rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--emerald-400)' }}>
                    {c.code}
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem' }}>{Number(c.weightKg).toFixed(1)} kg</td>
                  <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: '#6ee7b7' }}>
                    {Number(c.co2OffsetKg).toFixed(2)} kg
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {new Date(c.verifiedAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                    <button
                      className="btn btn-outline-emerald btn-sm"
                      onClick={() => onOpenCertificate(c)}
                    >
                      <ExternalLink size={13} /> View & Print
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCerts.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-subtle)' }}>
                    No matching certificates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
