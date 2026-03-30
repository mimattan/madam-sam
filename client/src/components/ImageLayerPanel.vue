<script setup lang="ts">
import { ref, computed } from 'vue'

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
  layers: ImageLayerData[]
  selectedLayerId: string | null
  isGenerating: boolean
  maxLayers: number
}>()

const emit = defineEmits<{
  generate: [prompt: string]
  edit: [id: string, prompt: string]
  update: [id: string, updates: Partial<ImageLayerData>]
  delete: [id: string]
  select: [id: string | null]
}>()

const layerPrompt = ref('')
const editPrompt = ref('')
const isEditMode = ref(false)
const generateError = ref<string | null>(null)

const canAddMore = computed(() => props.layers.length < props.maxLayers)

const selectedLayer = computed(() =>
  props.layers.find(l => l.id === props.selectedLayerId)
)

async function handleGenerate() {
  const text = layerPrompt.value.trim()
  if (!text) return

  generateError.value = null
  try {
    emit('generate', text)
    layerPrompt.value = ''
  } catch (err) {
    generateError.value = err instanceof Error ? err.message : 'Generatie mislukt'
  }
}

function handleDelete() {
  if (props.selectedLayerId) {
    emit('delete', props.selectedLayerId)
  }
}

function startEditLayer() {
  if (selectedLayer.value) {
    editPrompt.value = selectedLayer.value.prompt
    isEditMode.value = true
  }
}

function cancelEdit() {
  isEditMode.value = false
  editPrompt.value = ''
}

async function handleEditLayer() {
  const text = editPrompt.value.trim()
  if (!text || !props.selectedLayerId) return

  generateError.value = null
  try {
    emit('edit', props.selectedLayerId, text)
    isEditMode.value = false
    editPrompt.value = ''
  } catch (err) {
    generateError.value = err instanceof Error ? err.message : 'Bewerking mislukt'
  }
}

function handleUpdateRotation(value: number) {
  if (props.selectedLayerId) {
    emit('update', props.selectedLayerId, { rotation: value })
  }
}

