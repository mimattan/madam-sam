<script setup lang="ts">
import CartPanel from './components/CartPanel.vue'
import CartButton from './components/CartButton.vue'
</script>

<template>
  <div class="min-h-screen bg-sam-cream">
    <CartButton />
    <main>
      <router-view />
    </main>
    <CartPanel />
  </div>
</template>
