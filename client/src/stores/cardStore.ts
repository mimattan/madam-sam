import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchCards, fetchCard, editCard, type CardTemplate, type EditResponse } from '../services/api'

export interface EditHistoryEntry {
  prompt: string
  imageUrl: string
  message: string
  timestamp: number
}

export const useCardStore = defineStore('cards', () => {
  const cards = ref<CardTemplate[]>([])
  const currentCard = ref<CardTemplate | null>(null)
  const currentImageUrl = ref<string>('')
  const editHistory = ref<EditHistoryEntry[]>([])
  const isLoading = ref(false)
  const isEditing = ref(false)
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

  async function applyEdit(prompt: string): Promise<EditResponse> {
    if (!currentCard.value) throw new Error('No card selected')

    isEditing.value = true
    error.value = null

    try {
      const result = await editCard(
        currentCard.value.id,
        currentImageUrl.value,
        prompt
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
    }
  }

  function revertToStep(index: number) {
    if (index >= 0 && index < editHistory.value.length) {
      currentImageUrl.value = editHistory.value[index].imageUrl
      editHistory.value = editHistory.value.slice(0, index)
    }
  }

  return {
    cards,
    currentCard,
    currentImageUrl,
    editHistory,
    isLoading,
    isEditing,
    error,
    loadCards,
    loadCard,
    applyEdit,
    resetToOriginal,
    revertToStep,
  }
})
