import React, { useEffect, useState } from 'react'
import { MapPin, Sliders, Filter, Clock, Moon, Sun } from 'lucide-react'
import type { NearbyBatch, WasteType } from '../api'

interface WasteMapProps {
  nearby: NearbyBatch[]
  radius: number
  onRadiusChange: (r: number) => void
  onClaim?: (id: string) => void
  canClaim?: boolean
  onSelectBatch?: (id: string) => void
}

const TYPE_COLORS: Record<WasteType, string> = {
  RAW_VEGETABLE: '#10b981',
  COOKED_MEAT: '#f87171',
  COFFEE_GROUNDS: '#b45309',
  MIXED_ORGANIC: '#eab308',
  DAIRY: '#38bdf8',
  BAKERY: '#fb923c',
}

function hoursLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m remaining`
}

export const WasteMap: React.FC<WasteMapProps> = ({
  nearby,
  radius,
  onRadiusChange,
  onClaim,
  canClaim,
  onSelectBatch,
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [ecoDarkMode, setEcoDarkMode] = useState<boolean>(true)

  const filtered = nearby.filter((b) => (selectedType === 'ALL' ? true : b.wasteType === selectedType))

  useEffect(() => {
    const el = document.getElementById('waste-map')
    if (!el || !window.L) return

    // Prevent duplicate map initialization
    if ((el as any)._leaflet_id) {
      delete (el as any)._leaflet_id
    }

    const centerLat = nearby.length > 0 ? nearby[0].pickupLat : 12.9716
    const centerLng = nearby.length > 0 ? nearby[0].pickupLng : 77.5946

    const map = window.L.map(el, { zoomControl: true }).setView([centerLat, centerLng], 12)

    // Base layers without API key requirements
    const osmLayer = window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    })

    const satelliteLayer = window.L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: '&copy; Esri World Imagery',
      }
    )

    const topoLayer = window.L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: '&copy; Esri World Topo',
      }
    )

    // Default to OpenStreetMap
    osmLayer.addTo(map)

    // Layer switcher control
    const baseLayers = {
      '🗺️ Street Map': osmLayer,
      '🛰️ Satellite View': satelliteLayer,
      '🏔️ Topographic': topoLayer,
    }
    window.L.control.layers(baseLayers, undefined, { position: 'topright' }).addTo(map)

    // Radar search perimeter circle
    const radarCircle = window.L.circle([centerLat, centerLng], {
      radius: radius * 1000,
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: '5, 8',
    }).addTo(map)

    // Center marker (facility/depot)
    window.L.circleMarker([centerLat, centerLng], {
      radius: 7,
      color: '#34d399',
      fillColor: '#059669',
      fillOpacity: 1,
      weight: 2,
    })
      .addTo(map)
      .bindPopup(
        `<div style="font-family: system-ui; padding: 4px; font-weight: 700; color: #059669;">📍 Facility Center / Search Origin</div>`
      )

    // Render batch markers
    filtered.forEach((batch) => {
      const color = TYPE_COLORS[batch.wasteType] || '#10b981'
      const marker = window.L.circleMarker([batch.pickupLat, batch.pickupLng], {
        radius: 12,
        color: '#ffffff',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.9,
      }).addTo(map)

      const popupHtml = `
        <div style="font-family: system-ui; padding: 6px; min-width: 180px;">
          <div style="font-size: 11px; font-weight: 700; color: ${color}; text-transform: uppercase; letter-spacing: 0.05em;">
            ${batch.wasteType.replaceAll('_', ' ')}
          </div>
          <div style="font-size: 15px; font-weight: 800; margin: 3px 0; color: #111;">
            ${batch.weightKg} kg · ${batch.orgName}
          </div>
          <div style="font-size: 12px; color: #555; margin-bottom: 6px;">
            ${batch.distanceKm.toFixed(1)} km away · ${batch.pickupAddress || 'Loading dock'}
          </div>
          <div style="font-size: 11px; color: #777; margin-bottom: 8px;">
            🕒 ${hoursLeft(batch.expiryTime)}
          </div>
        </div>
      `
      marker.bindPopup(popupHtml)
    })

    // Fit map bounds to encompass all batches and center
    if (filtered.length > 0) {
      const bounds = window.L.latLngBounds(filtered.map((b) => [b.pickupLat, b.pickupLng]))
      bounds.extend([centerLat, centerLng])
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
    }

    return () => {
      map.remove()
      radarCircle.remove()
    }
  }, [filtered, nearby, radius])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Controls Bar */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <MapPin size={20} color="var(--emerald-400)" />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Proximity Waste Radar</h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              Showing {filtered.length} available batches in real time
            </div>
          </div>
        </div>

        {/* Radius Controller */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sliders size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Search Radius:</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--emerald-400)', minWidth: '45px' }}>
            {radius} km
          </span>
          <input
            type="range"
            min="2"
            max="30"
            step="1"
            value={radius}
            onChange={(e) => onRadiusChange(parseInt(e.target.value, 10))}
            style={{ width: '110px', accentColor: '#10b981' }}
          />
        </div>

        {/* Theme and Type Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className={`btn btn-sm ${ecoDarkMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setEcoDarkMode(!ecoDarkMode)}
            title="Toggle Eco-Dark Map Filter"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            {ecoDarkMode ? <Moon size={14} /> : <Sun size={14} />}
            <span>{ecoDarkMode ? 'Eco Dark' : 'Standard'}</span>
          </button>

          <div style={{ height: '18px', width: '1px', background: 'var(--border-subtle)', margin: '0 4px' }} />

          <Filter size={15} color="var(--text-subtle)" />
          <button
            className={`btn btn-sm ${selectedType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedType('ALL')}
          >
            All Types
          </button>
          {(['RAW_VEGETABLE', 'COFFEE_GROUNDS', 'BAKERY', 'MIXED_ORGANIC'] as WasteType[]).map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${selectedType === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedType(t)}
            >
              {t.replaceAll('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Map Element */}
      <div id="waste-map" className={ecoDarkMode ? 'eco-dark-map' : ''} />

      {/* Quick Summary Grid */}
      <div className="cards-grid">
        {filtered.map((b) => (
          <div className="batch-card" key={b.id}>
            <div className="batch-header">
              <span className="waste-tag" style={{ borderLeft: `3px solid ${TYPE_COLORS[b.wasteType]}` }}>
                {b.wasteType.replaceAll('_', ' ')}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={12} /> {hoursLeft(b.expiryTime)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div className="batch-weight">{b.weightKg} kg</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--emerald-400)' }}>
                {b.distanceKm.toFixed(1)} km
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{b.orgName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                {b.pickupAddress}
              </div>
            </div>

            {b.notes && <div className="batch-notes">{b.notes}</div>}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
              {canClaim && onClaim && (
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onClaim(b.id)}>
                  Claim Batch
                </button>
              )}
              {onSelectBatch && (
                <button className="btn btn-secondary btn-sm" onClick={() => onSelectBatch(b.id)}>
                  Details
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
