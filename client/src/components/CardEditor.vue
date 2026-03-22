<script setup lang="ts">
defineProps<{
  originalImageUrl: string
  currentImageUrl: string
  cardName: string
  isEditing: boolean
}>()

defineEmits<{
  reset: []
  download: []
}>()
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
      </div>
    </div>

    <!-- Image display -->
    <div class="grid md:grid-cols-2 gap-0">
      <!-- Original -->
      <div class="p-6 bg-gray-50 border-r border-sam-taupe-light">
        <p class="text-xs text-sam-warm-gray uppercase tracking-wider mb-3 text-center">Origineel</p>
        <div class="aspect-[4/5] flex items-center justify-center bg-white rounded-lg shadow-inner p-4">
          <img
            :src="originalImageUrl"
            :alt="`${cardName} - origineel`"
            class="max-w-full max-h-full object-contain rounded"
          />
        </div>
      </div>

      <!-- Current / Edited -->
      <div class="p-6 relative">
        <p class="text-xs text-sam-warm-gray uppercase tracking-wider mb-3 text-center">Bewerkt</p>
        <div class="aspect-[4/5] flex items-center justify-center bg-white rounded-lg shadow-inner p-4 relative">
          <img
            :src="currentImageUrl"
            :alt="`${cardName} - bewerkt`"
            class="max-w-full max-h-full object-contain rounded"
          />
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
    </div>
  </div>
</template>
