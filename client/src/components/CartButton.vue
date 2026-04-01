<script setup lang="ts">
import { useCartStore } from '../stores/cartStore'

const cart = useCartStore()
</script>

<template>
  <button
    @click="cart.openCart()"
    class="fixed top-4 right-4 z-40 bg-white rounded-full shadow-lg border border-sam-taupe-light p-3 hover:bg-sam-cream transition-colors"
    aria-label="Winkelwagen openen"
  >
    <svg class="w-6 h-6 text-sam-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
    <span
      v-if="cart.itemCount > 0"
      class="absolute -top-1 -right-1 bg-sam-green text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
    >
      {{ cart.itemCount }}
    </span>
  </button>
</template>