function handleUpdateSize(field: 'width' | 'height', value: number) {
  if (!props.selectedLayerId || !selectedLayer.value) return
  if (field === 'width') {
    const newHeight = value / selectedLayer.value.aspectRatio
    emit('update', props.selectedLayerId, { width: value, height: newHeight })
  } else {
    const newWidth = value * selectedLayer.value.aspectRatio
    emit('update', props.selectedLayerId, { height: value, width: newWidth })
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium text-sm text-sam-text">Afbeelding lagen</h3>
      <span class="text-xs text-sam-text-light">{{ layers.length }}/{{ maxLayers }}</span>
    </div>

    <!-- Generate input -->
    <div v-if="canAddMore" class="mb-4">
      <form @submit.prevent="handleGenerate" class="flex gap-2">
        <!-- Edit layer dialog -->
        <div v-if="isEditMode && selectedLayer" class="space-y-2 mb-4 p-3 bg-blue-50 rounded border border-blue-200">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-blue-900">Bewerk laag</span>
            <button @click="cancelEdit" class="text-sm text-blue-600 hover:text-blue-800">
              Annuleer
            </button>
          </div>
          <input
            v-model="editPrompt"
            type="text"
            placeholder="Nieuwe beschrijving..."
            class="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keyup.enter="handleEditLayer"
            :disabled="isGenerating"
          />
          <button
            @click="handleEditLayer"
            :disabled="!editPrompt.trim() || isGenerating"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isGenerating ? 'Bewerken...' : 'Bewerk laag' }}
          </button>
        </div>

        <!-- Layer generation input -->
        <div v-if="canAddMore && !isEditMode" class="space-y-2">
          <input
            v-model="layerPrompt"
            type="text"
            placeholder="Beschrijf een afbeelding laag..."
            class="w-full px-3 py-2 border border-sam-taupe-light rounded focus:outline-none focus:ring-2 focus:ring-sam-green"
            @keyup.enter="handleGenerate"
            :disabled="isGenerating"
          />
          <button
            @click="handleGenerate"
            :disabled="!layerPrompt.trim() || isGenerating"
            class="w-full px-4 py-2 bg-sam-green text-white rounded hover:bg-sam-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isGenerating ? 'Genereren...' : 'Genereer laag' }}
          </button>
        </div>
      </form>
      <p v-if="isGenerating" class="text-xs text-sam-text-light mt-1">
        Element wordt gegenereerd... dit kan 10-30 seconden duren.
      </p>
      <p v-if="generateError" class="text-xs text-red-600 mt-1">{{ generateError }}</p>
    </div>
    <div v-else class="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-2">
      <p class="text-xs text-amber-800">Maximum aantal lagen bereikt ({{ maxLayers }})</p>
    </div>

    <!-- Layer list -->
    <div v-if="layers.length > 0" class="space-y-2 mb-4">
      <button
        v-for="layer in layers"
        :key="layer.id"
        @click="emit('select', layer.id)"
        :class="[
          'w-full text-left px-3 py-2 rounded border transition-colors flex items-center gap-2',
          selectedLayerId === layer.id
            ? 'border-sam-green bg-sam-green/5'
            : 'border-sam-taupe-light hover:border-sam-green/50'
        ]"
      >
        <img
          :src="layer.imageUrl"
          :alt="layer.prompt"
          class="w-8 h-8 object-contain rounded bg-gray-100"
        />
        <div class="flex-1 min-w-0">
          <div class="text-sm text-sam-text truncate">{{ layer.prompt }}</div>
          <div class="text-xs text-sam-text-light">
            {{ Math.round(layer.width) }}% × {{ Math.round(layer.height) }}% · {{ layer.rotation }}°
          </div>
        </div>
      </button>
    </div>

    <!-- Selected layer controls -->
    <div v-if="selectedLayer" class="space-y-4 pt-4 border-t border-sam-taupe-light">
      <!-- Size -->
      <div>
        <label class="block text-sm text-sam-text-light mb-1">Grootte: {{ Math.round(selectedLayer.width) }}%</label>
        <input
          type="range"
          :value="selectedLayer.width"
          @input="handleUpdateSize('width', parseInt(($event.target as HTMLInputElement).value))"
          min="5"
          max="80"
          class="w-full"
        />
      </div>

      <!-- Rotation -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="block text-sm text-sam-text-light">Rotatie: {{ selectedLayer.rotation }}°</label>
          <button
            v-if="selectedLayer.rotation"
            @click="handleUpdateRotation(0)"
            class="text-xs text-sam-text-light hover:text-sam-green transition-colors"
          >
            Reset
          </button>
        </div>
        <input
          type="range"
          :value="selectedLayer.rotation"
          @input="handleUpdateRotation(parseInt(($event.target as HTMLInputElement).value))"
          min="0"
          max="359"
          class="w-full"
        />
      </div>

      <!-- Flip controls -->
      <div>
        <label class="block text-sm text-sam-text-light mb-2">Spiegelen</label>
        <div class="flex gap-2">
          <button
            @click="emit('update', props.selectedLayerId!, { flipX: !selectedLayer.flipX })"
            :class="[
              'flex-1 px-3 py-2 rounded border text-sm transition-colors',
              selectedLayer.flipX
                ? 'border-sam-green bg-sam-green/10 text-sam-green'
                : 'border-sam-taupe-light text-sam-text hover:bg-sam-taupe-light'
            ]"
          >
            ↔️ Horizontaal
          </button>
          <button
            @click="emit('update', props.selectedLayerId!, { flipY: !selectedLayer.flipY })"
            :class="[
              'flex-1 px-3 py-2 rounded border text-sm transition-colors',
              selectedLayer.flipY
                ? 'border-sam-green bg-sam-green/10 text-sam-green'
                : 'border-sam-taupe-light text-sam-text hover:bg-sam-taupe-light'
            ]"
          >
            ↕️ Verticaal
          </button>
        </div>
      </div>

      <!-- Position tip -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p class="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Sleep de afbeelding in het beeld om de positie aan te passen. Gebruik de hoeken om te vergroten/verkleinen.
        </p>
      </div>

      <!-- Delete button -->
      <div v-if="selectedLayerId" class="flex gap-2">
        <button
          @click="startEditLayer"
          class="text-sm px-3 py-1.5 rounded border border-sam-taupe-light text-sam-text hover:bg-sam-taupe-light transition-colors"
        >
          Bewerk
        </button>
        <button
          @click="handleDelete"
          class="text-sm px-3 py-1.5 rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
        >
          Verwijder
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="layers.length === 0" class="text-center py-4 text-sam-text-light text-sm">
      Genereer een element om als laag toe te voegen
    </div>
  </div>
</template>
