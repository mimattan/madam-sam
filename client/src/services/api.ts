const API_BASE = '/api'

export interface CardTemplate {
  id: string
  name: string
  description: string
  tags: string[]
  babyName: string
  colors: string[]
  thumbnailUrl: string
  imageUrl?: string
}

export interface EditResponse {
  success: boolean
  editedImageUrl: string | null
  sanitizedPrompt: string | null
  message: string
}

export async function fetchCards(): Promise<CardTemplate[]> {
  const res = await fetch(`${API_BASE}/cards`)
  if (!res.ok) throw new Error('Failed to fetch cards')
  return res.json()
}

export async function fetchCard(id: string): Promise<CardTemplate> {
  const res = await fetch(`${API_BASE}/cards/${id}`)
  if (!res.ok) throw new Error('Failed to fetch card')
  return res.json()
}

export async function editCard(
  cardId: string,
  imageUrl: string,
  prompt: string
): Promise<EditResponse> {
  const res = await fetch(`${API_BASE}/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId, imageUrl, prompt }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to edit card')
  }
  return res.json()
}
