<script setup lang="ts">
import type { EditHistoryEntry } from '../stores/cardStore'

defineProps<{
  history: EditHistoryEntry[]
}>()

const emit = defineEmits<{
  revert: [index: number]
}>()

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div v-if="history.length > 0" class="bg-white rounded-xl shadow-sm border border-sam-taupe-light p-4">
    <h3 class="font-heading text-lg text-sam-text mb-3">Bewerkingen</h3>
    <div class="space-y-2">
      <div
        v-for="(entry, index) in history"
        :key="index"
        class="flex items-start gap-3 p-2 rounded-lg hover:bg-sam-cream transition-colors group"
      >
        <div class="w-6 h-6 rounded-full bg-sam-green/10 flex items-center justify-center shrink-0 mt-0.5">
          <span class="text-sam-green text-xs font-semibold">{{ index + 1 }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-sam-text truncate">{{ entry.prompt }}</p>
          <p class="text-xs text-sam-warm-gray">{{ formatTime(entry.timestamp) }}</p>
        </div>
        <button
          @click="emit('revert', index)"
          class="text-xs text-sam-warm-gray hover:text-sam-green opacity-0 group-hover:opacity-100 transition-all shrink-0"
          title="Terug naar deze stap"
        >
          Herstel
        </button>
      </div>
    </div>
  </div>
</template>
