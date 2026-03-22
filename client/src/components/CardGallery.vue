<script setup lang="ts">
import type { CardTemplate } from '../services/api'
import CardPreview from './CardPreview.vue'

defineProps<{
  cards: CardTemplate[]
}>()
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    <CardPreview
      v-for="card in cards"
      :key="card.id"
      :card="card"
    />
  </div>
</template>
