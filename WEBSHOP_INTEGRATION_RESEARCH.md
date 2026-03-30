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

**Additional Wix limitations discovered**:
- Since January 2025, Wix restricts access to `localStorage`, `sessionStorage`, cookies, and cache in Custom Elements and iFrames
- Custom Elements require compiling Vue to a Web Component in a single bundled JS file
- Wix Velo does NOT support importing Vue/React — only vanilla JS and Wix APIs
- Checkout page cannot be customized in the editor
- Product limits: Core plan 25 products, Business 250

**Verdict**: **Not recommended.** The iframe limitations make the configurator experience feel broken and disconnected from the checkout. The two systems (Vue app + Wix eCommerce) can't communicate cleanly.

---

### 2. ~~Shopify Buy Button~~ (DEPRECATED)

> **WARNING**: The Shopify Buy Button JS SDK was **deprecated in January 2025**. Support for the final v3.0 release ended **January 1, 2026**. This is no longer a viable option.

Shopify has replaced it with **Storefront Web Components** (see option 3).

---

### 3. Shopify Storefront Web Components (NEW — RECOMMENDED)

**What it is**: Shopify's brand-new way to embed commerce on any website. Uses standard HTML Web Components — no framework dependency, no shadow DOM, fully styleable with CSS.

**How it would work**: Add `<shopify-store>` and `<shopify-context>` components to your Vue app. They query Shopify's Storefront API automatically and render product data, cart, and checkout as regular DOM nodes you can style however you want.

| Aspect | Assessment |
|--------|-----------|
| Vue integration | **Excellent** — standard Web Components work natively in Vue 3 |
| Checkout | **Excellent** — Shopify's PCI-compliant hosted checkout |
| Order management | **Excellent** — full Shopify admin dashboard |
| Payment processing | **Excellent** — Shopify Payments, Apple Pay, Google Pay, iDEAL, Bancontact |
| Styling control | **Excellent** — no shadow DOM, pure CSS styling |
| Inventory | Full Shopify inventory management |
| Cost | **€5/mo** (Starter plan) + **5% transaction fee** |
| Maintenance | **Very low** — Shopify maintains the components |
| Long-term viability | **Excellent** — actively developed by Shopify, their strategic direction |
| Fulfillment | Access to Shopify's fulfillment network + manual fulfillment |

**Key technical details**:
- Components are intentionally un-opinionated about styling
- They use web components as a templating language to generate GraphQL queries to Shopify
- No shadow roots — you have full CSS control
- Three types of components:
  - **Basic**: `<shopify-data>`, `<shopify-money>`, `<shopify-media>` for elementary data display
  - **Advanced**: `<shopify-variant-selector>`, `<shopify-cart>`, `<shopify-list-context>` for complex logic
  - **Context**: `<shopify-store>`, `<shopify-context>` for store configuration
