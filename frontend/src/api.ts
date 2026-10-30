const TOKEN_KEY = 'bioloop.token'

export type Role = 'GENERATOR' | 'PROCESSOR' | 'DRIVER' | 'ADMIN'
export type WasteType =
  | 'RAW_VEGETABLE'
  | 'COOKED_MEAT'
  | 'COFFEE_GROUNDS'
  | 'MIXED_ORGANIC'
  | 'DAIRY'
  | 'BAKERY'

export type BatchStatus =
  | 'AVAILABLE'
  | 'CLAIMED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'VERIFIED'
  | 'EXPIRED'
  | 'REJECTED'

export type ProofKind = 'PICKUP' | 'DELIVERY' | 'CONTAMINATION'

export interface User {
  id: string
  email: string
  orgName: string
  role: Role
  latitude: number | null
  longitude: number | null
  address: string | null
  phone: string | null
}

export interface NearbyBatch {
  id: string
  wasteType: WasteType
  weightKg: number
  expiryTime: string
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  distanceKm: number
  orgName: string
  notes: string
  status: BatchStatus
}

export interface Batch {
  id: string
  generatorId: string
  generatorOrg: string
  processorId: string | null
  processorOrg: string | null
  driverId: string | null
  driverOrg: string | null
  wasteType: WasteType
  weightKg: number
  status: BatchStatus
  pickupLat: number
  pickupLng: number
  pickupAddress: string
  expiryTime: string
  qrToken: string | null
  notes: string
  createdAt: string
  contaminationPct: number | null
  co2OffsetKg: number | null
  certificateCode: string | null
}

export interface BatchEvent {
  id: string
  actorId: string | null
  actorName: string
  fromStatus: string | null
  toStatus: string
  note: string | null
  createdAt: string
}

export interface ProofUpload {
  id: string
  batchId: string
  uploadedById: string
  uploaderName: string
  kind: ProofKind
  fileUrl: string
  createdAt: string
}

export interface EsgSummary {
  totalCo2OffsetKg: number
  totalDivertedKg: number
  verifiedBatches: number
  byType: { wasteType: WasteType; co2OffsetKg: number; divertedKg: number }[]
  certificates: {
    code: string
    batchId: string
    verifiedAt: string
    co2OffsetKg: number
    weightKg: number
  }[]
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(path, { ...options, headers })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body.error || body.message || message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (payload: Record<string, unknown>) =>
    request<{ token: string; user: User }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: () => request<User>('/api/v1/auth/me'),
  nearby: (lat: number, lng: number, radius = 15) =>
    request<NearbyBatch[]>(`/api/v1/batches/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  mine: () => request<Batch[]>('/api/v1/batches/mine'),
  openJobs: () => request<Batch[]>('/api/v1/batches/open-jobs'),
  getBatch: (id: string) => request<Batch>(`/api/v1/batches/${id}`),
  create: (payload: {
    wasteType: WasteType
    weightKg: number
    latitude: number
    longitude: number
    pickupAddress: string
    expiryTime?: string
    notes?: string
  }) =>
    request<Batch>('/api/v1/batches', { method: 'POST', body: JSON.stringify(payload) }),
  claim: (id: string) => request<Batch>(`/api/v1/batches/${id}/claim`, { method: 'PATCH' }),
  accept: (id: string) => request<Batch>(`/api/v1/batches/${id}/accept`, { method: 'PATCH' }),
  status: (id: string, body: { status: BatchStatus; qrToken?: string | null; note?: string }) =>
    request<Batch>(`/api/v1/batches/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
  verify: (
    id: string,
    body: { verifiedWeightKg: number; contaminationPct: number; contaminationNotes?: string }
  ) =>
    request<Batch>(`/api/v1/batches/${id}/verify`, { method: 'POST', body: JSON.stringify(body) }),
  getEvents: (id: string) => request<BatchEvent[]>(`/api/v1/batches/${id}/events`),
  getProofs: (id: string) => request<ProofUpload[]>(`/api/v1/batches/${id}/proofs`),
  uploadProof: (id: string, kind: ProofKind, file: File) => {
    const formData = new FormData()
    formData.append('kind', kind)
    formData.append('file', file)
    return request<ProofUpload>(`/api/v1/batches/${id}/proofs`, {
      method: 'POST',
      body: formData,
    })
  },
  esg: () => request<EsgSummary>('/api/v1/analytics/esg'),
  admin: {
    listMembers: (role?: Role) =>
      request<User[]>(`/api/v1/admin/members${role ? `?role=${role}` : ''}`),
    createMember: (payload: {
      email: string
      password: string
      orgName: string
      role: Role
      address?: string
      phone?: string
      latitude?: number
      longitude?: number
    }) =>
      request<User>('/api/v1/admin/members', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    deleteMember: (id: string) =>
      request<void>(`/api/v1/admin/members/${id}`, {
        method: 'DELETE',
      }),
  },
}
