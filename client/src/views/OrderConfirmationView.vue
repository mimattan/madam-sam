<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore, formatPrice } from '../stores/cartStore'
import { getOrderStatus } from '../services/api'
import type { OrderStatus } from '../services/api'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const order = ref<OrderStatus | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const orderId = route.query.orderId as string

onMounted(async () => {
  if (!orderId) {
    router.replace('/')
    return
  }

  try {
    order.value = await getOrderStatus(orderId)

    // Clear cart on successful payment
    if (order.value.paymentStatus === 'paid') {
      cart.clearCart()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Bestelling niet gevonden.'
  } finally {
    loading.value = false
  }
})

async function refreshStatus() {
  if (!orderId) return
  loading.value = true
  try {
    order.value = await getOrderStatus(orderId)
    if (order.value.paymentStatus === 'paid') {
      cart.clearCart()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Fout bij ophalen status.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-6 py-16 text-center">
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-8 h-8 border-3 border-sam-green border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="py-20">
      <p class="text-sam-text-light text-lg mb-4">{{ error }}</p>
      <button
        @click="router.push('/')"
        class="px-6 py-2 bg-sam-green text-white rounded-lg hover:bg-sam-green-dark transition-colors"
      >
        Terug naar collectie
      </button>
    </div>

    <!-- Success -->
    <template v-else-if="order">
      <div v-if="order.paymentStatus === 'paid'" class="space-y-6">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 class="font-heading text-3xl text-sam-text">Bedankt voor je bestelling!</h1>
        <p class="text-sam-text-light">
          Bestelling <span class="font-semibold text-sam-text">{{ order.orderNumber }}</span> is ontvangen.
          We gaan je kaartjes met zorg drukken en verzenden.
        </p>
        <div class="bg-white rounded-xl shadow-sm border border-sam-taupe-light p-6 text-left space-y-3">
          <h3 class="font-heading text-lg text-sam-text">Bestelgegevens</h3>
          <div class="text-sm text-sam-text-light space-y-1">
            <p><span class="font-medium text-sam-text">Bestelnummer:</span> {{ order.orderNumber }}</p>
            <p><span class="font-medium text-sam-text">E-mail:</span> {{ order.customer.email }}</p>
            <p><span class="font-medium text-sam-text">Totaal:</span> {{ formatPrice(order.totalAmount) }}</p>
          </div>
          <div class="pt-3 border-t border-sam-taupe-light">
            <h4 class="text-sm font-medium text-sam-text mb-2">Items</h4>
            <div v-for="(item, idx) in order.items" :key="idx" class="flex justify-between text-sm text-sam-text-light">
              <span>{{ item.cardName }} ({{ item.label }})</span>
              <span>{{ formatPrice(item.pricePerUnit) }}</span>
            </div>
          </div>
        </div>
        <button
          @click="router.push('/')"
          class="px-8 py-3 bg-sam-green text-white rounded-lg hover:bg-sam-green-dark transition-colors"
        >
          Terug naar collectie
        </button>
      </div>

      <!-- Pending -->
      <div v-else-if="order.paymentStatus === 'open' || order.paymentStatus === 'pending'" class="space-y-6">
        <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
          <svg class="w-8 h-8 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h1 class="font-heading text-3xl text-sam-text">Betaling verwerken...</h1>
        <p class="text-sam-text-light">
          We wachten nog op de bevestiging van je betaling. Dit kan een paar minuten duren.
        </p>
        <button
          @click="refreshStatus"
          class="px-6 py-2 bg-sam-green text-white rounded-lg hover:bg-sam-green-dark transition-colors"
        >
          Status vernieuwen
        </button>
      </div>

      <!-- Failed / Canceled / Expired -->
      <div v-else class="space-y-6">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 class="font-heading text-3xl text-sam-text">Betaling niet gelukt</h1>
        <p class="text-sam-text-light">
          Je betaling is {{ order.paymentStatus === 'canceled' ? 'geannuleerd' : order.paymentStatus === 'expired' ? 'verlopen' : 'mislukt' }}.
          Je winkelwagen is nog bewaard — je kunt het opnieuw proberen.
        </p>
        <div class="flex gap-4 justify-center">
          <button
            @click="router.push('/checkout')"
            class="px-6 py-2 bg-sam-taupe text-white rounded-lg hover:bg-sam-taupe-dark transition-colors"
          >
            Opnieuw proberen
          </button>
          <button
            @click="router.push('/')"
            class="px-6 py-2 border border-sam-taupe-light text-sam-text-light rounded-lg hover:border-sam-taupe transition-colors"
          >
            Terug naar collectie
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
