import { Router, Request, Response } from 'express'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from '../config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const orderImagesDir = path.join(__dirname, '..', '..', 'order-images')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, orderImagesDir)
  },
  filename: (_req, _file, cb) => {
    const filename = `${uuidv4()}.png`
    cb(null, filename)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
      cb(null, true)
    } else {
      cb(new Error('Only PNG and JPEG images are allowed'))
    }
  }
})

export const orderImageRouter = Router()

orderImageRouter.post('/', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file provided' })
    return
  }

  const imageUrl = `${config.orderImageBaseUrl}/api/images/order-images/${req.file.filename}`

  console.log(`[OrderImage] Saved order image: ${req.file.filename} (card: ${req.body.cardId || 'unknown'})`)

  res.json({ imageUrl })
})
