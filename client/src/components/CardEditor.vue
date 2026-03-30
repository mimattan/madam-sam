<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

export interface TextOverlayData {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  fontWeight: string
  fontStyle: string
  color: string
  rotation: number
}

export interface ImageLayerData {
  id: string
  imageUrl: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  aspectRatio: number
  prompt: string
  flipX: boolean
  flipY: boolean
}

const props = defineProps<{
  originalImageUrl: string
  currentImageUrl: string
  cardName: string
  isEditing: boolean
  textOverlays?: TextOverlayData[]
  imageLayers?: ImageLayerData[]
  selectedLayerId?: string | null
  selectedOverlayId?: string | null
}>()

const emit = defineEmits<{
  reset: []
  download: []
  order: []
  updateOverlay: [id: string, updates: Partial<TextOverlayData>]
  selectOverlay: [id: string]
  updateLayer: [id: string, updates: Partial<ImageLayerData>]
  selectLayer: [id: string | null]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const draggingOverlayId = ref<string | null>(null)
const draggingLayerId = ref<string | null>(null)
const rotatingOverlayId = ref<string | null>(null)
const dragOffset = ref({ x: 0, y: 0 })
const resizingLayerId = ref<string | null>(null)
const resizeCorner = ref<string | null>(null)
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })
const showOriginal = ref(false)

// Cache for loaded layer images
const layerImageCache = new Map<string, HTMLImageElement>()

function getOrLoadLayerImage(url: string): HTMLImageElement | null {
  if (layerImageCache.has(url)) {
    const img = layerImageCache.get(url)!
    return img.complete ? img : null
  }
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = url
  img.onload = () => { nextTick(renderOverlays) }
  layerImageCache.set(url, img)
  return null
}

function renderOverlays() {
  if (!canvasRef.value || !imageRef.value) return

  const hasText = props.textOverlays && props.textOverlays.length > 0
  const hasLayers = props.imageLayers && props.imageLayers.length > 0
  if (!hasText && !hasLayers) {
    // Clear canvas if nothing to render
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    return
  }
  
  const canvas = canvasRef.value
  const img = imageRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  if (!img.complete || img.naturalWidth === 0) return

  // Set canvas to match the DISPLAYED image size, not natural size
  // This prevents scaling mismatches when the window is resized
  const displayWidth = img.clientWidth
  const displayHeight = img.clientHeight
  
  canvas.width = displayWidth
  canvas.height = displayHeight
  canvas.style.width = `${displayWidth}px`
  canvas.style.height = `${displayHeight}px`

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Calculate scale factor from natural to display size
  const scale = displayWidth / img.naturalWidth

  // 1. Draw image layers (below text overlays)
  props.imageLayers?.forEach((layer) => {
    const layerImg = getOrLoadLayerImage(layer.imageUrl)
    if (!layerImg) return

    const x = (layer.x / 100) * img.naturalWidth * scale
    const y = (layer.y / 100) * img.naturalHeight * scale
    const w = (layer.width / 100) * img.naturalWidth * scale
    const h = (layer.height / 100) * img.naturalHeight * scale
    const rotation = (layer.rotation || 0) * Math.PI / 180

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)
    
    // Apply flip transformations
    const scaleX = layer.flipX ? -1 : 1
    const scaleY = layer.flipY ? -1 : 1
    ctx.scale(scaleX, scaleY)
    
    ctx.drawImage(layerImg, -w / 2, -h / 2, w, h)
    ctx.restore()

    // Draw selection handles for selected layer
    if (layer.id === props.selectedLayerId) {
      drawLayerHandles(ctx, x, y, w, h, rotation, scale)
    }
  })

  // 2. Render text overlays (on top)
  props.textOverlays?.forEach((overlay) => {
    const x = (overlay.x / 100) * img.naturalWidth * scale
    const y = (overlay.y / 100) * img.naturalHeight * scale
    const rotation = (overlay.rotation || 0) * Math.PI / 180

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)

    // Scale font size to match display
    const scaledFontSize = overlay.fontSize * scale
    ctx.font = `${overlay.fontStyle} ${overlay.fontWeight} ${scaledFontSize}px ${overlay.fontFamily}`
    ctx.fillStyle = overlay.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 4 * scale
    ctx.shadowOffsetX = 2 * scale
    ctx.shadowOffsetY = 2 * scale

    ctx.fillText(overlay.text, 0, 0)
    ctx.restore()

    // Draw rotation handle for selected text overlay
    if (overlay.id === props.selectedOverlayId) {
      const metrics = ctx.measureText(overlay.text)
      const textWidth = metrics.width
      drawTextRotationHandle(ctx, x, y, textWidth, rotation, scale)
    }
  })
}

