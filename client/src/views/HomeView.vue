<script setup lang="ts">
import { onMounted } from 'vue'
import { useCardStore } from '../stores/cardStore'
import CardGallery from '../components/CardGallery.vue'

const store = useCardStore()

onMounted(() => {
  store.loadCards()
})
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="bg-sam-taupe text-white py-16 px-6">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="font-heading text-5xl md:text-6xl font-medium mb-4 text-white">
          Ontwerp jouw
        </h1>
        <p class="text-xl md:text-2xl font-heading italic text-white/90 mb-6">
          geboortekaartje
        </p>
        <p class="text-white/80 max-w-2xl mx-auto leading-relaxed">
          Kies een kaartje uit onze collectie en personaliseer het met AI.
          Verander kleuren, voeg tekeningen toe, pas de naam aan...
          de mogelijkheden zijn eindeloos!
        </p>
      </div>
    </section>

    <!-- Cards Section -->
    <section class="max-w-6xl mx-auto px-6 py-12">
      <div class="flex items-baseline gap-4 mb-8">
        <h2 class="font-heading text-3xl text-sam-text">Collectie</h2>
        <span class="text-sam-text-light font-heading italic text-xl">kaartjes</span>
      </div>

      <!-- Loading state -->
      <div v-if="store.isLoading" class="flex justify-center py-20">
        <div class="w-8 h-8 border-3 border-sam-green border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Error state -->
      <div v-else-if="store.error" class="text-center py-20 text-sam-warm-gray">
        <p class="text-lg mb-4">{{ store.error }}</p>
        <button
          @click="store.loadCards()"
          class="px-6 py-2 bg-sam-green text-white rounded hover:bg-sam-green-dark transition-colors"
        >
          Opnieuw proberen
        </button>
      </div>

      <!-- Cards grid -->
      <CardGallery v-else :cards="store.cards" />

      <!-- Empty state -->
      <div v-if="!store.isLoading && !store.error && store.cards.length === 0" class="text-center py-20 text-sam-warm-gray">
        <p class="text-lg">Nog geen kaartjes beschikbaar.</p>
        <p class="text-sm mt-2">Voeg kaartjes toe aan de server/cards map.</p>
      </div>
    </section>

    <!-- Info Section -->
    <section class="bg-white py-12 px-6">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="font-heading text-3xl text-sam-text mb-6">Hoe werkt het?</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <div>
            <div class="w-12 h-12 rounded-full bg-sam-green/10 flex items-center justify-center mx-auto mb-4">
              <span class="text-sam-green text-xl font-heading font-semibold">1</span>
            </div>
            <h3 class="font-heading text-lg mb-2 text-sam-text">Kies een kaartje</h3>
            <p class="text-sam-text-light text-sm">
              Blader door onze collectie en kies het kaartje dat je aanspreekt.
            </p>
          </div>
          <div>
            <div class="w-12 h-12 rounded-full bg-sam-green/10 flex items-center justify-center mx-auto mb-4">
              <span class="text-sam-green text-xl font-heading font-semibold">2</span>
            </div>
            <h3 class="font-heading text-lg mb-2 text-sam-text">Personaliseer</h3>
            <p class="text-sam-text-light text-sm">
              Typ je wensen en onze AI past het kaartje aan. Verander kleuren, namen, voeg
              tekeningen toe...
            </p>
          </div>
          <div>
            <div class="w-12 h-12 rounded-full bg-sam-green/10 flex items-center justify-center mx-auto mb-4">
              <span class="text-sam-green text-xl font-heading font-semibold">3</span>
            </div>
            <h3 class="font-heading text-lg mb-2 text-sam-text">Download</h3>
            <p class="text-sam-text-light text-sm">
              Tevreden met het resultaat? Download je gepersonaliseerde kaartje!
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
