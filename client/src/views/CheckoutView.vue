<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore, formatPrice } from '../stores/cartStore'
import { createOrder } from '../services/api'
import type { CustomerInfo, Address } from '../services/api'

const router = useRouter()
const cart = useCartStore()
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const sameAsShipping = ref(true)

const customer = ref<CustomerInfo>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
})

const shippingAddress = ref<Address>({
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  country: 'BE',
})

const billingAddress = ref<Address>({
  street: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  country: 'BE',
})

const effectiveBillingAddress = computed(() =>
  sameAsShipping.value ? shippingAddress.value : billingAddress.value
)

// Redirect to home if cart is empty
if (cart.itemCount === 0) {
  router.replace('/')
}

async function handleSubmit() {
  error.value = null
  isSubmitting.value = true

  try {
    const result = await createOrder({
      customer: customer.value,
      shippingAddress: shippingAddress.value,
      billingAddress: effectiveBillingAddress.value,
      items: cart.items.map(item => ({
        cardId: item.cardId,
        cardName: item.cardName,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        label: item.label,
      })),
    })

    // Redirect to Mollie checkout
    window.location.href = result.checkoutUrl
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Er ging iets mis bij het aanmaken van je bestelling.'
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 py-8">
    <!-- Back button -->
    <button
      @click="router.push('/')"
      class="flex items-center gap-2 text-sam-text-light hover:text-sam-green transition-colors mb-6"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      <span class="text-sm">Terug naar collectie</span>
    </button>

    <h1 class="font-heading text-2xl text-sam-text mb-8">Checkout</h1>

    <form @submit.prevent="handleSubmit" class="space-y-8">
      <!-- Order summary -->
      <section class="bg-white rounded-xl shadow-sm border border-sam-taupe-light p-6">
        <h2 class="font-heading text-lg text-sam-text mb-4">Besteloverzicht</h2>
        <div class="space-y-3">
          <div
            v-for="(item, index) in cart.items"
            :key="index"
            class="flex items-center gap-4"
          >
            <img
              :src="item.thumbnailUrl"
              :alt="item.cardName"
              class="w-14 h-14 object-cover rounded"
            />
            <div class="flex-1">
              <p class="text-sm font-medium text-sam-text">{{ item.cardName }}</p>
              <p class="text-xs text-sam-text-light">{{ item.label }}</p>
            </div>
            <p class="text-sm font-semibold text-sam-text">{{ formatPrice(item.pricePerUnit) }}</p>
          </div>
        </div>
      </section>

      <!-- Customer info -->
      <section class="bg-white rounded-xl shadow-sm border border-sam-taupe-light p-6">
        <h2 class="font-heading text-lg text-sam-text mb-4">Klantgegevens</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-sam-text mb-1">Voornaam *</label>
            <input
              v-model="customer.firstName"
              type="text"
              required
              class="w-full px-3 py-2 border border-sam-taupe-light rounded-lg focus:outline-none focus:ring-2 focus:ring-sam-green/50 focus:border-sam-green"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-sam-text mb-1">Achternaam *</label>
            <input
              v-model="customer.lastName"
              type="text"
              required
              class="w-full px-3 py-2 border border-sam-taupe-light rounded-lg focus:outline-none focus:ring-2 focus:ring-sam-green/50 focus:border-sam-green"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-sam-text mb-1">E-mail *</label>
            <input
              v-model="customer.email"
              type="email"
              required
              class="w-full px-3 py-2 border border-sam-taupe-light rounded-lg focus:outline-none focus:ring-2 focus:ring-sam-green/50 focus:border-sam-green"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-sam-text mb-1">Telefoon</label>
            <input
              v-model="customer.phone"
              type="tel"
              class="w-full px-3 py-2 border border-sam-taupe-light rounded-lg focus:outline-none focus:ring-2 focus:ring-sam-green/50 focus:border-sam-green"
            />
          </div>
        </div>
      </section>

      <!-- Shipping address -->
      <section class="bg-white rounded-xl shadow-sm border border-sam-taupe-light p-6">
        <h2 class="font-heading text-lg text-sam-text mb-4">Verzendadres</h2>
        <div class="grid grid-cols-1 gap-4">
          <div class="grid grid-cols-[1fr_120px] gap-4">
            <div>
              <label class="block text-sm font-medium text-sam-text mb-1">Straat *</label>
              <input
                v-model="shippingAddress.street"
                type="text"
                required
                class="w-full px-3 py-2 border border-sam-taupe-light rounded-lg focus:outline-none focus:ring-2 focus:ring-sam-green/50 focus:border-sam-green"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-sam-text mb-1">Nr *</label>
              <input
                v-model="shippingAddress.houseNumber"
                type="text"
                required
                class="w-full px-3 py-2 border border-sam-taupe-light rounded-lg focus:outline-none focus:ring-2 focus:ring-sam-green/50 focus:border-sam-green"
              />
            </div>
          </div>
          <div class="grid grid-cols-[140px_1fr] gap-4">
            <div>
              <label class="block text-sm font-medium text-sam-text mb-1">Postcode *</label>
              <input
                v-model="shippingAddress.postalCode"
                type="text"
                required
                class="w-full px-3 py-2 border border-sam-taupe-light rounded-lg focus:outline-none focus:ring-2 focus:ring-sam-green/50 focus:border-sam-green"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-sam-text mb-1">Stad *</label>
              <input
                v-model="shippingAddress.city"
                type="text"
                required
                class="w-full px-3 py-2 border border-sam-taupe-light rounded-lg focus:outline-none focus:ring-2 focus:ring-sam-green/50 focus:border-sam-green"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-sam-text mb-1">Land *</label>
            <select
              v-model="shippingAddress.country"
              required
              class="w-full px-3 py-2 border border-sam-taupe-light rounded-lg focus:outline-none focus:ring-2 focus:ring-sam-green/50 focus:border-sam-green bg-white"
            >
              <option value="BE">België</option>
              <option value="NL">Nederland</option>
              <option value="LU">Luxemburg</option>
              <option value="DE">Duitsland</option>
              <option value="FR">Frankrijk</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Billing address -->
      <section class="bg-white rounded-xl shadow-sm border border-sam-taupe-light p-6">
        <h2 class="font-heading text-lg text-sam-text mb-4">Factuuradres</h2>
        <label class="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            v-model="sameAsShipping"
            type="checkbox"
            class="rounded border-sam-taupe-light text-sam-green focus:ring-sam-green/50"
          />
          <span class="text-sm text-sam-text">Zelfde als verzendadres</span>
        </label>
        <div v-if="!sameAsShipping" class="grid grid-cols-1 gap-4">
          <div class="grid grid-cols-[1fr_120px] gap-4">
            <div>
              <label class="block text-sm font-medium text-sam-text mb-1">Straat *</label>
              <input
                v-model="billingAddress.street"
                type="text"
                required
                class="w-full px-3 py-2 border border-sam-taupe-light rounded-lg focus:outline-none focus:ring-2 focus:ring-sam-green/50 focus:border-sam-green"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-sam-text mb-1">Nr *</label>
              <input
                v-model="billingAddress.houseNumber"
                type="text"
                required
                class="w-full px-3 py-2 border border-sam-taupe-light rounded-lg focus:outline-none focus:ring-2 focus:ring-sam-green/50 focus:border-sam-green"
              />
            </div>
          </div>
          <div class="grid grid-cols-[140px_1fr] gap-4">
            <div>
              <label class="block text-sm font-medium text-sam-text mb-1">Postcode *</label>
              <input
                v-model="billingAddress.postalCode"
                type="text"
                required
                class="w-full px-3 py-2 border border-sam-taupe-light rounded-lg focus:outline-none focus:ring-2 focus:ring-sam-green/50 focus:border-sam-green"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-sam-text mb-1">Stad *</label>
              <input
                v-model="billingAddress.city"
                type="text"
                required
                class="w-full px-3 py-2 border border-sam-taupe-light rounded-lg focus:outline-none focus:ring-2 focus:ring-sam-green/50 focus:border-sam-green"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-sam-text mb-1">Land *</label>
            <select
              v-model="billingAddress.country"
              required
              class="w-full px-3 py-2 border border-sam-taupe-light rounded-lg focus:outline-none focus:ring-2 focus:ring-sam-green/50 focus:border-sam-green bg-white"
            >
              <option value="BE">België</option>
              <option value="NL">Nederland</option>
              <option value="LU">Luxemburg</option>
              <option value="DE">Duitsland</option>
              <option value="FR">Frankrijk</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Shipping method -->
      <section class="bg-white rounded-xl shadow-sm border border-sam-taupe-light p-6">
        <h2 class="font-heading text-lg text-sam-text mb-4">Verzending</h2>
        <div class="flex items-center justify-between p-3 bg-sam-cream/50 rounded-lg border border-sam-green">
          <div class="flex items-center gap-3">
            <div class="w-4 h-4 rounded-full border-2 border-sam-green flex items-center justify-center">
              <div class="w-2 h-2 rounded-full bg-sam-green"></div>
            </div>
            <div>
              <p class="text-sm font-medium text-sam-text">Standaard verzending</p>
              <p class="text-xs text-sam-text-light">5-7 werkdagen</p>
            </div>
          </div>
          <p class="text-sm font-semibold text-sam-text">{{ formatPrice(cart.shippingCost) }}</p>
        </div>
      </section>

      <!-- Totals -->
      <section class="bg-white rounded-xl shadow-sm border border-sam-taupe-light p-6">
        <h2 class="font-heading text-lg text-sam-text mb-4">Totaaloverzicht</h2>
        <div class="space-y-2">
          <div class="flex justify-between text-sm text-sam-text-light">
            <span>Subtotaal ({{ cart.itemCount }} {{ cart.itemCount === 1 ? 'item' : 'items' }})</span>
            <span>{{ formatPrice(cart.subtotal) }}</span>
          </div>
          <div class="flex justify-between text-sm text-sam-text-light">
            <span>Verzending</span>
            <span>{{ formatPrice(cart.shippingCost) }}</span>
          </div>
          <div class="flex justify-between font-semibold text-lg text-sam-text border-t border-sam-taupe-light pt-3 mt-3">
            <span>Totaal</span>
            <span>{{ formatPrice(cart.total) }}</span>
          </div>
        </div>
      </section>

      <!-- Error -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        {{ error }}
      </div>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="isSubmitting || cart.itemCount === 0"
        class="w-full py-4 bg-sam-taupe text-white font-medium text-lg rounded-lg hover:bg-sam-taupe-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
          <svg class="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Bestelling verwerken...
        </span>
        <span v-else>Betalen — {{ formatPrice(cart.total) }}</span>
      </button>
    </form>
  </div>
</template>