function drawTextRotationHandle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  textWidth: number,
  rotation: number,
  scale: number
) {
  const rotHandleY = -30 * scale

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rotation)

  // Rotation handle (above text)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, rotHandleY)
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2 * scale
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, rotHandleY, 6 * scale, 0, Math.PI * 2)
  ctx.fillStyle = '#3b82f6'
  ctx.fill()

  ctx.restore()
}

function hitTestTextRotationHandle(clickX: number, clickY: number, overlay: TextOverlayData, scale: number): boolean {
  const img = imageRef.value!
  const x = (overlay.x / 100) * img.naturalWidth * scale
  const y = (overlay.y / 100) * img.naturalHeight * scale
  const rotation = (overlay.rotation || 0) * Math.PI / 180
  const rotHandleY = -30 * scale

  // Inverse rotate click coords around text origin
  const dx = clickX - x
  const dy = clickY - y
  const cosR = Math.cos(-rotation)
  const sinR = Math.sin(-rotation)
  const localX = dx * cosR - dy * sinR
  const localY = dx * sinR + dy * cosR

  // Check if click is on rotation handle
  return Math.abs(localX) < 10 * scale && Math.abs(localY - rotHandleY) < 10 * scale
}

function drawLayerHandles(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  w: number, h: number,
  rotation: number,
  scale: number = 1
) {
  const handleSize = 10 * scale
  const halfW = w / 2
  const halfH = h / 2

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rotation)

  // Selection border
  ctx.strokeStyle = '#22c55e'
  ctx.lineWidth = 2 * scale
  ctx.setLineDash([6 * scale, 4 * scale])
  ctx.strokeRect(-halfW, -halfH, w, h)
  ctx.setLineDash([])

  // Corner handles
  const corners = [
    { x: -halfW, y: -halfH },
    { x: halfW, y: -halfH },
    { x: -halfW, y: halfH },
    { x: halfW, y: halfH },
  ]
  corners.forEach(({ x, y }) => {
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2 * scale
    ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize)
    ctx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize)
  })

  // Rotation handle (above top center)
  const rotHandleY = -halfH - 30 * scale
  ctx.beginPath()
  ctx.moveTo(0, -halfH)
  ctx.lineTo(0, rotHandleY)
  ctx.strokeStyle = '#22c55e'
  ctx.lineWidth = 2 * scale
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, rotHandleY, 6 * scale, 0, Math.PI * 2)
  ctx.fillStyle = '#22c55e'
  ctx.fill()

  ctx.restore()
}

function canvasClickToDisplay(event: MouseEvent): { clickX: number, clickY: number } | null {
  if (!canvasRef.value) return null
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  
  // Canvas now matches display size, so coordinates are simple
  return {
    clickX: event.clientX - rect.left,
    clickY: event.clientY - rect.top,
  }
}

