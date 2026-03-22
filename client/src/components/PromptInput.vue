<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  submit: [prompt: string]
}>()

defineProps<{
  disabled?: boolean
}>()

const prompt = ref('')

const suggestions = [
  'Verander de naam naar ...',
  'Maak de achtergrond lichtroze',
  'Voeg een kleine eenhoorn toe',
  'Verander de kleuren naar herfsttinten',
  'Voeg sterretjes toe aan de achtergrond',
  'Maak het kleurenpalet zachter',
]

function submit() {
  const text = prompt.value.trim()
  if (!text) return
  emit('submit', text)
  prompt.value = ''
}

function useSuggestion(suggestion: string) {
  prompt.value = suggestion
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm border border-sam-taupe-light p-4">
    <!-- Suggestions -->
    <div class="flex flex-wrap gap-2 mb-3">
      <button
        v-for="s in suggestions"
        :key="s"
        :disabled="disabled"
        @click="useSuggestion(s)"
        class="text-xs px-3 py-1.5 rounded-full border border-sam-taupe-light text-sam-text-light hover:bg-sam-taupe-light hover:text-sam-text transition-colors disabled:opacity-50"
      >
        {{ s }}
      </button>
    </div>

    <!-- Input area -->
    <form @submit.prevent="submit" class="flex gap-3">
      <input
        v-model="prompt"
        :disabled="disabled"
        type="text"
        placeholder="Beschrijf de aanpassing die je wilt maken..."
        class="flex-1 px-4 py-3 rounded-lg border border-sam-taupe-light focus:border-sam-green focus:ring-1 focus:ring-sam-green outline-none text-sam-text placeholder:text-sam-warm-gray disabled:opacity-50 disabled:bg-gray-50"
      />
      <button
        type="submit"
        :disabled="disabled || !prompt.trim()"
        class="px-6 py-3 bg-sam-green text-white rounded-lg hover:bg-sam-green-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <span v-if="disabled" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        <span v-else>Aanpassen</span>
      </button>
    </form>
  </div>
</template>
