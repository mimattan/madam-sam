<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  visible: boolean
  colorContext: string
  suggestedColors: string[]
  cardColors: string[]
  message: string
}>()

const emit = defineEmits<{
  confirm: [color: string]
  cancel: []
}>()

const selectedColor = ref<string>(props.suggestedColors?.[0] || '#000000')
const customColor = ref<string>('#000000')
const useCustom = ref(false)

const activeColor = computed(() => useCustom.value ? customColor.value : selectedColor.value)

function selectSuggested(color: string) {
  useCustom.value = false
  selectedColor.value = color
}

function handleCustomChange(event: Event) {
  const target = event.target as HTMLInputElement
  customColor.value = target.value
  useCustom.value = true
}

function handleCustomHexInput(event: Event) {
  const target = event.target as HTMLInputElement
  customColor.value = target.value
  useCustom.value = true
}

function handleConfirm() {
  emit('confirm', activeColor.value)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/40"
        @click="$emit('cancel')"
      />

      <!-- Dialog -->
      <div class="relative bg-white rounded-xl shadow-xl border border-sam-taupe-light max-w-md w-full mx-4 p-6">
        <h3 class="font-heading text-lg text-sam-text mb-2">Kleur kiezen</h3>
        <p class="text-sm text-sam-text-light mb-4">{{ message }}</p>

        <!-- Context info -->
        <div class="bg-sam-cream rounded-lg px-3 py-2 mb-4">
          <p class="text-xs text-sam-brown">
            <strong>Element:</strong> {{ colorContext }}
          </p>
        </div>

        <!-- Suggested colors -->
        <div v-if="suggestedColors.length" class="mb-4">
          <label class="block text-sm text-sam-text-light mb-2">Voorgestelde kleuren</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="color in suggestedColors"
              :key="color"
              @click="selectSuggested(color)"
              :class="[
                'w-10 h-10 rounded-lg border-2 transition-all hover:scale-110',
                !useCustom && selectedColor === color
                  ? 'border-sam-green ring-2 ring-sam-green/30 scale-110'
                  : 'border-gray-200'
              ]"
              :style="{ backgroundColor: color }"
              :title="color"
            />
          </div>
        </div>

        <!-- Card's existing colors -->
        <div v-if="cardColors.length" class="mb-4">
          <label class="block text-sm text-sam-text-light mb-2">Kleuren van het kaartje</label>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="color in cardColors"
              :key="color"
              class="text-xs px-2 py-0.5 rounded-full bg-sam-taupe-light text-sam-brown"
            >
              {{ color }}
            </span>
          </div>
        </div>

        <!-- Custom color picker -->
        <div class="mb-6">
          <label class="block text-sm text-sam-text-light mb-2">Eigen kleur</label>
          <div class="flex gap-2 items-center">
            <input
              type="color"
              :value="customColor"
              @input="handleCustomChange"
              class="w-12 h-10 border border-sam-taupe-light rounded cursor-pointer"
            />
            <input
              type="text"
              :value="customColor"
              @input="handleCustomHexInput"
              class="flex-1 px-3 py-2 border border-sam-taupe-light rounded focus:outline-none focus:border-sam-green text-sm font-mono"
              placeholder="#000000"
            />
          </div>
        </div>

        <!-- Preview -->
        <div class="mb-6 flex items-center gap-3">
          <label class="text-sm text-sam-text-light">Voorbeeld:</label>
          <div
            class="w-16 h-10 rounded-lg border border-gray-200 shadow-inner"
            :style="{ backgroundColor: activeColor }"
          />
          <span class="text-sm font-mono text-sam-text">{{ activeColor }}</span>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 justify-end">
          <button
            @click="$emit('cancel')"
            class="px-4 py-2 text-sm rounded border border-sam-taupe-light text-sam-text-light hover:bg-gray-50 transition-colors"
          >
            Annuleren
          </button>
          <button
            @click="handleConfirm"
            class="px-4 py-2 text-sm rounded bg-sam-green text-white hover:bg-sam-green-dark transition-colors"
          >
            Toepassen
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