function hitTestLayer(clickX: number, clickY: number, layer: ImageLayerData, scale: number): string | null {
  const img = imageRef.value!
  const x = (layer.x / 100) * img.naturalWidth * scale
  const y = (layer.y / 100) * img.naturalHeight * scale
  const w = (layer.width / 100) * img.naturalWidth * scale
  const h = (layer.height / 100) * img.naturalHeight * scale
  const rotation = (layer.rotation || 0) * Math.PI / 180

  // Inverse rotate click coords around layer center
  const dx = clickX - x
  const dy = clickY - y
  const cosR = Math.cos(-rotation)
  const sinR = Math.sin(-rotation)
  const localX = dx * cosR - dy * sinR
  const localY = dx * sinR + dy * cosR
  const halfW = w / 2
  const halfH = h / 2
  const handleSize = 14 * scale

  // Check rotation handle (above top center)
  const rotHandleY = -halfH - 30 * scale
  if (Math.abs(localX) < 10 * scale && Math.abs(localY - rotHandleY) < 10 * scale) {
    return 'rotate'
  }

  // Check corner handles
  const corners = [
    { name: 'tl', x: -halfW, y: -halfH },
    { name: 'tr', x: halfW, y: -halfH },
    { name: 'bl', x: -halfW, y: halfH },
    { name: 'br', x: halfW, y: halfH },
  ]
  for (const corner of corners) {
    if (Math.abs(localX - corner.x) < handleSize && Math.abs(localY - corner.y) < handleSize) {
      return corner.name
    }
  }

  // Check body
  if (localX >= -halfW && localX <= halfW && localY >= -halfH && localY <= halfH) {
    return 'body'
  }

  return null
}

function handleCanvasMouseDown(event: MouseEvent) {
  if (!canvasRef.value || !imageRef.value) return
  const coords = canvasClickToDisplay(event)
  if (!coords) return
  const { clickX, clickY } = coords
  const img = imageRef.value
  const canvas = canvasRef.value
  const scale = canvas.width / img.naturalWidth

  // 1. Check text overlays first (they render on top)
  if (props.textOverlays?.length) {
    // First check rotation handle on selected text overlay
    if (props.selectedOverlayId) {
      const selectedOverlay = props.textOverlays.find(o => o.id === props.selectedOverlayId)
      if (selectedOverlay && hitTestTextRotationHandle(clickX, clickY, selectedOverlay, scale)) {
        rotatingOverlayId.value = selectedOverlay.id
        draggingOverlayId.value = null
        draggingLayerId.value = null
        resizingLayerId.value = null
        event.preventDefault()
        return
      }
    }

    // Then check text body
    for (let i = props.textOverlays.length - 1; i >= 0; i--) {
      const overlay = props.textOverlays[i]
      const x = (overlay.x / 100) * img.naturalWidth * scale
      const y = (overlay.y / 100) * img.naturalHeight * scale

      const ctx = canvas.getContext('2d')
      if (!ctx) continue

      const scaledFontSize = overlay.fontSize * scale
      ctx.font = `${overlay.fontStyle} ${overlay.fontWeight} ${scaledFontSize}px ${overlay.fontFamily}`
      const metrics = ctx.measureText(overlay.text)
      const textWidth = metrics.width
      const textHeight = scaledFontSize

      const rotation = (overlay.rotation || 0) * Math.PI / 180
      const dx = clickX - x
      const dy = clickY - y
      const cosR = Math.cos(-rotation)
      const sinR = Math.sin(-rotation)
      const localX = dx * cosR - dy * sinR
      const localY = dx * sinR + dy * cosR

      const padding = 10 * scale
      if (
        localX >= -textWidth / 2 - padding &&
        localX <= textWidth / 2 + padding &&
        localY >= -padding &&
        localY <= textHeight + padding
      ) {
        draggingOverlayId.value = overlay.id
        rotatingOverlayId.value = null
        draggingLayerId.value = null
        resizingLayerId.value = null
        dragOffset.value = { x: clickX - x, y: clickY - y }
        emit('selectOverlay', overlay.id)
        emit('selectLayer', null)
        event.preventDefault()
        return
      }
    }
  }

  // 2. Check image layers (selected layer handles first, then bodies)
  if (props.imageLayers?.length) {
    // First pass: check handles on the selected layer
    if (props.selectedLayerId) {
      const selectedLayer = props.imageLayers.find(l => l.id === props.selectedLayerId)
      if (selectedLayer) {
        const hit = hitTestLayer(clickX, clickY, selectedLayer, scale)
        if (hit === 'rotate') {
          // Start rotation
          draggingLayerId.value = selectedLayer.id
          resizingLayerId.value = null
          resizeCorner.value = 'rotate'
          event.preventDefault()
          return
        }
        if (hit && hit !== 'body') {
          // Start resize
          resizingLayerId.value = selectedLayer.id
          resizeCorner.value = hit
          draggingLayerId.value = null
          resizeStart.value = {
            x: clickX, y: clickY,
            width: selectedLayer.width, height: selectedLayer.height
          }
          event.preventDefault()
          return
        }
      }
    }

    // Second pass: check body of all layers
    for (let i = props.imageLayers.length - 1; i >= 0; i--) {
      const layer = props.imageLayers[i]
      const hit = hitTestLayer(clickX, clickY, layer, scale)
      if (hit === 'body') {
        draggingLayerId.value = layer.id
        resizingLayerId.value = null
        const lx = (layer.x / 100) * img.naturalWidth * scale
        const ly = (layer.y / 100) * img.naturalHeight * scale
        dragOffset.value = { x: clickX - lx, y: clickY - ly }
        emit('selectLayer', layer.id)
        event.preventDefault()
        return
      }
    }
  }

  // Click on empty space — deselect layer
  emit('selectLayer', null)
}

