const API_BASE = '/api'

export interface PricingVariant {
  quantity: number
  price: number  // cents
  label: string
}

export interface CardPricing {
  currency: string
  variants: PricingVariant[]
}

export interface CardTemplate {
  id: string
  name: string
  description: string
  tags: string[]
  colors: string[]
  allowedOperations: string[]
  suggestions: Array<{
    type: string
    label: string
    prompt: string
  }>
  pricing: CardPricing
  thumbnailUrl: string
  imageUrl?: string
}

export interface EditResponse {
  success: boolean
  editedImageUrl: string | null
  sanitizedPrompt: string | null
  message: string
  requiresColorInput?: boolean
  suggestedColors?: string[]
  colorContext?: string
  originalPrompt?: string
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
  prompt: string,
  selectedColor?: string,
  colorContext?: string
): Promise<EditResponse> {
  const res = await fetch(`${API_BASE}/edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId, imageUrl, prompt, selectedColor, colorContext }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to edit card')
  }
  return res.json()
}

export interface TextOverlay {
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  fontWeight: string
  fontStyle: string
  color: string
  rotation?: number
}

export interface ImageLayer {
  id: string
  imageUrl: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  aspectRatio: number
  prompt: string
}

export interface GenerateLayerResponse {
  success: boolean
  layerImageUrl: string | null
  prompt: string | null
  message: string
}

export interface FontOption {
  value: string
  label: string
}

export async function generateImageLayer(
  cardId: string,
  prompt: string,
  imageUrl: string
): Promise<GenerateLayerResponse> {
  const res = await fetch(`${API_BASE}/generate-layer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId, prompt, imageUrl }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Failed to generate layer')
  }
  return res.json()
}

export async function downloadCardWithText(
  imageUrl: string,
  textOverlays: TextOverlay[],
  imageLayers: ImageLayer[],
  filename: string
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        textOverlays,
        imageLayers,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to download image with text')
    }

    // Get the blob and create download link
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading image with text:', error)
    throw error
  }
}

export async function saveOrderImage(blob: Blob, cardId: string): Promise<{ imageUrl: string }> {
  const formData = new FormData()
  formData.append('image', blob, `${cardId}-order.png`)
  formData.append('cardId', cardId)

  const response = await fetch(`${API_BASE}/order-image`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) throw new Error('Failed to save order image')
  return response.json()
}

// Order types
export interface OrderItem {
  cardId: string
  cardName: string
  imageUrl: string
  quantity: number
  pricePerUnit: number
  label: string
}

export interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface Address {
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: string
}

export interface CreateOrderRequest {
  customer: CustomerInfo
  shippingAddress: Address
  billingAddress: Address
  items: OrderItem[]
}

export interface CreateOrderResponse {
  orderId: string
  checkoutUrl: string
}

export interface OrderStatus {
  orderId: string
  orderNumber: string
  status: string
  paymentStatus: string
  items: OrderItem[]
  customer: CustomerInfo
  shippingAddress: Address
  totalAmount: number
  shippingCost: number
  currency: string
  createdAt: string
}

export async function createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Bestelling aanmaken mislukt')
  }
  return res.json()
}

export async function getOrderStatus(orderId: string): Promise<OrderStatus> {
  const res = await fetch(`${API_BASE}/orders/${orderId}`)
  if (!res.ok) throw new Error('Bestelling niet gevonden')
  return res.json()
}

export async function getShippingCost(): Promise<{ shippingCostCents: number }> {
  const res = await fetch(`${API_BASE}/orders/shipping-cost`)
  if (!res.ok) throw new Error('Verzendkosten ophalen mislukt')
  return res.json()
}

export async function getAvailableFonts(): Promise<FontOption[]> {
  try {
    const response = await fetch(`${API_BASE}/fonts`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch available fonts')
    }
    
    const data = await response.json()
    return data.fonts
  } catch (error) {
    console.error('Error fetching fonts:', error)
    // Fallback to basic fonts if API fails
    return [
      { value: 'Arial', label: 'Arial (Fallback)' },
      { value: 'Georgia', label: 'Georgia (Fallback)' },
    ]
  }
}
