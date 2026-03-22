<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCardStore } from '../stores/cardStore'
import CardEditor from '../components/CardEditor.vue'
import PromptInput from '../components/PromptInput.vue'
import EditHistory from '../components/EditHistory.vue'

const route = useRoute()
const router = useRouter()
const store = useCardStore()
const feedbackMessage = ref<string | null>(null)
const feedbackType = ref<'success' | 'error' | 'info'>('info')

const cardId = computed(() => route.params.id as string)

onMounted(() => {
  store.loadCard(cardId.value)
})

async function handleEdit(prompt: string) {
  feedbackMessage.value = null
  try {
    const result = await store.applyEdit(prompt)
    feedbackMessage.value = result.message
    feedbackType.value = result.success ? 'success' : 'info'
  } catch (err) {
    feedbackMessage.value = err instanceof Error ? err.message : 'Er ging iets mis.'
    feedbackType.value = 'error'
  }
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

function handleDownload() {
  const link = document.createElement('a')
  link.href = store.currentImageUrl
  link.download = `${store.currentCard?.name || 'kaartje'}-bewerkt.png`
  link.click()
}

const feedbackClasses = computed(() => {
  switch (feedbackType.value) {
    case 'success': return 'bg-green-50 text-green-800 border-green-200'
    case 'error': return 'bg-red-50 text-red-800 border-red-200'
    default: return 'bg-blue-50 text-blue-800 border-blue-200'
  }
})
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
      <div class="grid lg:grid-cols-[1fr_280px] gap-6">
        <div class="space-y-6">
          <!-- Card Editor (original vs edited) -->
          <CardEditor
            :original-image-url="store.currentCard.imageUrl || store.currentCard.thumbnailUrl"
            :current-image-url="store.currentImageUrl"
            :card-name="store.currentCard.name"
            :is-editing="store.isEditing"
            @reset="handleReset"
            @download="handleDownload"
          />

          <!-- Feedback message -->
          <div
            v-if="feedbackMessage"
            :class="['px-4 py-3 rounded-lg border text-sm', feedbackClasses]"
          >
            {{ feedbackMessage }}
          </div>

          <!-- Prompt input -->
          <PromptInput
            :disabled="store.isEditing"
            @submit="handleEdit"
          />
        </div>

        <!-- Sidebar: Edit History -->
        <div class="space-y-4">
          <EditHistory
            :history="store.editHistory"
            @revert="handleRevert"
          />

          <!-- Card info -->
          <div class="bg-white rounded-xl shadow-sm border border-sam-taupe-light p-4">
            <h3 class="font-heading text-lg text-sam-text mb-3">Kaartje info</h3>
            <dl class="space-y-2 text-sm">
              <div>
                <dt class="text-sam-warm-gray">Naam</dt>
                <dd class="text-sam-text font-medium">{{ store.currentCard.name }}</dd>
              </div>
              <div>
                <dt class="text-sam-warm-gray">Baby naam</dt>
                <dd class="text-sam-text font-medium">{{ store.currentCard.babyName }}</dd>
              </div>
              <div>
                <dt class="text-sam-warm-gray">Stijl</dt>
                <dd class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="tag in store.currentCard.tags"
                    :key="tag"
                    class="text-xs px-2 py-0.5 rounded-full bg-sam-taupe-light text-sam-brown"
                  >
                    {{ tag }}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-sam-warm-gray">Kleuren</dt>
                <dd class="flex flex-wrap gap-1 mt-1">
                  <span
                    v-for="color in store.currentCard.colors"
                    :key="color"
                    class="text-xs px-2 py-0.5 rounded-full bg-sam-cream text-sam-text-light"
                  >
                    {{ color }}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