function handleCanvasMouseMove(event: MouseEvent) {
  const coords = canvasClickToDisplay(event)
  if (!coords || !imageRef.value || !canvasRef.value) return
  const { clickX: mouseX, clickY: mouseY } = coords
  const img = imageRef.value
  const scale = canvasRef.value.width / img.naturalWidth

  // Handle text overlay rotation
  if (rotatingOverlayId.value) {
    const overlay = props.textOverlays?.find(o => o.id === rotatingOverlayId.value)
    if (!overlay) return
    const cx = (overlay.x / 100) * img.naturalWidth * scale
    const cy = (overlay.y / 100) * img.naturalHeight * scale
    const angle = Math.atan2(mouseX - cx, -(mouseY - cy)) * (180 / Math.PI)
    const snapped = Math.round(((angle % 360) + 360) % 360)
    emit('updateOverlay', rotatingOverlayId.value, { rotation: snapped })
    return
  }

  // Handle text overlay dragging
  if (draggingOverlayId.value) {
    const newX = ((mouseX - dragOffset.value.x) / (img.naturalWidth * scale)) * 100
    const newY = ((mouseY - dragOffset.value.y) / (img.naturalHeight * scale)) * 100
    const clampedX = Math.max(0, Math.min(100, newX))
    const clampedY = Math.max(0, Math.min(100, newY))
    emit('updateOverlay', draggingOverlayId.value, { x: clampedX, y: clampedY })
    return
  }

  // Handle image layer rotation
  if (draggingLayerId.value && resizeCorner.value === 'rotate') {
    const layer = props.imageLayers?.find(l => l.id === draggingLayerId.value)
    if (!layer) return
    const cx = (layer.x / 100) * img.naturalWidth * scale
    const cy = (layer.y / 100) * img.naturalHeight * scale
    const angle = Math.atan2(mouseX - cx, -(mouseY - cy)) * (180 / Math.PI)
    const snapped = Math.round(((angle % 360) + 360) % 360)
    emit('updateLayer', draggingLayerId.value, { rotation: snapped })
    return
  }

  // Handle image layer resize
  if (resizingLayerId.value && resizeCorner.value) {
    const layer = props.imageLayers?.find(l => l.id === resizingLayerId.value)
    if (!layer) return
    
    // Calculate distance from layer center to mouse (current vs start)
    const cx = (layer.x / 100) * img.naturalWidth * scale
    const cy = (layer.y / 100) * img.naturalHeight * scale
    const startDist = Math.sqrt(
      Math.pow(resizeStart.value.x - cx, 2) + 
      Math.pow(resizeStart.value.y - cy, 2)
    )
    const currentDist = Math.sqrt(
      Math.pow(mouseX - cx, 2) + 
      Math.pow(mouseY - cy, 2)
    )
    
    // Dragging away from center = larger, dragging toward center = smaller
    const distChange = currentDist - startDist
    const deltaPercent = (distChange / (img.naturalWidth * scale)) * 100
    let newWidth = Math.max(5, Math.min(80, resizeStart.value.width + deltaPercent))
    let newHeight = newWidth / layer.aspectRatio
    emit('updateLayer', resizingLayerId.value, { width: newWidth, height: newHeight })
    return
  }

  // Handle image layer dragging
  if (draggingLayerId.value) {
    const newX = ((mouseX - dragOffset.value.x) / (img.naturalWidth * scale)) * 100
    const newY = ((mouseY - dragOffset.value.y) / (img.naturalHeight * scale)) * 100
    const clampedX = Math.max(0, Math.min(100, newX))
    const clampedY = Math.max(0, Math.min(100, newY))
    emit('updateLayer', draggingLayerId.value, { x: clampedX, y: clampedY })
    return
  }
}