- Interactive playground available at [webcomponents.shopify.dev/playground](https://webcomponents.shopify.dev/playground)

**How the customer flow would work**:
1. Customer visits Madam Sam website (Vue app, linked from Wix site)
2. Browses gallery, selects a card, customizes it with AI
3. Clicks "Order this card" → `<shopify-cart>` component adds the configured card
4. Cart UI appears (styled to match Madam Sam branding)
5. Customer clicks checkout → redirected to Shopify's hosted checkout
6. Completes payment (Bancontact, credit card, etc.)
7. Order appears in Shopify admin for fulfillment
8. Customized card image is attached via line item properties or metafields

---

### 4. Shopify Storefront API (Direct GraphQL)

**How it would work**: Instead of using pre-built Web Components, call Shopify's Storefront GraphQL API directly from your Vue app using `fetch` or a GraphQL client. Build your own cart/checkout UI components in Vue.

| Aspect | Assessment |
|--------|-----------|
| Vue integration | **Excellent** — full control, build everything in Vue |
| Flexibility | **Maximum** — you design every pixel |
| Checkout | Shopify hosted checkout (redirect via `checkoutUrl`) |
| Development effort | **Moderate** — need to build cart UI, handle GraphQL queries |
| Cost | Same as Storefront Web Components (Shopify plan fees) |

**Best for**: If the Web Components don't give you enough control and you want to build a fully custom cart experience in Vue.

**Current API version**: `2026-01`, updated quarterly.

---

### 5. ~~Snipcart~~ (MAINTENANCE MODE — NOT RECOMMENDED)

> **WARNING**: Snipcart was acquired by Duda in 2021. Their blog has been dead since 2022, social media accounts dormant for 2+ years, and GitHub repos mostly inactive since 2023-2024. While still processing transactions and growing in store count (7.9% QoQ in 2025 Q1), the platform appears to be in maintenance mode with no major new features being developed.

| Aspect | Assessment |
|--------|-----------|
| Vue integration | Excellent — built with Vue.js |
| Long-term viability | **Concerning** — no public development activity since 2022 |
| Cost | 2% per transaction or €20/mo minimum |
| Checkout | Good — overlay cart on your site |

**Verdict**: **Risky choice.** While the product works today, betting your business on a platform with no visible development activity for 3+ years is unwise. If Duda decides to sunset Snipcart, you'd need to migrate under pressure.

---

### 6. WooCommerce (WordPress)

**How it would work**: Migrate the Wix website to WordPress, use WooCommerce for e-commerce, embed the Vue configurator.

| Aspect | Assessment |
|--------|-----------|
| Vue integration | Moderate — can embed via shortcode/block or use headless API |
| Ecosystem | Huge — thousands of plugins |
| Cost | Hosting (~€10-30/mo) + WooCommerce is free + payment gateway fees |
| Maintenance | **High** — WordPress updates, security patches, plugin conflicts |
| Development | Moderate — need to rebuild Wix content in WordPress |

**Verdict**: Solid but heavy. Requires migrating away from Wix and maintaining a WordPress installation. Too much operational overhead for what we need.

---

### 7. Medusa.js (Open Source Headless)

**How it would work**: Self-host Medusa.js as the commerce backend, integrate its APIs into the Vue app.

| Aspect | Assessment |
|--------|-----------|
| Flexibility | Maximum — open source, fully customizable |
| Cost | Free software, but self-hosted TCO: €66K-€144K first year |
| Development | **Very high** — need to build checkout UI, integrate APIs |
| Maintenance | Very high — self-hosted, you manage everything |

**Verdict**: Massive overkill for a birth card business. Great for large-scale custom platforms, not for this use case.

---

## Comparison Matrix

| Criteria | Wix Embed | Shopify Web Components | Shopify Storefront API | Snipcart | WooCommerce | Medusa |
|----------|-----------|----------------------|----------------------|----------|-------------|--------|
| Vue integration | 2/5 | **5/5** | **5/5** | 5/5 | 3/5 | 4/5 |
| Checkout UX | 2/5 | **5/5** | 4/5 | 4/5 | 4/5 | 3/5 |
| Order management | 3/5 | **5/5** | **5/5** | 3/5 | 5/5 | 4/5 |
| Payment options (BE) | 3/5 | **5/5** | **5/5** | 4/5 | 4/5 | 3/5 |
| Low cost | 3/5 | **5/5** | **5/5** | 4/5 | 3/5 | 2/5 |
| Low maintenance | 4/5 | **5/5** | 4/5 | 4/5 | 2/5 | 1/5 |
| Dev effort needed | 3/5 | **5/5** | 3/5 | 4/5 | 2/5 | 1/5 |
| Long-term viability | 3/5 | **5/5** | **5/5** | 2/5 | 4/5 | 3/5 |
| **Total** | **23** | **40** | **36** | **30** | **27** | **21** |

---

## RECOMMENDED APPROACH: Shopify Storefront Web Components

### Why Shopify Storefront Web Components is the clear winner

1. **Brand new & actively developed** — this is Shopify's strategic direction, replacing the deprecated Buy Button
2. **Works natively in Vue 3** — standard Web Components are first-class citizens in Vue
3. **No shadow DOM** — you have full CSS control to match Madam Sam's branding
4. **Minimal code** — add HTML components, Shopify handles the GraphQL queries automatically
5. **€5/month** — Shopify Starter plan gives you everything: checkout, order management, inventory, payments
6. **Belgian payment methods** — Shopify Payments supports Bancontact, iDEAL, credit cards, Apple Pay
7. **Trusted checkout** — Shopify's hosted checkout is PCI-compliant with best-in-class conversion rates
8. **Scale-ready** — upgrade from Starter → Basic (€36/mo, lower 2% fees) as volume grows
9. **Wix site stays as-is** — keep it for marketing, link to the Vue configurator for the product experience
10. **Future-proof** — Shopify is investing heavily here (MCP integration, AI commerce, etc.)

### Upgrade path

Start with **Storefront Web Components** for speed. If you later need more control over the cart UI (custom animations, complex pricing logic, etc.), you can progressively migrate to **direct Storefront API calls** from Vue — same Shopify backend, same plan, just more custom frontend code.

---

## Implementation Plan

### Phase 1: Shopify Setup (1 day)
- Create Shopify account (Starter plan, €5/mo)
- Enable Shopify Payments (configure for Belgium: Bancontact, credit cards)
- Create products in Shopify admin for each card template
- Set up the Headless sales channel to get Storefront API access tokens
- Configure tax settings for Belgium/EU

### Phase 2: Storefront Web Components Integration (2-3 days)
- Add Shopify Storefront Web Components script to Vue app's `index.html`
- Add `<shopify-store>` provider component wrapping the app
- Create an "Order" step in `EditorView.vue` after customization:
  - Display configured card preview
  - Show price via `<shopify-money>`
  - "Add to Cart" button → `<shopify-cart>` component
- Style all Shopify components with Tailwind CSS to match Madam Sam branding
- Handle custom product data (attach the edited card image URL as a line item property)

### Phase 3: Order Fulfillment Flow (2-3 days)
- Add Shopify webhook endpoint to Express backend (`order/created`)
- On new order: generate final high-res composite image (text + layers merged)
- Store the print-ready file and link it to the Shopify order via metafields
- Set up email notifications (order confirmation with card preview)
- Manual fulfillment workflow in Shopify admin

### Phase 4: Wix Website Connection (1 day)
- Add prominent "Customize Your Card" CTA on the Wix website
- Link opens the Vue configurator app (hosted on Vercel/Netlify)
- Customer flow: Wix landing page → Vue configurator → Shopify checkout → done

### Phase 5: Testing & Launch (1-2 days)
- End-to-end testing in Shopify test mode
- Test Belgian payment methods (Bancontact, credit card)
- Mobile responsiveness testing
- Go live: switch Shopify to live mode

**Total estimated effort: ~7-10 days of development**

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
│   │  Browse   │  │  AI Edit  │  │                   │  │
│   │  cards    │  │  Text     │  │ <shopify-cart>    │  │
│   │          │  │  Layers   │  │ <shopify-money>   │  │
│   └──────────┘  └──────────┘  │  → Shopify checkout│  │
│                               └──────────────────┘  │
│                                                      │
│   <shopify-store domain="..." token="...">           │
│     (wraps entire app, provides Shopify context)     │
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
│   /api/webhooks       - Shopify order webhooks       │
└─────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│           Shopify (Starter Plan - €5/mo)             │
│                                                      │
│   - Product catalog (card templates + pricing)       │
│   - Storefront API (GraphQL, Web Components)         │
│   - Hosted checkout (PCI-compliant)                  │
│   - Shopify Payments (Bancontact, credit cards, etc) │
│   - Order management dashboard                       │
│   - Inventory tracking                               │
│   - Tax calculation (EU VAT)                         │
│   - Email notifications                              │
│   - Webhooks for order automation                    │
└─────────────────────────────────────────────────────┘
```

---

## Cost Estimate

| Item | Monthly Cost |
|------|-------------|
| Shopify Starter plan | €5/mo |
| Shopify Payments processing | ~2.9% + €0.25 per transaction (Basic) or 5% (Starter) |
| Vue app hosting (Vercel/Netlify) | Free tier or ~€0-20/mo |
| Express backend hosting (Railway/Render) | ~€5-20/mo |
| Replicate API (image editing) | Pay per use (~€0.01-0.05 per edit) |
| Anthropic API (Claude) | Pay per use (~€0.01 per prompt) |
| **Total fixed costs** | **~€10-45/mo** |
| **Per transaction (Starter)** | **5%** (upgrade to Basic at €36/mo for 2.9% + €0.25) |

### When to upgrade from Starter to Basic
At ~€720/mo in sales, the Basic plan (€36/mo, 2.9% fees) becomes cheaper than Starter (€5/mo, 5% fees). This is a natural upgrade point as volume grows.

---

## Decision Summary

**Go with Shopify Storefront Web Components** because:
- It's Shopify's newest, actively developed solution — replacing the deprecated Buy Button
- Standard Web Components integrate seamlessly with Vue 3
- Full CSS control (no shadow DOM) lets you match Madam Sam's branding perfectly
- €5/mo gets you world-class checkout, order management, and Belgian payment methods
- Your Wix website stays as-is — just links to the configurator
- Clear upgrade path as the business scales
- Future-proof: Shopify is investing heavily in this direction (AI/MCP integration in 2026)

**Keep the Wix website** for marketing and branding. **Host the Vue configurator** separately with Shopify Web Components for the purchase flow. This gives you the best of both worlds without fighting any platform's limitations.
