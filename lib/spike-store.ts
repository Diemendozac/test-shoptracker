const KEY = 'scout_spikes'

export interface SpikeEntry {
  spike_floor: number
  last_score: number
  spiked_at: string
}

export type SpikeState = 'roots' | 'growing' | 'shrinking' | 'dead' | null

function load(): Record<string, SpikeEntry> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

function save(data: Record<string, SpikeEntry>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function loadAllSpikes(): Record<string, SpikeEntry> {
  return load()
}

export function spike(candidateId: string, score: number): void {
  const data = load()
  data[candidateId] = { spike_floor: score, last_score: score, spiked_at: new Date().toISOString() }
  save(data)
}

export function unspike(candidateId: string): void {
  const data = load()
  delete data[candidateId]
  save(data)
}

// Call once on page load to sync stored last_score with current API scores.
// Returns the updated record (already persisted to localStorage).
export function syncScores(
  candidates: Array<{ candidateId: string | number; performanceScore: number | null | undefined }>,
): Record<string, SpikeEntry> {
  const data = load()
  let changed = false
  for (const c of candidates) {
    const id = String(c.candidateId)
    const entry = data[id]
    if (!entry || c.performanceScore == null) continue
    const score = c.performanceScore
    if (score < entry.spike_floor) {
      delete data[id]
      changed = true
    } else if (score !== entry.last_score) {
      data[id] = { ...entry, last_score: score }
      changed = true
    }
  }
  if (changed) save(data)
  return data
}

export function computeSpikeState(entry: SpikeEntry | null | undefined, currentScore: number): SpikeState {
  if (!entry) return null
  if (currentScore < entry.spike_floor) return 'dead'
  if (currentScore <= entry.spike_floor) return 'roots'
  if (currentScore >= entry.last_score) return 'growing'
  return 'shrinking'
}

// Returns 0–4: how many spine "levels" to show based on delta above floor.
export function computeSpikeLevel(entry: SpikeEntry | null | undefined, currentScore: number): number {
  if (!entry || currentScore <= entry.spike_floor) return 0
  return Math.min(4, Math.floor((currentScore - entry.spike_floor) / 8))
}