<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCardStore } from '../stores/cardStore'
import { saveOrderImage } from '../services/api'
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

async function handleOrder() {
  if (!cardEditorRef.value || !store.currentCard) return

  try {
    feedbackMessage.value = 'Kaartje voorbereiden voor bestelling...'
    feedbackType.value = 'info'

    // 1. Generate the final composite image (reuses existing function)
    const blob = await cardEditorRef.value.generateDownloadImage()

    // 2. Upload to backend for permanent storage
    const { imageUrl } = await saveOrderImage(blob, store.currentCard.id)

    // 3. Add to Shopify cart
    const cart = document.getElementById('madam-sam-cart') as any
    if (cart && cart.addLine) {
      // Try event-based addLine if inside a product context
      // The cart will pick up the product from the closest shopify-context
      await cart.addLine({ customAttributes: [
        { key: 'Customized Image', value: imageUrl },
        { key: 'Card Template', value: store.currentCard.name },
        { key: '_card_id', value: store.currentCard.id }
      ]})
      cart.showModal()
      feedbackMessage.value = 'Toegevoegd aan winkelwagen!'
      feedbackType.value = 'success'
    } else {
      // Fallback: open cart dialog with info
      feedbackMessage.value = 'Winkelwagen niet beschikbaar. Configureer eerst je Shopify-integratie.'
      feedbackType.value = 'error'
    }
  } catch (err) {
    feedbackMessage.value = err instanceof Error ? err.message : 'Bestelling voorbereiden mislukt'
    feedbackType.value = 'error'
  }
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
          @order="handleOrder"
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

      <!-- Order Section (Shopify Integration) -->
      <div v-if="store.currentCard?.shopifyHandle" class="mt-6">
        <shopify-context type="product" :handle="store.currentCard.shopifyHandle">
          <template>
            <div class="bg-white rounded-xl shadow-sm border border-sam-taupe-light p-6">
              <h3 class="font-heading text-xl text-sam-text mb-4">Bestel jouw kaartje</h3>
              <p class="text-sam-text-light text-sm mb-4">
                Kies het aantal kaartjes dat je wilt bestellen. Elke bestelling wordt gedrukt op ecologisch papier.
              </p>

              <!-- Variant selector (quantity picker: 25/50/75/100 stuks) -->
              <div class="mb-4">
                <shopify-variant-selector></shopify-variant-selector>
              </div>

              <!-- Price display -->
              <p class="text-2xl font-heading font-semibold text-sam-text mb-4">
                <shopify-money></shopify-money>
              </p>

              <!-- Order button -->
              <button
                @click="handleOrder"
                class="w-full py-3 rounded-lg bg-sam-taupe text-white font-medium hover:bg-sam-taupe-dark transition-colors"
              >
                In winkelwagen
              </button>
            </div>
          </template>
        </shopify-context>
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
