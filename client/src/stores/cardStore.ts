import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchCards, fetchCard, editCard, generateImageLayer, type CardTemplate, type EditResponse } from '../services/api'

export interface EditHistoryEntry {
  prompt: string
  imageUrl: string
  message: string
  timestamp: number
}

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

export const useCardStore = defineStore('cards', () => {
  const cards = ref<CardTemplate[]>([])
  const currentCard = ref<CardTemplate | null>(null)
  const currentImageUrl = ref<string>('')
  const editHistory = ref<EditHistoryEntry[]>([])
  const textOverlays = ref<TextOverlayData[]>([])
  const selectedOverlayId = ref<string | null>(null)
  const imageLayers = ref<ImageLayerData[]>([])
  const selectedLayerId = ref<string | null>(null)
  const isLoading = ref(false)
  const isEditing = ref(false)
  const isGeneratingLayer = ref(false)
  const error = ref<string | null>(null)

  async function loadCards() {
    isLoading.value = true
    error.value = null
    try {
      cards.value = await fetchCards()
    } catch (err) {
      error.value = 'Failed to load cards'
    } finally {
      isLoading.value = false
    }
  }

  async function loadCard(id: string) {
    isLoading.value = true
    error.value = null
    try {
      currentCard.value = await fetchCard(id)
      currentImageUrl.value = currentCard.value.imageUrl || currentCard.value.thumbnailUrl
      editHistory.value = []
    } catch (err) {
      error.value = 'Failed to load card'
    } finally {
      isLoading.value = false
    }
  }

  async function applyEdit(prompt: string, selectedColor?: string, colorContext?: string): Promise<EditResponse> {
    if (!currentCard.value) throw new Error('No card selected')

    isEditing.value = true
    error.value = null

    try {
      const result = await editCard(
        currentCard.value.id,
        currentImageUrl.value,
        prompt,
        selectedColor,
        colorContext
      )

      if (result.success && result.editedImageUrl) {
        editHistory.value.push({
          prompt,
          imageUrl: currentImageUrl.value,
          message: result.message,
          timestamp: Date.now(),
        })
        currentImageUrl.value = result.editedImageUrl
      }

      return result
    } catch (err) {
      error.value = 'Failed to edit card'
      throw err
    } finally {
      isEditing.value = false
    }
  }

  function resetToOriginal() {
    if (currentCard.value) {
      currentImageUrl.value = currentCard.value.imageUrl || currentCard.value.thumbnailUrl
      editHistory.value = []
      textOverlays.value = []
      selectedOverlayId.value = null
      imageLayers.value = []
      selectedLayerId.value = null
    }
  }

  function revertToStep(index: number) {
    if (index >= 0 && index < editHistory.value.length) {
      currentImageUrl.value = editHistory.value[index].imageUrl
      editHistory.value = editHistory.value.slice(0, index)
    }
  }

  function addTextOverlay() {
    const newOverlay: TextOverlayData = {
      id: `overlay-${Date.now()}`,
      text: 'Nieuwe tekst',
      x: 50,
      y: 50,
      fontSize: 48,
      fontFamily: 'Pacifico',
      fontWeight: '400',
      fontStyle: 'normal',
      color: '#000000',
      rotation: 0,
    }
    textOverlays.value.push(newOverlay)
    selectedOverlayId.value = newOverlay.id
  }

  function updateTextOverlay(id: string, updates: Partial<TextOverlayData>) {
    const overlay = textOverlays.value.find(o => o.id === id)
    if (overlay) {
      Object.assign(overlay, updates)
    }
  }

  function deleteTextOverlay(id: string) {
    const index = textOverlays.value.findIndex(o => o.id === id)
    if (index !== -1) {
      textOverlays.value.splice(index, 1)
      if (selectedOverlayId.value === id) {
        selectedOverlayId.value = textOverlays.value[0]?.id || null
      }
    }
  }

  function selectTextOverlay(id: string | null) {
    selectedOverlayId.value = id
    if (id) selectedLayerId.value = null
  }

  async function requestImageLayer(prompt: string): Promise<void> {
    if (!currentCard.value) throw new Error('No card selected')
    if (imageLayers.value.length >= 5) throw new Error('Maximum 5 layers allowed')

    isGeneratingLayer.value = true
    error.value = null

    try {
      const result = await generateImageLayer(
        currentCard.value.id,
        prompt,
        currentImageUrl.value
      )

      if (result.success && result.layerImageUrl) {
        const newLayer: ImageLayerData = {
          id: `layer-${Date.now()}`,
          imageUrl: result.layerImageUrl,
          x: 50,
          y: 50,
          width: 20,
          height: 20,
          rotation: 0,
          aspectRatio: 1,
          prompt: result.prompt || prompt,
          flipX: false,
          flipY: false,
        }
        imageLayers.value.push(newLayer)
        selectedLayerId.value = newLayer.id
        selectedOverlayId.value = null
      }
    } catch (err) {
      error.value = 'Failed to generate layer'
      throw err
    } finally {
      isGeneratingLayer.value = false
    }
  }

  async function editImageLayer(id: string, newPrompt: string): Promise<void> {
    if (!currentCard.value) throw new Error('No card selected')
    const layer = imageLayers.value.find(l => l.id === id)
    if (!layer) throw new Error('Layer not found')

    isGeneratingLayer.value = true
    error.value = null

    try {
      const result = await generateImageLayer(
        currentCard.value.id,
        newPrompt,
        currentImageUrl.value
      )

      if (result.success && result.layerImageUrl) {
        // Update the existing layer with new image and prompt
        layer.imageUrl = result.layerImageUrl
        layer.prompt = result.prompt || newPrompt
        // Keep position, size, and rotation
      }
    } catch (err) {
      error.value = 'Failed to edit layer'
      throw err
    } finally {
      isGeneratingLayer.value = false
    }
  }

  function updateImageLayer(id: string, updates: Partial<ImageLayerData>) {
    const layer = imageLayers.value.find(l => l.id === id)
    if (layer) {
      Object.assign(layer, updates)
    }
  }

  function deleteImageLayer(id: string) {
    const index = imageLayers.value.findIndex(l => l.id === id)
    if (index !== -1) {
      imageLayers.value.splice(index, 1)
      if (selectedLayerId.value === id) {
        selectedLayerId.value = imageLayers.value[0]?.id || null
      }
    }
  }

  function selectImageLayer(id: string | null) {
    selectedLayerId.value = id
    if (id) selectedOverlayId.value = null
  }

  return {
    cards,
    currentCard,
    currentImageUrl,
    editHistory,
    textOverlays,
    selectedOverlayId,
    imageLayers,
    selectedLayerId,
    isLoading,
    isEditing,
    isGeneratingLayer,
    error,
    loadCards,
    loadCard,
    applyEdit,
    resetToOriginal,
    revertToStep,
    addTextOverlay,
    updateTextOverlay,
    deleteTextOverlay,
    selectTextOverlay,
    requestImageLayer,
    editImageLayer,
    updateImageLayer,
    deleteImageLayer,
    selectImageLayer,
  }
})
