# Webshop Integration Research for Madam Sam

## Current Situation

Madam Sam is an AI-powered birth card configurator built as a **Vue 3 + Express** application:
- **Frontend**: Vue 3, Vite, Tailwind CSS, Pinia — hosted separately
- **Backend**: Express API with Claude AI + Replicate (FLUX.1) for image editing
- **Original website**: Built on **Wix**
- **Missing**: No checkout, payment, cart, order management, or user accounts

The goal is to add e-commerce (checkout/buying) with **minimal custom development**, leveraging existing software.

---

## Options Evaluated

### 1. Wix Integration (Embed Vue App in Wix)

**How it would work**: Host the Vue configurator externally, embed it in Wix via an HTML iframe element. Use Wix's built-in eCommerce for checkout.

| Aspect | Assessment |
|--------|-----------|
| Vue integration | Poor — iframe is sandboxed, no direct DOM access |
| Responsiveness | Broken — iframes in Wix don't resize responsively |
| Communication | Limited — requires postMessage API between iframe and Wix |
| Checkout flow | Awkward — user configures in iframe, then needs to somehow trigger Wix checkout |
| SEO | Poor — iframe content not indexed |
| Mobile | Problematic — iframe sizing issues on mobile |
| Cost | Wix Business plan ~€17/mo for eCommerce features |

**Verdict**: Not recommended. The iframe limitations make the configurator experience feel broken and disconnected from the checkout. The two systems (Vue app + Wix eCommerce) can't communicate cleanly.

---

### 2. Shopify Buy Button (Starter Plan)

**How it would work**: Keep the Vue app hosted independently. Use Shopify's Buy Button JS SDK to add cart/checkout functionality directly into the Vue app. Shopify handles all payment processing, order management, and fulfillment.

| Aspect | Assessment |
|--------|-----------|
| Vue integration | Good — JS SDK can be called programmatically from Vue |
| Checkout | Excellent — Shopify's PCI-compliant checkout (popup or redirect) |
| Order management | Excellent — full Shopify admin dashboard |
| Payment processing | Excellent — Shopify Payments, Apple Pay, Google Pay, iDEAL, Bancontact |
| Inventory | Basic but sufficient for birth cards |
| Cost | **€5/mo** (Starter plan) + **5% transaction fee** |
| Maintenance | Very low — Shopify handles everything |
| Fulfillment | Access to Shopify's fulfillment network + manual fulfillment |

**How the flow would work**:
1. Customer visits Madam Sam website (Vue app)
2. Browses gallery, selects a card, customizes it with AI
3. Clicks "Order this card" → Shopify Buy Button opens cart/checkout
4. Customer completes payment via Shopify checkout
5. Order appears in Shopify admin for fulfillment
6. The customized card image is sent/linked for printing

**Limitations**:
- 5% transaction fee is relatively high (drops to 2% on Basic plan at €36/mo)
- Checkout is a popup/redirect — not fully inline
- Need to handle passing the customized card data to the order (via line item properties or metafields)

---

### 3. Snipcart (Headless Cart)

**How it would work**: Add Snipcart's JS library to the Vue app. Define products via HTML data attributes or their JS API. Snipcart provides a full cart UI, checkout, and payment processing as an overlay on your site.

| Aspect | Assessment |
|--------|-----------|
| Vue integration | **Excellent** — Snipcart is built with Vue.js itself |
| Checkout | Great — overlay cart/checkout on your site, fully customizable |
| Order management | Good — Snipcart dashboard for orders |
| Payment processing | Good — Stripe, PayPal, Square, Mollie (good for BE/NL) |
| Inventory | Basic inventory management included |
| Cost | **2% per transaction** or **€20/mo minimum** (whichever is higher) + payment gateway fees |
| Maintenance | Very low — just a JS include |
| Customization | Very high — Vue-based, can customize cart UI with CSS/templates |

**How the flow would work**:
1. Customer visits Madam Sam website (Vue app)
2. Browses gallery, selects a card, customizes it with AI
3. Clicks "Order this card" → Snipcart cart slides in with product details
4. Customer checks out within the same page experience
5. Order appears in Snipcart dashboard
6. Custom card data (image URL, configuration) attached as custom fields

**Key advantage**: The cart/checkout stays on your site — no popups or redirects. Feels native.

**Limitations**:
- Smaller ecosystem than Shopify
- 2% fee on top of payment gateway fees can add up
- Less sophisticated fulfillment/shipping features than Shopify

