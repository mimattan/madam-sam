<script setup lang="ts">
const shopifyDomain = `https://${import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || 'your-store.myshopify.com'}`
const shopifyToken = import.meta.env.VITE_SHOPIFY_PUBLIC_ACCESS_TOKEN || ''
</script>

<template>
  <shopify-store
    :store-domain="shopifyDomain"
    :public-access-token="shopifyToken">
    <div class="min-h-screen bg-sam-cream">
      <main>
        <router-view />
      </main>
    </div>
    <shopify-cart id="madam-sam-cart"></shopify-cart>
  </shopify-store>
</template>
