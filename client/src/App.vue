<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <div class="min-h-screen bg-sam-cream">
    <AppHeader />
    <main>
      <router-view />
    </main>
  </div>
</template>