function handleCanvasMouseUp() {
  draggingOverlayId.value = null
  draggingLayerId.value = null
  rotatingOverlayId.value = null
  resizingLayerId.value = null
  resizeCorner.value = null
}

async function generateDownloadImage(): Promise<Blob> {
  if (!imageRef.value) throw new Error('Image not loaded')

  const img = imageRef.value
  if (!img.complete || img.naturalWidth === 0) throw new Error('Image not ready')

  // Ensure all fonts used in overlays are fully loaded before drawing
  if (props.textOverlays?.length) {
    await Promise.all(
      props.textOverlays.map((overlay) =>
        document.fonts.load(
          `${overlay.fontStyle} ${overlay.fontWeight} ${overlay.fontSize}px "${overlay.fontFamily}"`
        )
      )
    )
  }

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2D context')

  // Draw the base image at full natural resolution
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight)

  // Draw image layers first (below text)
  if (props.imageLayers?.length) {
    for (const layer of props.imageLayers) {
      const layerImg = getOrLoadLayerImage(layer.imageUrl)
      if (!layerImg || !layerImg.complete) continue

      const lx = (layer.x / 100) * canvas.width
      const ly = (layer.y / 100) * canvas.height
      const lw = (layer.width / 100) * canvas.width
      const lh = (layer.height / 100) * canvas.height
      const lr = (layer.rotation || 0) * Math.PI / 180

      ctx.save()
      ctx.translate(lx, ly)
      ctx.rotate(lr)
      
      // Apply flip transformations
      const scaleX = layer.flipX ? -1 : 1
      const scaleY = layer.flipY ? -1 : 1
      ctx.scale(scaleX, scaleY)
      
      ctx.drawImage(layerImg, -lw / 2, -lh / 2, lw, lh)
      ctx.restore()
    }
  }

  // Draw each text overlay using browser fonts (identical to preview rendering)
  props.textOverlays?.forEach((overlay) => {
    const x = (overlay.x / 100) * canvas.width
    const y = (overlay.y / 100) * canvas.height
    const rotation = (overlay.rotation || 0) * Math.PI / 180

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)

    ctx.font = `${overlay.fontStyle} ${overlay.fontWeight} ${overlay.fontSize}px ${overlay.fontFamily}`
    ctx.fillStyle = overlay.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    ctx.fillText(overlay.text, 0, 0)

    ctx.restore()
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to generate image blob'))),
      'image/png'
    )
  })
}

