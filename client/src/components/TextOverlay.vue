<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { getAvailableFonts, type FontOption } from '../services/api'

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

const props = defineProps<{
  overlays: TextOverlayData[]
  selectedOverlayId: string | null
}>()

const emit = defineEmits<{
  add: []
  update: [id: string, updates: Partial<TextOverlayData>]
  delete: [id: string]
  select: [id: string | null]
}>()

// Dynamic fonts from backend
const availableFonts = ref<FontOption[]>([])
const isLoadingFonts = ref(true)

// Load fonts from backend on component mount
onMounted(async () => {
  try {
    availableFonts.value = await getAvailableFonts()
    console.log('Loaded fonts from backend:', availableFonts.value.length)
  } catch (error) {
    console.error('Failed to load fonts from backend:', error)
  } finally {
    isLoadingFonts.value = false
  }
})

const fontWeights = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
]

const fontStyles = [
  { value: 'normal', label: 'Normal' },
  { value: 'italic', label: 'Italic' },
]

const selectedOverlay = computed(() => 
  props.overlays.find(o => o.id === props.selectedOverlayId)
)

function handleAddText() {
  emit('add')
}

function handleUpdateText(field: keyof TextOverlayData, value: any) {
  if (props.selectedOverlayId) {
    emit('update', props.selectedOverlayId, { [field]: value })
  }
}

function handleDeleteText() {
  if (props.selectedOverlayId) {
    emit('delete', props.selectedOverlayId)
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium text-sm text-sam-text">Tekst toevoegen</h3>
      <button
        @click="handleAddText"
        class="text-xs px-2.5 py-1 rounded bg-sam-green text-white hover:bg-sam-green-dark transition-colors"
      >
        + Tekst
      </button>
    </div>

    <!-- Overlay list -->
    <div v-if="overlays.length > 0" class="space-y-2 mb-4">
      <button
        v-for="overlay in overlays"
        :key="overlay.id"
        @click="emit('select', overlay.id)"
        :class="[
          'w-full text-left px-3 py-2 rounded border transition-colors',
          selectedOverlayId === overlay.id
            ? 'border-sam-green bg-sam-green/5'
            : 'border-sam-taupe-light hover:border-sam-green/50'
        ]"
      >
        <div class="text-sm text-sam-text truncate">
          {{ overlay.text || 'Nieuwe tekst' }}
        </div>
        <div class="text-xs text-sam-text-light mt-1">
          {{ overlay.fontFamily }} · {{ overlay.fontSize }}px
        </div>
      </button>
    </div>

    <!-- Text editor -->
    <div v-if="selectedOverlay" class="space-y-4 pt-4 border-t border-sam-taupe-light">
      <!-- Text input -->
      <div>
        <label class="block text-sm text-sam-text-light mb-1">Tekst</label>
        <textarea
          :value="selectedOverlay.text"
          @input="handleUpdateText('text', ($event.target as HTMLTextAreaElement).value)"
          class="w-full px-3 py-2 border border-sam-taupe-light rounded focus:outline-none focus:border-sam-green resize-none"
          rows="2"
          placeholder="Voer tekst in..."
        />
      </div>

      <!-- Font family -->
      <div>
        <label class="block text-sm text-sam-text-light mb-1">Lettertype</label>
        <select
          :value="selectedOverlay.fontFamily"
          @change="handleUpdateText('fontFamily', ($event.target as HTMLSelectElement).value)"
          class="w-full px-3 py-2 border border-sam-taupe-light rounded focus:outline-none focus:border-sam-green"
          :disabled="isLoadingFonts"
        >
          <option v-if="isLoadingFonts" value="">Loading fonts...</option>
          <option v-for="font in availableFonts" :key="font.value" :value="font.value">
            {{ font.label }}
          </option>
        </select>
      </div>

      <!-- Font size -->
      <div>
        <label class="block text-sm text-sam-text-light mb-1">Grootte: {{ selectedOverlay.fontSize }}px</label>
        <input
          type="range"
          :value="selectedOverlay.fontSize"
          @input="handleUpdateText('fontSize', parseInt(($event.target as HTMLInputElement).value))"
          min="12"
          max="120"
          class="w-full"
        />
      </div>

      <!-- Rotation -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="block text-sm text-sam-text-light">Rotatie: {{ selectedOverlay.rotation || 0 }}°</label>
          <button
            v-if="selectedOverlay.rotation"
            @click="handleUpdateText('rotation', 0)"
            class="text-xs text-sam-text-light hover:text-sam-green transition-colors"
          >
            Reset
          </button>
        </div>
        <input
          type="range"
          :value="selectedOverlay.rotation || 0"
          @input="handleUpdateText('rotation', parseInt(($event.target as HTMLInputElement).value))"
          min="0"
          max="359"
          class="w-full"
        />
      </div>

      <!-- Font weight and style -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm text-sam-text-light mb-1">Gewicht</label>
          <select
            :value="selectedOverlay.fontWeight"
            @change="handleUpdateText('fontWeight', ($event.target as HTMLSelectElement).value)"
            class="w-full px-3 py-2 border border-sam-taupe-light rounded focus:outline-none focus:border-sam-green text-sm"
          >
            <option v-for="weight in fontWeights" :key="weight.value" :value="weight.value">
              {{ weight.label }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-sam-text-light mb-1">Stijl</label>
          <select
            :value="selectedOverlay.fontStyle"
            @change="handleUpdateText('fontStyle', ($event.target as HTMLSelectElement).value)"
            class="w-full px-3 py-2 border border-sam-taupe-light rounded focus:outline-none focus:border-sam-green text-sm"
          >
            <option v-for="style in fontStyles" :key="style.value" :value="style.value">
              {{ style.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Color -->
      <div>
        <label class="block text-sm text-sam-text-light mb-1">Kleur</label>
        <div class="flex gap-2">
          <input
            type="color"
            :value="selectedOverlay.color"
            @input="handleUpdateText('color', ($event.target as HTMLInputElement).value)"
            class="w-12 h-10 border border-sam-taupe-light rounded cursor-pointer"
          />
          <input
            type="text"
            :value="selectedOverlay.color"
            @input="handleUpdateText('color', ($event.target as HTMLInputElement).value)"
            class="flex-1 px-3 py-2 border border-sam-taupe-light rounded focus:outline-none focus:border-sam-green text-sm font-mono"
            placeholder="#000000"
          />
        </div>
      </div>

      <!-- Position instruction -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p class="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Sleep de tekst in het beeld om de positie aan te passen
        </p>
      </div>

      <!-- Delete button -->
      <button
        @click="handleDeleteText"
        class="w-full text-sm px-3 py-2 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
      >
        Verwijder tekst
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="overlays.length === 0" class="text-center py-6 text-sam-text-light text-sm">
      Klik op "+ Tekst" om tekst toe te voegen aan je kaartje
    </div>
  </div>
</template>
