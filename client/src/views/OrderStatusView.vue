<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderStatus } from '../services/api'
import { formatPrice } from '../stores/cartStore'
import type { OrderStatus } from '../services/api'

const route = useRoute()
const router = useRouter()

const order = ref<OrderStatus | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  const id = route.params.id as string
  if (!id) {
    router.replace('/')
    return
  }

  try {
    order.value = await getOrderStatus(id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Bestelling niet gevonden.'
  } finally {
    loading.value = false
  }
})

const statusLabels: Record<string, string> = {
  pending: 'In afwachting',
  paid: 'Betaald',
  failed: 'Mislukt',
  open: 'Open',
  canceled: 'Geannuleerd',
  expired: 'Verlopen',
}

const statusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  open: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  canceled: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-6 py-8">
    <button
      @click="router.push('/')"
      class="flex items-center gap-2 text-sam-text-light hover:text-sam-green transition-colors mb-6"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      <span class="text-sm">Terug naar collectie</span>
    </button>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="w-8 h-8 border-3 border-sam-green border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="error" class="text-center py-20">
      <p class="text-sam-text-light text-lg">{{ error }}</p>
    </div>

    <template v-else-if="order">
      <h1 class="font-heading text-2xl text-sam-text mb-6">Bestelling {{ order.orderNumber }}</h1>

      <div class="bg-white rounded-xl shadow-sm border border-sam-taupe-light p-6 space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-sam-text-light">Status</span>
          <span
            :class="['px-3 py-1 rounded-full text-xs font-medium', statusColors[order.paymentStatus] || 'bg-gray-100 text-gray-800']"
          >
            {{ statusLabels[order.paymentStatus] || order.paymentStatus }}
          </span>
        </div>

        <div class="text-sm text-sam-text-light space-y-1 border-t border-sam-taupe-light pt-4">
          <p><span class="font-medium text-sam-text">Naam:</span> {{ order.customer.firstName }} {{ order.customer.lastName }}</p>
          <p><span class="font-medium text-sam-text">E-mail:</span> {{ order.customer.email }}</p>
          <p><span class="font-medium text-sam-text">Datum:</span> {{ new Date(order.createdAt).toLocaleDateString('nl-BE') }}</p>
        </div>

        <div class="border-t border-sam-taupe-light pt-4">
          <h3 class="text-sm font-medium text-sam-text mb-2">Items</h3>
          <div v-for="(item, idx) in order.items" :key="idx" class="flex justify-between text-sm text-sam-text-light py-1">
            <span>{{ item.cardName }} — {{ item.label }}</span>
            <span>{{ formatPrice(item.pricePerUnit) }}</span>
          </div>
        </div>

        <div class="border-t border-sam-taupe-light pt-4 space-y-1">
          <div class="flex justify-between text-sm text-sam-text-light">
            <span>Verzending</span>
            <span>{{ formatPrice(order.shippingCost) }}</span>
          </div>
          <div class="flex justify-between font-semibold text-sam-text">
            <span>Totaal</span>
            <span>{{ formatPrice(order.totalAmount) }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
