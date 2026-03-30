<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { CardTemplate } from '../services/api'

const props = defineProps<{
  card: CardTemplate
}>()

const bgColors: Record<string, string> = {
  'spring-nursery': 'bg-sky-100',
  'forest-adventure': 'bg-emerald-800',
  'ocean-world': 'bg-gray-200',
  'meadow-friends': 'bg-amber-200',
  'little-lion': 'bg-amber-700',
  'mountain-sunset': 'bg-amber-800',
  'garden-party': 'bg-purple-200',
  'space-explorer': 'bg-pink-200',
}

const bgColor = bgColors[props.card.id] || 'bg-gray-100'
</script>

<template>
  <RouterLink
    :to="{ name: 'editor', params: { id: card.id } }"
    class="group block rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 no-underline"
  >
    <div :class="['aspect-[4/5] flex items-center justify-center p-6', bgColor]">
      <img
        :src="card.thumbnailUrl"
        :alt="card.name"
        class="max-w-full max-h-full object-contain rounded shadow-md group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
        @error="($event.target as HTMLImageElement).style.display = 'none'"
      />
      <!-- Fallback when image not available -->
      <div
        v-if="!card.thumbnailUrl"
        class="w-full h-full flex flex-col items-center justify-center text-white/80"
      >
        <span class="font-heading text-2xl italic">{{ card.name }}</span>
      </div>
    </div>
    <div class="bg-white p-4">
      <h3 class="font-heading text-lg text-sam-text mb-1">{{ card.name }}</h3>
      <p class="text-sam-text-light text-sm mb-2">{{ card.description }}</p>
      <div class="flex flex-wrap gap-1">
        <span
          v-for="tag in card.tags"
          :key="tag"
          class="text-xs px-2 py-0.5 rounded-full bg-sam-taupe-light text-sam-brown"
        >
          {{ tag }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>
