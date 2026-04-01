import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface CartItem {
  cardId: string
  cardName: string
  thumbnailUrl: string
  imageUrl: string
  variantIndex: number
  quantity: number
  pricePerUnit: number
  label: string
}

const STORAGE_KEY = 'madam-sam-cart'

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(loadCart())
  const isOpen = ref(false)

  // Persist to localStorage on change
  watch(items, (val) => saveCart(val), { deep: true })

  const itemCount = computed(() => items.value.length)

  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + item.pricePerUnit, 0)
  )

  const shippingCost = computed(() => (items.value.length > 0 ? 595 : 0))

  const total = computed(() => subtotal.value + shippingCost.value)

  function addItem(item: CartItem) {
    // Replace if same card already in cart (user re-customized)
    const existingIndex = items.value.findIndex(i => i.cardId === item.cardId && i.imageUrl === item.imageUrl)
    if (existingIndex >= 0) {
      items.value[existingIndex] = item
    } else {
      items.value.push(item)
    }
  }

  function removeItem(index: number) {
    items.value.splice(index, 1)
  }

  function updateVariant(index: number, variantIndex: number, quantity: number, price: number, label: string) {
    if (index >= 0 && index < items.value.length) {
      items.value[index].variantIndex = variantIndex
      items.value[index].quantity = quantity
      items.value[index].pricePerUnit = price
      items.value[index].label = label
    }
  }

  function clearCart() {
    items.value = []
  }

  function openCart() {
    isOpen.value = true
  }

  function closeCart() {
    isOpen.value = false
  }

  return {
    items,
    isOpen,
    itemCount,
    subtotal,
    shippingCost,
    total,
    addItem,
    removeItem,
    updateVariant,
    clearCart,
    openCart,
    closeCart,
  }
})

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}
