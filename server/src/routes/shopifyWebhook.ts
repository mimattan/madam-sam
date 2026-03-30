import { Router, Request, Response } from 'express'
import * as crypto from 'crypto'
import { writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from '../config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ordersDir = path.join(__dirname, '..', '..', 'orders')

export const shopifyWebhookRouter = Router()

function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  if (!config.shopifyWebhookSecret) {
    console.warn('[Webhook] No webhook secret configured — skipping verification')
    return true
  }

  const hmac = crypto
    .createHmac('sha256', config.shopifyWebhookSecret)
    .update(rawBody)
    .digest('base64')

  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(signature)
  )
}

shopifyWebhookRouter.post('/orders', (req: Request, res: Response) => {
  const signature = req.headers['x-shopify-hmac-sha256'] as string

  // Verify HMAC signature
  if (signature && !verifyWebhookSignature(req.body as Buffer, signature)) {
    console.error('[Webhook] Invalid HMAC signature — rejecting webhook')
    res.status(401).json({ error: 'Invalid signature' })
    return
  }

  // Parse the raw body
  let order: any
  try {
    order = JSON.parse((req.body as Buffer).toString('utf-8'))
  } catch {
    console.error('[Webhook] Failed to parse webhook body')
    res.status(400).json({ error: 'Invalid JSON' })
    return
  }

  // Extract order details
  const orderId = order.id || order.order_number || 'unknown'
  const lineItems = (order.line_items || []).map((item: any) => ({
    title: item.title,
    variant_title: item.variant_title,
    quantity: item.quantity,
    price: item.price,
    properties: item.properties || [],
  }))

  const orderData = {
    orderId,
    orderNumber: order.order_number,
    createdAt: order.created_at,
    customer: {
      email: order.email,
      firstName: order.customer?.first_name,
      lastName: order.customer?.last_name,
    },
    shippingAddress: order.shipping_address,
    lineItems,
    totalPrice: order.total_price,
    currency: order.currency,
    financialStatus: order.financial_status,
    receivedAt: new Date().toISOString(),
  }

  // Save order to JSON file for fulfillment tracking
  const orderFile = path.join(ordersDir, `${orderId}.json`)
  try {
    writeFileSync(orderFile, JSON.stringify(orderData, null, 2))
    console.log(`[Webhook] Order ${orderId} saved to ${orderFile}`)
  } catch (err) {
    console.error(`[Webhook] Failed to save order ${orderId}:`, err)
  }

  // Log summary
  console.log(`[Webhook] Order received: #${order.order_number}`)
  console.log(`[Webhook]   Customer: ${order.email}`)
  console.log(`[Webhook]   Items: ${lineItems.length}`)
  lineItems.forEach((item: any) => {
    console.log(`[Webhook]     - ${item.title} (${item.variant_title}) x${item.quantity} @ ${item.price}`)
    if (item.properties?.length) {
      item.properties.forEach((prop: any) => {
        console.log(`[Webhook]       ${prop.name}: ${prop.value}`)
      })
    }
  })

  // Respond immediately (Shopify requires response within 5 seconds)
  res.status(200).json({ received: true })
})
