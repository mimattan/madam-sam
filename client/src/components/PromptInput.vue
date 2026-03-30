<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  submit: [prompt: string]
}>()

const props = defineProps<{
  disabled?: boolean
  suggestions?: Array<{
    type: string
    label: string
    prompt: string
  }>
}>()

const prompt = ref('')

function submit() {
  const text = prompt.value.trim()
  if (!text) return
  emit('submit', text)
  prompt.value = ''
}

function useSuggestion(suggestionPrompt: string) {
  prompt.value = suggestionPrompt
}
</script>

<template>
  <div>
    <!-- Suggestions -->
    <div v-if="suggestions && suggestions.length > 0" class="flex flex-wrap gap-1.5 mb-2.5">
      <button
        v-for="s in suggestions"
        :key="s.label"
        :disabled="disabled"
        @click="useSuggestion(s.prompt)"
        class="text-xs px-2.5 py-1 rounded-full border border-sam-taupe-light text-sam-text-light hover:bg-sam-taupe-light hover:text-sam-text transition-colors disabled:opacity-50"
      >
        {{ s.label }}
      </button>
    </div>

    <!-- Input area -->
    <form @submit.prevent="submit" class="space-y-2">
      <input
        v-model="prompt"
        :disabled="disabled"
        type="text"
        placeholder="Beschrijf de aanpassing..."
        class="w-full px-3 py-2 text-sm rounded-lg border border-sam-taupe-light focus:border-sam-green focus:ring-1 focus:ring-sam-green outline-none text-sam-text placeholder:text-sam-warm-gray disabled:opacity-50 disabled:bg-gray-50"
      />
      <button
        type="submit"
        :disabled="disabled || !prompt.trim()"
        class="w-full py-2 bg-sam-green text-white text-sm rounded-lg hover:bg-sam-green-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <span v-if="disabled" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <span v-else>Aanpassen</span>
      </button>
    </form>
  </div>
</template>
