<script setup lang="ts">
import { ref } from 'vue'
import PromptInput from './PromptInput.vue'
import TextOverlay from './TextOverlay.vue'
import ImageLayerPanel from './ImageLayerPanel.vue'
import EditHistory from './EditHistory.vue'
import type { TextOverlayData } from './TextOverlay.vue'
import type { ImageLayerData } from './ImageLayerPanel.vue'
import type { EditHistoryEntry } from '../stores/cardStore'

const props = defineProps<{
  // Prompt
  isEditing: boolean
  suggestions?: Array<{ type: string; label: string; prompt: string }>
  feedbackMessage: string | null
  feedbackType: 'success' | 'error' | 'info'
  // Text overlays
  textOverlays: TextOverlayData[]
  selectedOverlayId: string | null
  // Image layers
  imageLayers: ImageLayerData[]
  selectedLayerId: string | null
  isGeneratingLayer: boolean
  maxLayers: number
  // History
  editHistory: EditHistoryEntry[]
  // Card info
  cardName: string
  cardTags: string[]
  cardColors: string[]
}>()

const emit = defineEmits<{
  // Prompt
  submitPrompt: [prompt: string]
  // Text overlays
  addOverlay: []
  updateOverlay: [id: string, updates: Partial<TextOverlayData>]
  deleteOverlay: [id: string]
  selectOverlay: [id: string | null]
  // Image layers
  generateLayer: [prompt: string]
  editLayer: [id: string, prompt: string]
  updateLayer: [id: string, updates: Partial<ImageLayerData>]
  deleteLayer: [id: string]
  selectLayer: [id: string | null]
  // History
  revert: [index: number]
}>()

type TabId = 'text' | 'images'
const activeTab = ref<TabId>('text')
const historyCollapsed = ref(true)

const tabs: { id: TabId; label: string }[] = [
  { id: 'text', label: 'Tekst' },
  { id: 'images', label: 'Afbeeldingen' },
]

const feedbackClasses: Record<string, string> = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
}
</script>

<template>
  <aside class="h-[calc(100vh-5rem)] sticky top-4 flex flex-col overflow-hidden">
    <!-- AI Prompt Section -->
    <div class="bg-white rounded-xl shadow-sm border border-sam-taupe-light p-4 mb-3 shrink-0">
      <h3 class="font-heading text-base text-sam-text mb-3">AI Aanpassen</h3>

      <!-- Feedback inline -->
      <div
        v-if="feedbackMessage"
        :class="['px-3 py-2 rounded-lg border text-xs mb-3', feedbackClasses[feedbackType]]"
      >
        {{ feedbackMessage }}
      </div>

      <PromptInput
        :disabled="isEditing"
        :suggestions="suggestions"
        @submit="emit('submitPrompt', $event)"
      />
    </div>

    <!-- Tabbed Tools -->
    <div class="bg-white rounded-xl shadow-sm border border-sam-taupe-light flex-1 flex flex-col min-h-0">
      <!-- Tab bar -->
      <div class="flex border-b border-sam-taupe-light shrink-0">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'flex-1 py-2.5 text-sm font-medium transition-colors relative',
            activeTab === tab.id
              ? 'text-sam-green'
              : 'text-sam-text-light hover:text-sam-text'
          ]"
        >
          {{ tab.label }}
          <span
            v-if="activeTab === tab.id"
            class="absolute bottom-0 left-2 right-2 h-0.5 bg-sam-green rounded-full"
          />
        </button>
      </div>

      <!-- Tab content (scrollable) -->
      <div class="flex-1 overflow-y-auto p-3">
        <!-- Text tab -->
        <div v-if="activeTab === 'text'">
          <TextOverlay
            :overlays="textOverlays"
            :selected-overlay-id="selectedOverlayId"
            @add="emit('addOverlay')"
            @update="(id, updates) => emit('updateOverlay', id, updates)"
            @delete="(id) => emit('deleteOverlay', id)"
            @select="(id) => emit('selectOverlay', id)"
          />
        </div>

        <!-- Images tab -->
        <div v-if="activeTab === 'images'">
          <ImageLayerPanel
            :layers="imageLayers"
            :selected-layer-id="selectedLayerId"
            :is-generating="isGeneratingLayer"
            :max-layers="maxLayers"
            @generate="(prompt) => emit('generateLayer', prompt)"
            @edit="(id, prompt) => emit('editLayer', id, prompt)"
            @update="(id, updates) => emit('updateLayer', id, updates)"
            @delete="(id) => emit('deleteLayer', id)"
            @select="(id) => emit('selectLayer', id)"
          />
        </div>
      </div>
    </div>

    <!-- Edit History (collapsible) -->
    <div
      v-if="editHistory.length > 0"
      class="bg-white rounded-xl shadow-sm border border-sam-taupe-light mt-3 shrink-0"
    >
      <button
        @click="historyCollapsed = !historyCollapsed"
        class="w-full flex items-center justify-between px-4 py-2.5 text-sm text-sam-text hover:bg-sam-cream/50 transition-colors rounded-xl"
      >
        <span class="font-heading text-base">Bewerkingen</span>
        <span class="flex items-center gap-2">
          <span class="text-xs text-sam-text-light bg-sam-taupe-light px-2 py-0.5 rounded-full">{{ editHistory.length }}</span>
          <svg
            :class="['w-4 h-4 text-sam-text-light transition-transform', historyCollapsed ? '' : 'rotate-180']"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div v-if="!historyCollapsed" class="px-3 pb-3">
        <EditHistory
          :history="editHistory"
          @revert="(index) => emit('revert', index)"
        />
      </div>
    </div>

    <!-- Card Info (compact footer) -->
    <div class="bg-white rounded-xl shadow-sm border border-sam-taupe-light mt-3 px-4 py-3 shrink-0">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="font-heading text-sm text-sam-text">{{ cardName }}</span>
        <span class="text-sam-text-light">·</span>
        <span
          v-for="tag in cardTags"
          :key="tag"
          class="text-xs px-2 py-0.5 rounded-full bg-sam-taupe-light text-sam-brown"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </aside>
</template>