---

### 4. Shopify Hydrogen (Full Headless)

**How it would work**: Build a completely custom storefront using Shopify's Hydrogen framework (React-based), integrate the Vue configurator within it.

| Aspect | Assessment |
|--------|-----------|
| Flexibility | Maximum |
| Cost | Shopify Basic (€36/mo) minimum + hosting on Oxygen |
| Development effort | **Very high** — essentially rebuilding the frontend |
| Maintenance | High — custom code to maintain |

**Verdict**: Overkill. This is for large e-commerce operations. The development cost alone ($50K-$500K+ according to Shopify's own estimates) doesn't match the scale of a birth card business.

---

### 5. WooCommerce (WordPress)

**How it would work**: Migrate the Wix website to WordPress, use WooCommerce for e-commerce, embed the Vue configurator.

| Aspect | Assessment |
|--------|-----------|
| Vue integration | Moderate — can embed via shortcode/block |
| Ecosystem | Huge — thousands of plugins |
| Cost | Hosting (~€10-30/mo) + WooCommerce is free + payment gateway fees |
| Maintenance | **High** — WordPress updates, security patches, plugin conflicts |
| Development | Moderate — need to rebuild Wix content in WordPress |

**Verdict**: Solid but heavy. Requires migrating away from Wix and maintaining a WordPress installation. Too much operational overhead for what we need.

---

### 6. Medusa.js (Open Source Headless)

**How it would work**: Self-host Medusa.js as the commerce backend, integrate its APIs into the Vue app.

| Aspect | Assessment |
|--------|-----------|
| Flexibility | Maximum — open source, fully customizable |
| Cost | Free software, but need to host it (~€20-50/mo) |
| Development | **High** — need to build checkout UI, integrate APIs |
| Maintenance | High — self-hosted, you manage everything |

**Verdict**: Too much custom development. Great for developers who want full control, but contradicts the goal of using existing software.

---

## Comparison Matrix

| Criteria | Wix Embed | Shopify Buy Button | Snipcart | Hydrogen | WooCommerce | Medusa |
|----------|-----------|-------------------|----------|----------|-------------|--------|
| Vue integration | 2/5 | 4/5 | **5/5** | 3/5 | 3/5 | 4/5 |
| Checkout UX | 2/5 | 4/5 | **5/5** | 5/5 | 4/5 | 4/5 |
| Order management | 3/5 | **5/5** | 4/5 | 5/5 | 5/5 | 4/5 |
| Payment options (BE) | 3/5 | **5/5** | 4/5 | 5/5 | 4/5 | 3/5 |
| Low cost | 3/5 | **4/5** | 4/5 | 2/5 | 3/5 | 3/5 |
| Low maintenance | 4/5 | **5/5** | **5/5** | 2/5 | 2/5 | 1/5 |
| Dev effort needed | 3/5 | **4/5** | **4/5** | 1/5 | 2/5 | 1/5 |
| Scalability | 2/5 | **5/5** | 3/5 | 5/5 | 4/5 | 5/5 |
| **Total** | **22** | **36** | **34** | **28** | **27** | **25** |

---

## Recommended Approach: Shopify Buy Button + Snipcart as Alternative

### Primary Recommendation: **Snipcart**

For Madam Sam specifically, **Snipcart** is the best fit:

1. **Built with Vue.js** — natural integration with your existing Vue 3 app
2. **Stays on your site** — cart/checkout overlays your app, no redirects. The customer never leaves the configurator experience
3. **Minimal code changes** — add Snipcart JS, add a "buy" button after card customization, done
4. **Custom fields** — attach the customized card image URL and configuration details to each order
5. **Mollie integration** — excellent for Belgian payment methods (Bancontact, iDEAL, credit cards)
6. **Cost-effective** — 2% transaction fee or €20/mo minimum, reasonable for a small business
7. **No migration needed** — your Wix website stays as-is for marketing/branding, the Vue configurator app with Snipcart handles the actual product experience

### Strong Alternative: **Shopify Buy Button**

If you anticipate growth, need more sophisticated fulfillment, or want a proven enterprise ecosystem:

1. **€5/mo** to start (Starter plan), upgrade as you grow
2. **Better order management** — Shopify's admin is best-in-class
3. **Shipping/fulfillment** — built-in label printing, tracking, fulfillment networks
4. **Scale-ready** — seamlessly upgrade from Starter → Basic → Shopify as volume grows
5. **Works on any site** — Buy Button JS SDK integrates into Vue, Wix, anywhere

---

## Implementation Plan (Snipcart)

### Phase 1: Snipcart Setup (1-2 days)
- Create Snipcart account, configure payment gateway (Mollie for Belgium)
- Add Snipcart JS library to the Vue app's `index.html`
- Configure product validation endpoint on the Express backend

### Phase 2: Buy Flow in Vue App (2-3 days)
- Add "Order this card" button to `EditorView.vue` after customization
- On click: trigger card download/save, then add to Snipcart cart with:
  - Product name (card template name)
  - Price
  - Custom fields: edited image URL, text overlays config, layer config
- Style the Snipcart cart to match Madam Sam branding

### Phase 3: Order Fulfillment Backend (2-3 days)
- Add Snipcart webhook endpoint to Express backend
- On `order.completed`: save final high-res composite image for printing
- Store order details (customer info, card config) in a simple database
- Send order confirmation email with preview

### Phase 4: Wix Website Connection (1 day)
- Add a prominent "Customize Your Card" button/link on the Wix website
- Link opens the Vue configurator app (hosted on Vercel/Netlify/similar)
- Customer flow: Wix landing page → Vue configurator → Snipcart checkout → done

### Phase 5: Testing & Launch (1-2 days)
- End-to-end testing of the full flow
- Test payments in Snipcart test mode
- Mobile responsiveness testing
- Go live

**Total estimated effort: ~7-11 days of development**

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  Wix Website                         │
│              (madamsam.be or similar)                 │
│                                                      │
│   Marketing / About / Portfolio / Contact             │
│                                                      │
│   [Customize Your Card →] ─── link to Vue app        │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│           Vue 3 Configurator App                     │
│         (hosted on Vercel/Netlify)                   │
│                                                      │
│   ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│   │  Gallery  │→│  Editor   │→│  Order + Checkout │  │
│   │  Browse   │  │  AI Edit  │  │  (Snipcart)      │  │
│   │  cards    │  │  Text     │  │                   │  │
│   │          │  │  Layers   │  │  Cart overlay     │  │
│   └──────────┘  └──────────┘  │  Payment           │  │
│                               │  Confirmation      │  │
│                               └──────────────────┘  │
└─────────────────┬───────────────────────────────────┘
                  │ API calls
                  ▼
┌─────────────────────────────────────────────────────┐
│           Express Backend                            │
│      (hosted on Railway/Render/DigitalOcean)         │
│                                                      │
│   /api/cards          - Card templates               │
│   /api/edit           - AI editing (Claude+Replicate)│
│   /api/generate-layer - Image layers                 │
│   /api/download       - Composite image              │
│   /api/fonts          - Available fonts              │
│   /api/snipcart/*     - Product validation           │
│   /api/webhooks       - Order webhooks               │
└─────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│           Snipcart                                   │
│                                                      │
│   - Payment processing (via Mollie)                  │
│   - Order management dashboard                       │
│   - Customer management                              │
│   - Shipping/tax calculation                         │
│   - Email notifications                              │
└─────────────────────────────────────────────────────┘
```

---

## Cost Estimate

| Item | Monthly Cost |
|------|-------------|
| Snipcart | €20/mo (or 2% of sales if > €1000/mo) |
| Mollie payment gateway | No monthly fee, ~1.8% + €0.25 per transaction |
| Vue app hosting (Vercel/Netlify) | Free tier or ~€0-20/mo |
| Express backend hosting (Railway/Render) | ~€5-20/mo |
| Replicate API (image editing) | Pay per use (~€0.01-0.05 per edit) |
| Anthropic API (Claude) | Pay per use (~€0.01 per prompt) |
| **Total fixed costs** | **~€25-60/mo** |
| **Per transaction** | **~3.8% + €0.25** (Snipcart 2% + Mollie ~1.8%) |

---

## Decision Summary

**Go with Snipcart** because:
- It integrates natively into your Vue app with minimal changes
- The checkout experience stays on-site (no redirects to external pages)
- It handles payments, orders, and tax — you don't build any of that
- Your Wix website stays as-is for marketing, just links to the configurator
- Total cost is reasonable and predictable
- If you outgrow Snipcart later, migrating to Shopify Buy Button is straightforward

**Keep the Wix website** for what it's good at: marketing, branding, contact pages, SEO content. Don't try to force the configurator into Wix — instead, link from Wix to the standalone Vue app where the magic happens.
