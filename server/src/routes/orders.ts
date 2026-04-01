import { Router, Request, Response } from 'express'
import { createMollieClient } from '@mollie/api-client'
import { v4 as uuidv4 } from 'uuid'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from '../config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ordersDir = path.join(__dirname, '..', '..', 'orders')
const cardsMetadataPath = path.join(__dirname, '..', '..', 'cards', 'metadata.json')

export const ordersRouter = Router()

function getMollieClient() {
  if (!config.mollieApiKey) {
    throw new Error('MOLLIE_API_KEY is not configured')
  }
  return createMollieClient({ apiKey: config.mollieApiKey })
}

function loadCardsMetadata(): any[] {
  return JSON.parse(readFileSync(cardsMetadataPath, 'utf-8'))
}

function generateOrderNumber(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `MS-${year}${month}-${random}`
}

interface OrderItem {
  cardId: string
  cardName: string
  imageUrl: string
  quantity: number
  pricePerUnit: number
  label: string
}

interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface Address {
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: string
}

// POST /api/orders — Create a new order and Mollie payment
ordersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { customer, shippingAddress, billingAddress, items } = req.body as {
      customer: CustomerInfo
      shippingAddress: Address
      billingAddress: Address
      items: OrderItem[]
    }

    // Validate required fields
    if (!customer?.firstName || !customer?.lastName || !customer?.email) {
      res.status(400).json({ message: 'Klantgegevens zijn verplicht (voornaam, achternaam, e-mail).' })
      return
    }
    if (!shippingAddress?.street || !shippingAddress?.postalCode || !shippingAddress?.city) {
      res.status(400).json({ message: 'Verzendadres is onvolledig.' })
      return
    }
    if (!items || items.length === 0) {
      res.status(400).json({ message: 'Winkelwagen is leeg.' })
      return
    }

    // Validate prices against metadata
    const cards = loadCardsMetadata()
    let subtotal = 0
    for (const item of items) {
      const card = cards.find((c: any) => c.id === item.cardId)
      if (!card) {
        res.status(400).json({ message: `Kaartje "${item.cardId}" niet gevonden.` })
        return
      }
      const variant = card.pricing.variants.find((v: any) => v.quantity === item.quantity)
      if (!variant) {
        res.status(400).json({ message: `Ongeldige variant voor "${item.cardName}".` })
        return
      }
      if (variant.price !== item.pricePerUnit) {
        res.status(400).json({ message: `Prijs komt niet overeen voor "${item.cardName}".` })
        return
      }
      subtotal += variant.price
    }

    const shippingCost = config.shippingCostCents
    const totalCents = subtotal + shippingCost

    // Create order
    const orderId = uuidv4()
    const orderNumber = generateOrderNumber()
    const totalValue = (totalCents / 100).toFixed(2)

    const orderData = {
      orderId,
      orderNumber,
      status: 'pending',
      paymentStatus: 'open',
      paymentId: null as string | null,
      customer,
      shippingAddress,
      billingAddress,
      items,
      subtotal,
      shippingCost,
      totalAmount: totalCents,
      currency: 'EUR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Save order to disk
    const orderFile = path.join(ordersDir, `${orderId}.json`)
    writeFileSync(orderFile, JSON.stringify(orderData, null, 2))
    console.log(`[Order] Created order ${orderNumber} (${orderId})`)

    // Create Mollie payment
    const mollieClient = getMollieClient()
    const serverBaseUrl = config.orderImageBaseUrl
    const appBaseUrl = config.appBaseUrl

    const payment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: totalValue,
      },
      description: `Madam Sam - Bestelling ${orderNumber}`,
      redirectUrl: `${appBaseUrl}/order/confirmation?orderId=${orderId}`,
      webhookUrl: `${serverBaseUrl}/api/webhooks/mollie`,
      metadata: {
        orderId,
        orderNumber,
      },
    })

    // Update order with payment ID
    orderData.paymentId = payment.id
    orderData.updatedAt = new Date().toISOString()
    writeFileSync(orderFile, JSON.stringify(orderData, null, 2))
    console.log(`[Order] Mollie payment ${payment.id} created for order ${orderNumber}`)

    res.json({
      orderId,
      checkoutUrl: payment.getCheckoutUrl(),
    })
  } catch (err) {
    console.error('[Order] Failed to create order:', err)
    const message = err instanceof Error ? err.message : 'Bestelling aanmaken mislukt'
    res.status(500).json({ message })
  }
})

// GET /api/orders/shipping-cost — Return current shipping cost
ordersRouter.get('/shipping-cost', (_req: Request, res: Response) => {
  res.json({ shippingCostCents: config.shippingCostCents })
})

// GET /api/orders/:id — Get order status
ordersRouter.get('/:id', (req: Request, res: Response) => {
  const orderId = req.params.id
  const orderFile = path.join(ordersDir, `${orderId}.json`)

  if (!existsSync(orderFile)) {
    res.status(404).json({ message: 'Bestelling niet gevonden.' })
    return
  }

  try {
    const orderData = JSON.parse(readFileSync(orderFile, 'utf-8'))
    // Don't expose payment ID to client
    const { paymentId, ...safeData } = orderData
    res.json(safeData)
  } catch {
    res.status(500).json({ message: 'Fout bij het ophalen van de bestelling.' })
  }
})
