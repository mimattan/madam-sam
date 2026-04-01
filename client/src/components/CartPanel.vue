<script setup lang="ts">
import { useCartStore, formatPrice } from '../stores/cartStore'
import { useRouter } from 'vue-router'

const cart = useCartStore()
const router = useRouter()

function goToCheckout() {
  cart.closeCart()
  router.push('/checkout')
}
</script>

<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div
      v-if="cart.isOpen"
      class="fixed inset-0 bg-black/30 z-40"
      @click="cart.closeCart()"
    />
  </Transition>

  <!-- Slide-out panel -->
  <Transition name="slide">
    <div
      v-if="cart.isOpen"
      class="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-sam-taupe-light">
        <h2 class="font-heading text-xl text-sam-text">Winkelwagen</h2>
        <button
          @click="cart.closeCart()"
          class="text-sam-text-light hover:text-sam-text transition-colors"
          aria-label="Sluiten"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="cart.itemCount === 0" class="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <svg class="w-16 h-16 text-sam-taupe-light mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
        <p class="text-sam-text-light mb-4">Je winkelwagen is leeg</p>
        <button
          @click="cart.closeCart(); router.push('/')"
          class="px-6 py-2 bg-sam-green text-white rounded-lg hover:bg-sam-green-dark transition-colors"
        >
          Bekijk collectie
        </button>
      </div>

      <!-- Cart items -->
      <div v-else class="flex-1 overflow-y-auto p-6 space-y-4">
        <div
          v-for="(item, index) in cart.items"
          :key="index"
          class="flex gap-4 bg-sam-cream/50 rounded-lg p-3"
        >
          <img
            :src="item.thumbnailUrl"
            :alt="item.cardName"
            class="w-20 h-20 object-cover rounded"
          />
          <div class="flex-1 min-w-0">
            <h3 class="font-heading text-sm font-semibold text-sam-text truncate">{{ item.cardName }}</h3>
            <p class="text-sm text-sam-text-light">{{ item.label }}</p>
            <p class="text-sm font-semibold text-sam-text mt-1">{{ formatPrice(item.pricePerUnit) }}</p>
          </div>
          <button
            @click="cart.removeItem(index)"
            class="self-start text-sam-text-light hover:text-red-500 transition-colors"
            aria-label="Verwijderen"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Footer with totals -->
      <div v-if="cart.itemCount > 0" class="border-t border-sam-taupe-light p-6 space-y-3">
        <div class="flex justify-between text-sm text-sam-text-light">
          <span>Subtotaal</span>
          <span>{{ formatPrice(cart.subtotal) }}</span>
        </div>
        <div class="flex justify-between text-sm text-sam-text-light">
          <span>Verzending</span>
          <span>{{ formatPrice(cart.shippingCost) }}</span>
        </div>
        <div class="flex justify-between font-semibold text-sam-text border-t border-sam-taupe-light pt-3">
          <span>Totaal</span>
          <span>{{ formatPrice(cart.total) }}</span>
        </div>
        <button
          @click="goToCheckout"
          class="w-full py-3 bg-sam-taupe text-white font-medium rounded-lg hover:bg-sam-taupe-dark transition-colors"
        >
          Ga naar checkout
        </button>
        <button
          @click="cart.closeCart()"
          class="w-full py-2 text-sm text-sam-text-light hover:text-sam-text transition-colors"
        >
          Verder winkelen
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
