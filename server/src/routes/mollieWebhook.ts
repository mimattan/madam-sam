import { Router, Request, Response } from 'express'
import { createMollieClient } from '@mollie/api-client'
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from '../config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ordersDir = path.join(__dirname, '..', '..', 'orders')

export const mollieWebhookRouter = Router()

function findOrderByPaymentId(paymentId: string): { data: any; filePath: string } | null {
  const files = readdirSync(ordersDir).filter(f => f.endsWith('.json'))
  for (const file of files) {
    const filePath = path.join(ordersDir, file)
    try {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'))
      if (data.paymentId === paymentId) {
        return { data, filePath }
      }
    } catch {
      // skip invalid files
    }
  }
  return null
}

// POST /api/webhooks/mollie — Mollie payment status webhook
mollieWebhookRouter.post('/', async (req: Request, res: Response) => {
  const paymentId = req.body?.id

  if (!paymentId) {
    console.error('[Mollie Webhook] No payment ID in request')
    res.status(400).json({ error: 'Missing payment ID' })
    return
  }

  try {
    if (!config.mollieApiKey) {
      throw new Error('MOLLIE_API_KEY not configured')
    }

    const mollieClient = createMollieClient({ apiKey: config.mollieApiKey })
    const payment = await mollieClient.payments.get(paymentId)

    const order = findOrderByPaymentId(paymentId)
    if (!order) {
      console.error(`[Mollie Webhook] No order found for payment ${paymentId}`)
      res.status(200).json({ received: true })
      return
    }

    const previousStatus = order.data.paymentStatus
    order.data.paymentStatus = payment.status
    order.data.updatedAt = new Date().toISOString()

    if (payment.status === 'paid') {
      order.data.status = 'paid'
    } else if (['failed', 'canceled', 'expired'].includes(payment.status)) {
      order.data.status = 'failed'
    }

    writeFileSync(order.filePath, JSON.stringify(order.data, null, 2))
    console.log(`[Mollie Webhook] Order ${order.data.orderNumber}: ${previousStatus} -> ${payment.status}`)

    res.status(200).json({ received: true })
  } catch (err) {
    console.error('[Mollie Webhook] Error processing webhook:', err)
    // Always return 200 to Mollie so it doesn't keep retrying
    res.status(200).json({ received: true })
  }
})
