import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EditorView from '../views/EditorView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import OrderConfirmationView from '../views/OrderConfirmationView.vue'
import OrderStatusView from '../views/OrderStatusView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/editor/:id', name: 'editor', component: EditorView },
    { path: '/checkout', name: 'checkout', component: CheckoutView },
    { path: '/order/confirmation', name: 'order-confirmation', component: OrderConfirmationView },
    { path: '/order/status/:id', name: 'order-status', component: OrderStatusView },
  ],
})

export default router
