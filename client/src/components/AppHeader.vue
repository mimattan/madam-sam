<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="bg-white border-b border-sam-taupe-light">
    <div class="max-w-6xl mx-auto px-6 py-4 flex flex-col items-center">
      <!-- Logo -->
      <RouterLink to="/" class="flex flex-col items-center mb-3 no-underline">
        <div class="w-20 h-20 rounded-full border-[3px] border-sam-green flex items-center justify-center mb-1">
          <div class="text-center">
            <span class="text-sam-green font-heading text-lg font-semibold tracking-wide">MA'AM</span>
            <div class="text-sam-green text-[7px] tracking-[0.15em] uppercase">Grafisch Ontwerp</div>
          </div>
        </div>
      </RouterLink>
      <!-- Navigation -->
      <nav class="flex gap-8 text-sm tracking-widest uppercase text-sam-warm-gray">
        <RouterLink to="/" class="hover:text-sam-green transition-colors no-underline text-sam-warm-gray">
          Home
        </RouterLink>
        <span class="text-sam-green font-medium">Geboortekaartjes</span>
      </nav>
    </div>
  </header>
</template>