defineExpose({ generateDownloadImage })

watch(() => props.textOverlays, () => {
  nextTick(renderOverlays)
}, { deep: true })

watch(() => props.imageLayers, () => {
  nextTick(renderOverlays)
}, { deep: true })

watch(() => props.selectedLayerId, () => {
  nextTick(renderOverlays)
})

watch(() => props.selectedOverlayId, () => {
  nextTick(renderOverlays)
})

watch(() => props.currentImageUrl, () => {
  nextTick(renderOverlays)
})

onMounted(() => {
  if (imageRef.value) {
    imageRef.value.addEventListener('load', renderOverlays)
  }
  // Re-render on window resize to maintain correct overlay positions
  window.addEventListener('resize', () => {
    nextTick(renderOverlays)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {
    nextTick(renderOverlays)
  })
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-sam-taupe-light overflow-hidden">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-sam-taupe-light bg-gray-50/50">
      <h2 class="font-heading text-xl text-sam-text">{{ cardName }}</h2>
      <div class="flex gap-2">
        <button
          @click="$emit('reset')"
          class="text-sm px-3 py-1.5 rounded border border-sam-taupe-light text-sam-text-light hover:bg-sam-taupe-light transition-colors"
        >
          Reset
        </button>
        <button
          @click="$emit('download')"
          class="text-sm px-3 py-1.5 rounded bg-sam-green text-white hover:bg-sam-green-dark transition-colors"
        >
          Download
        </button>
        <button
          @click="$emit('order')"
          class="text-sm px-3 py-1.5 rounded bg-sam-taupe text-white hover:bg-sam-taupe-dark transition-colors"
        >
          Bestellen
        </button>
      </div>
    </div>

    <!-- Edited image (full width) -->
    <div class="p-4 relative">
      <div ref="containerRef" class="flex items-center justify-center bg-white rounded-lg relative">
        <div class="relative w-full">
          <img
            ref="imageRef"
            :src="currentImageUrl"
            :alt="`${cardName} - bewerkt`"
            class="w-full max-h-[70vh] object-contain rounded block mx-auto"
          />
          <canvas
            ref="canvasRef"
            class="absolute inset-0 cursor-move rounded pointer-events-auto"
            @mousedown="handleCanvasMouseDown"
            @mousemove="handleCanvasMouseMove"
            @mouseup="handleCanvasMouseUp"
            @mouseleave="handleCanvasMouseUp"
          />
        </div>
        <!-- Loading overlay -->
        <div
          v-if="isEditing"
          class="absolute inset-0 bg-white/80 flex flex-col items-center justify-center rounded-lg"
        >
          <div class="w-10 h-10 border-3 border-sam-green border-t-transparent rounded-full animate-spin mb-3"></div>
          <p class="text-sam-text-light text-sm">AI is aan het werk...</p>
        </div>
      </div>
    </div>

    <!-- Collapsible original thumbnail -->
    <div class="px-4 pb-4">
      <button
        @click="showOriginal = !showOriginal"
        class="flex items-center gap-2 text-xs text-sam-text-light hover:text-sam-green transition-colors"
      >
        <svg
          :class="['w-3.5 h-3.5 transition-transform', showOriginal ? 'rotate-180' : '']"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
        <span>{{ showOriginal ? 'Verberg origineel' : 'Toon origineel' }}</span>
      </button>
      <div
        v-if="showOriginal"
        class="mt-3 flex items-start gap-4"
      >
        <div class="w-2/5 bg-gray-50 rounded-lg p-2 border border-sam-taupe-light">
          <p class="text-xs text-sam-warm-gray uppercase tracking-wider mb-1.5 text-center">Origineel</p>
          <img
            :src="originalImageUrl"
            :alt="`${cardName} - origineel`"
            class="w-full h-auto rounded block"
          />
        </div>
      </div>
    </div>
  </div>
</template>
