<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCardStore } from '../stores/cardStore'
import CardEditor from '../components/CardEditor.vue'
import EditorSidebar from '../components/EditorSidebar.vue'
import ColorEditDialog from '../components/ColorEditDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useCardStore()
const feedbackMessage = ref<string | null>(null)
const feedbackType = ref<'success' | 'error' | 'info'>('info')
const cardEditorRef = ref<{ generateDownloadImage: () => Promise<Blob> } | null>(null)

// Color dialog state
const showColorDialog = ref(false)
const pendingColorPrompt = ref<string>('')
const colorDialogContext = ref<string>('')
const colorDialogSuggestions = ref<string[]>([])
const colorDialogMessage = ref<string>('')

const cardId = computed(() => route.params.id as string)

onMounted(() => {
  store.loadCard(cardId.value)
})

async function handleEdit(prompt: string) {
  feedbackMessage.value = null
  try {
    const result = await store.applyEdit(prompt)

    // Check if Claude needs color clarification
    if (result.requiresColorInput && result.colorContext) {
      pendingColorPrompt.value = result.originalPrompt || prompt
      colorDialogContext.value = result.colorContext
      colorDialogSuggestions.value = result.suggestedColors || []
      colorDialogMessage.value = result.message
      showColorDialog.value = true
      return
    }

    feedbackMessage.value = result.message
    feedbackType.value = result.success ? 'success' : 'info'
  } catch (err) {
    feedbackMessage.value = err instanceof Error ? err.message : 'Er ging iets mis.'
    feedbackType.value = 'error'
  }
}

async function handleColorConfirm(color: string) {
  showColorDialog.value = false
  feedbackMessage.value = null
  try {
    const result = await store.applyEdit(
      pendingColorPrompt.value,
      color,
      colorDialogContext.value
    )
    feedbackMessage.value = result.message
    feedbackType.value = result.success ? 'success' : 'info'
  } catch (err) {
    feedbackMessage.value = err instanceof Error ? err.message : 'Er ging iets mis.'
    feedbackType.value = 'error'
  }
}

function handleColorCancel() {
  showColorDialog.value = false
  feedbackMessage.value = 'Kleurkeuze geannuleerd. Probeer het opnieuw met een specifieke kleur.'
  feedbackType.value = 'info'
}

function handleReset() {
  store.resetToOriginal()
  feedbackMessage.value = 'Kaartje is gereset naar het origineel.'
  feedbackType.value = 'info'
}

function handleRevert(index: number) {
  store.revertToStep(index)
  feedbackMessage.value = `Teruggekeerd naar stap ${index + 1}.`
  feedbackType.value = 'info'
}

async function handleDownload() {
  try {
    if (!cardEditorRef.value) throw new Error('Editor not ready')
    const blob = await cardEditorRef.value.generateDownloadImage()
    const filename = `${store.currentCard?.name || 'kaartje'}-bewerkt.png`
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    feedbackMessage.value = 'Kaartje gedownload!'
    feedbackType.value = 'success'
  } catch (err) {
    feedbackMessage.value = err instanceof Error ? err.message : 'Download mislukt'
    feedbackType.value = 'error'
  }
}

</script>

<template>
  <div class="max-w-6xl mx-auto px-6 py-8">
    <!-- Back button -->
    <button
      @click="router.push('/')"
      class="flex items-center gap-2 text-sam-text-light hover:text-sam-green transition-colors mb-6"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      <span class="text-sm">Terug naar collectie</span>
    </button>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-20">
      <div class="w-8 h-8 border-3 border-sam-green border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="text-center py-20 text-sam-warm-gray">
      <p class="text-lg mb-4">{{ store.error }}</p>
      <button
        @click="store.loadCard(cardId)"
        class="px-6 py-2 bg-sam-green text-white rounded hover:bg-sam-green-dark transition-colors"
      >
        Opnieuw proberen
      </button>
    </div>

    <!-- Editor -->
    <template v-else-if="store.currentCard">
      <div class="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <!-- Canvas area -->
        <CardEditor
          ref="cardEditorRef"
          :original-image-url="store.currentCard.imageUrl || store.currentCard.thumbnailUrl"
          :current-image-url="store.currentImageUrl"
          :card-name="store.currentCard.name"
          :is-editing="store.isEditing"
          :text-overlays="store.textOverlays"
          :image-layers="store.imageLayers"
          :selected-layer-id="store.selectedLayerId"
          :selected-overlay-id="store.selectedOverlayId"
          @reset="handleReset"
          @download="handleDownload"
          @update-overlay="store.updateTextOverlay"
          @select-overlay="store.selectTextOverlay"
          @update-layer="store.updateImageLayer"
          @select-layer="store.selectImageLayer"
        />

        <!-- Unified sidebar -->
        <EditorSidebar
          :is-editing="store.isEditing"
          :suggestions="store.currentCard?.suggestions"
          :feedback-message="feedbackMessage"
          :feedback-type="feedbackType"
          :text-overlays="store.textOverlays"
          :selected-overlay-id="store.selectedOverlayId"
          :image-layers="store.imageLayers"
          :selected-layer-id="store.selectedLayerId"
          :is-generating-layer="store.isGeneratingLayer"
          :max-layers="5"
          :edit-history="store.editHistory"
          :card-name="store.currentCard.name"
          :card-tags="store.currentCard.tags || []"
          :card-colors="store.currentCard.colors || []"
          @submit-prompt="handleEdit"
          @add-overlay="store.addTextOverlay"
          @update-overlay="store.updateTextOverlay"
          @delete-overlay="store.deleteTextOverlay"
          @select-overlay="store.selectTextOverlay"
          @generate-layer="store.requestImageLayer"
          @edit-layer="store.editImageLayer"
          @update-layer="store.updateImageLayer"
          @delete-layer="store.deleteImageLayer"
          @select-layer="store.selectImageLayer"
          @revert="handleRevert"
        />
      </div>
    </template>
    <!-- Color Edit Dialog -->
    <ColorEditDialog
      :visible="showColorDialog"
      :color-context="colorDialogContext"
      :suggested-colors="colorDialogSuggestions"
      :card-colors="store.currentCard?.colors || []"
      :message="colorDialogMessage"
      @confirm="handleColorConfirm"
      @cancel="handleColorCancel"
    />
  </div>
</template>
