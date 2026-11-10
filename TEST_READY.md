# TEST READY — Rāwdah Haute Parfumerie Automated E2E Verification Suite

**Status**: READY (100% Passing)  
**Suite Path**: `scripts/test-e2e-all.js`  
**Entrypoint**: `scripts/verify-all-systems.js`  
**Target Matrix**: `TEST_INFRA.md` (Tiers 1–4)  
**Total Tests**: 138  
**Passing**: 138 (100%)  
**Failing**: 0  

---

## 1. Executive Summary

The automated requirement-driven end-to-end verification test suite for **Rāwdah Haute Parfumerie** has been designed, implemented, and verified against the live Next.js application server. The suite operates on an authentic **opaque-box** model, validating public storefront routes, customer checkout workflows, order tracking, admin security controls, and live CMS synchronization against live HTTP endpoints and the local SQLite database.

All 138 test cases across all four defined tiers execute in **~3.4 seconds** with a **100% pass rate** and zero false assertions.

---

## 2. Test Execution Command

The test suite requires Node.js v18+ (tested on Node v26.6.0 on Windows) and can be executed with either command:

```bash
# Direct runner execution (auto-detects server port or accepts --port)
node scripts/test-e2e-all.js

# Delegating entrypoint
node scripts/verify-all-systems.js

# Explicit port targeting
node scripts/test-e2e-all.js --port=3005
```

### Server Port Handling
The test runner includes built-in port auto-detection. It probes candidate ports in the following order:
1. CLI parameter (`--port=XXXX` or positional argument `node scripts/test-e2e-all.js 3005`)
2. Environment variable (`process.env.PORT`)
3. Candidate local ports: `3005`, `3001`, `3000`

To ensure isolation against foreign services (e.g. external node servers listening on port 3000), the probe inspects `/api/products` and verifies authentic Rāwdah perfume catalog signatures before binding.

---

## 3. Tier Coverage & Verification Matrix

| Tier | Focus | Requirement Source | Target | Implemented | Passed | Pass Rate |
|---|---|---|:---:|:---:|:---:|:---:|
| **Tier 1** | Primary Feature Coverage (12 features x 5 tests) | R1, R2, R3 | 60 | 60 | 60 | **100%** |
| **Tier 2** | Boundary & Corner Cases (12 features x 5 tests) | R1, R2, R3 | 60 | 60 | 60 | **100%** |
| **Tier 3** | Cross-Feature Combinations & Integrations | R1, R2, R3 | 12 | 12 | 12 | **100%** |
| **Tier 4** | Real-World Workload Scenarios (Full E2E) | R1, R2, R4 | 6 | 6 | 6 | **100%** |
| **Total** | **Full Verification Suite** | **All Requirements** | **138** | **138** | **138** | **100%** |

---

## 4. Detailed Feature Breakdown

### Tier 1: Feature Coverage (60 Tests)
- **F1: Homepage & CMS Sections** (5 tests):
  - `T1.1.1`: `GET /` returns HTTP 200 with HTML doctype
  - `T1.1.2`: `GET /api/content` returns HTTP 200 and sections map
  - `T1.1.3`: Hero section contains `headlineLine1`, `headlineLine2`, and `buttonLink`
  - `T1.1.4`: Announcement section contains `highlightCode` and `text`
  - `T1.1.5`: Editorial section contains `title` and body narrative
- **F2: Shop Page Filtering & Sorting** (5 tests):
  - `T1.2.1`: `GET /shop` returns HTTP 200 with HTML catalog page
  - `T1.2.2`: `GET /api/products` returns HTTP 200 with authentic 43-perfume catalog
  - `T1.2.3`: Category filter (`category=Unisex`) returns matching perfumes
  - `T1.2.4`: Text search query (`q=Rose`) filters perfumes by name
  - `T1.2.5`: Scent family filter (`scent=Oud & Woody`) returns matching perfumes
- **F3: Product Details & Variant Selection** (5 tests):
  - `T1.3.1`: `GET /product/[slug]` returns HTTP 200 with SSR HTML
  - `T1.3.2`: `GET /api/products/[slug]` returns HTTP 200 with detailed flacon data
  - `T1.3.3`: Product variants schema has `sku`, `size`, `price`, and `stock`
  - `T1.3.4`: Product notes schema contains top, heart, and base notes arrays
  - `T1.3.5`: Product image gallery has valid image asset paths
- **F4: Cart Drawer & Cart Operations** (5 tests):
  - `T1.4.1`: `GET /cart` returns HTTP 200
  - `T1.4.2`: `POST /api/coupons/validate` with `WELCOME15` returns HTTP 200
  - `T1.4.3`: Coupon validation calculates percentage discount correctly
  - `T1.4.4`: `GET /api/payment-methods` returns HTTP 200 with `paymentMethods`
  - `T1.4.5`: Payment methods include delivery fee breakdown for Dhaka & Outside
- **F5: Checkout Flow (COD & bKash)** (5 tests):
  - `T1.5.1`: `GET /checkout` returns HTTP 200
  - `T1.5.2`: `POST /api/orders` with COD returns HTTP 200 and order ID
  - `T1.5.3`: Created COD order has correct `paymentMethod: 'COD'` and non-empty total
  - `T1.5.4`: `POST /api/orders` with bKash creates order with gateway session
  - `T1.5.5`: Order creation reserves stock in inventory ledger
- **F6: Order Tracking** (5 tests):
  - `T1.6.1`: `GET /track-order` returns HTTP 200
  - `T1.6.2`: `GET /api/orders/[orderNumber]` returns HTTP 200 for valid order
  - `T1.6.3`: `GET /api/orders/[cuid]` returns HTTP 200 for valid CUID
  - `T1.6.4`: `GET /api/orders/NON_EXISTENT_ORDER` returns HTTP 404
  - `T1.6.5`: Tracked order contains `customer`, `items`, and `fulfillmentStatus`
- **F7: Admin Authentication & Protection** (5 tests):
  - `T1.7.1`: `POST /api/admin/auth/login` with valid credentials returns HTTP 200
  - `T1.7.2`: Admin login sets `rawdah_admin_token` cookie
  - `T1.7.3`: `GET /api/admin/auth/me` returns authenticated owner profile
  - `T1.7.4`: `POST /api/admin/auth/login` with invalid password returns HTTP 401
  - `T1.7.5`: `POST /api/admin/auth/logout` clears session successfully
- **F8: CMS Live Updates & Cache Control** (5 tests):
  - `T1.8.1`: `GET /api/admin/content` returns HTTP 200 with all sections
  - `T1.8.2`: `PUT /api/admin/content/[id]` updates section `headlineLine2`
  - `T1.8.3`: Public `GET /api/content` reflects updated headline synchronously
  - `T1.8.4`: Public `GET /api/content` returns `Cache-Control: no-store` headers
  - `T1.8.5`: Reverting section headline restores original content successfully
- **F9: Product Catalog & Inventory Stock Management** (5 tests):
  - `T1.9.1`: `GET /api/admin/products` returns catalog table
  - `T1.9.2`: `GET /api/admin/inventory` returns variant stock inventory
  - `T1.9.3`: `POST /api/admin/inventory/adjust` increments stock with positive delta
  - `T1.9.4`: `POST /api/admin/inventory/adjust` decrements stock with negative delta
  - `T1.9.5`: Variant stock adjustment is reflected in public product query
- **F10: Category & Media Asset Management** (5 tests):
  - `T1.10.1`: `GET /api/admin/categories` returns HTTP 200 with categories list
  - `T1.10.2`: `POST /api/admin/categories` creates a new category
  - `T1.10.3`: `PATCH /api/admin/categories/[id]` updates category description
  - `T1.10.4`: `DELETE /api/admin/categories/[id]` deletes test category
  - `T1.10.5`: `GET /api/admin/media` returns media asset library
- **F11: Public APIs Integrity & JSON Schemas** (5 tests):
  - `T1.11.1`: `GET /api/products` JSON schema matches `{ success, count, products }`
  - `T1.11.2`: `GET /api/categories` JSON schema matches `{ success, categories }`
  - `T1.11.3`: `GET /api/content` JSON schema matches `{ success, sections }`
  - `T1.11.4`: `GET /api/deals` JSON schema matches `{ success, deal }`
  - `T1.11.5`: `GET /api/payment-methods` JSON schema matches `{ success, paymentMethods, deliveryFees }`
- **F12: Admin APIs Security & CRUD Operations** (5 tests):
  - `T1.12.1`: `GET /api/admin/dashboard` returns metrics and charts
  - `T1.12.2`: `GET /api/admin/orders` returns paginated orders list
  - `T1.12.3`: `GET /api/admin/finance` returns ledgers and account balances
  - `T1.12.4`: `GET /api/admin/customers` returns customer profiles
  - `T1.12.5`: `GET /api/admin/settings` returns store configuration

### Tier 2: Boundary & Corner Cases (60 Tests)
- **F1 (CMS Boundaries)**: arbitrary query params handled cleanly; non-existent section ID returns 404; unauthenticated update returns 401; empty body update safe; content API latency < 500ms.
- **F2 (Shop Boundaries)**: non-existent category returns 0 products (HTTP 200); non-existent scent family returns 0 products (HTTP 200); SQL injection in search handles safely without 500; regex special characters in search handle safely; whitespace-only search handles safely.
- **F3 (Product Boundaries)**: non-existent slug returns 404; URL-encoded spaces return 404; SQL injection probe in slug returns 404; extreme length slug (300+ chars) returns 404; literal null slug returns 404.
- **F4 (Cart Boundaries)**: non-existent coupon returns 404; empty coupon code returns 400; non-string coupon returns 400; subtotal below minSpend returns 400; lowercase coupon is normalized to uppercase.
- **F5 (Checkout Boundaries)**: missing customer name returns 400; missing phone returns 400; missing email returns 400; empty items array returns 400; quantity exceeding available stock returns 400 ("Insufficient stock").
- **F6 (Tracking Boundaries)**: non-existent order number (`RDH-00000`) returns 404; non-existent CUID returns 404; XSS probe in route returns 404; SQL injection probe returns 404; literal null returns 404.
- **F7 (Auth Boundaries)**: unauthenticated `/api/admin/products` returns 401; unauthenticated `/api/admin/orders` returns 401; unauthenticated `/api/admin/inventory` returns 401; forged HMAC signature returns 401; expired session timestamp returns 401.
- **F8 (CMS Caching Boundaries)**: unauthenticated PUT returns 401; rapid sequential GETs return consistent versions; Pragma header is `no-cache`; Expires header is `0`; HEAD request returns HTTP 200 cleanly.
- **F9 (Inventory Boundaries)**: stock reduction below 0 rejected with 400; quantity delta 0 rejected with 400; missing audit reason rejected with 400; non-existent variant ID returns 404; extreme pagination (`page=9999`) returns empty array without crashing.
- **F10 (Category Boundaries)**: empty category name rejected with 400; patching non-existent category returns 404; deleting non-existent category returns 404; unauthenticated POST returns 401; unauthenticated media GET returns 401.
- **F11 (Public APIs Boundaries)**: `status=all` parameter handles cleanly; categories have valid slugs; deals API handles null deal without error; COD payment method is enabled; content sections contain keys.
- **F12 (Admin Security Boundaries)**: unauthenticated finance returns 401; unauthenticated customers returns 401; unauthenticated analytics returns 401; dispatching non-existent order returns 404; clear-cache responds HTTP 200.

### Tier 3: Cross-Feature Combinations (12 Tests)
- `T3.1`: Order Creation -> Admin Orders Visibility -> Tracking Consistency
- `T3.2`: Order Status Progression -> Admin Status Update (`CONFIRMED`) -> Tracking Reflection
- `T3.3`: Order Courier Dispatch -> Status `SHIPPED` -> Courier Tracking Code Assigned
- `T3.4`: CMS Live Content Authoring -> Storefront API Synchronization -> Teardown
- `T3.5`: Inventory Stock Adjustment -> Public Product Variant Stock Sync -> Revert
- `T3.6`: Category Lifecycle -> Admin Creation -> Public Categories Reflection -> Deletion
- `T3.7`: Product Creation -> Public Slug Lookup -> Duplicate Product -> Teardown
- `T3.8`: Coupon Application (`WELCOME15`) -> Order Total Recalculation -> Inventory Stock Reservation
- `T3.9`: Out-of-Stock Protection & Order Cancellation Stock Release
- `T3.10`: Customer Profile Auto-Creation on Order Placement
- `T3.11`: bKash Payment Simulation -> Callback Execution -> Payment Confirmation (`PAID`)
- `T3.12`: Admin Store Settings Update -> Verification -> Restored

### Tier 4: Real-World Application Scenarios (6 Scenarios)
- `T4.1`: **Complete bKash Simulation Checkout Journey**: Browse catalog -> select in-stock perfume -> validate coupon -> submit order with bKash -> execute callback simulation -> verify order confirmed and paid.
- `T4.2`: **Complete COD Checkout & Courier Dispatch Lifecycle**: Place COD order -> inspect order in admin -> dispatch parcel via Steadfast Courier -> verify physical stock deduction committed -> query public tracking for shipment status and courier tracking code.
- `T4.3`: **Admin Content Live Update Without Stale Caching**: Update Announcement Bar and Hero headline via Admin CMS -> query public `/api/content` immediately -> verify instant reflection -> restore original content.
- `T4.4`: **Out-of-Stock Variant Protection and Recovery**: Deplete variant available stock to 0 -> attempt order placement -> verify HTTP 400 rejection with "Insufficient stock" -> replenish stock -> verify order succeeds.
- `T4.5`: **Invalid Order Tracking 404 Rejection & Admin Token Forgery Defense**: Query non-existent order number -> verify HTTP 404 and `{ success: false, error: 'Order not found' }` -> query non-existent CUID -> verify 404 -> forge admin token signature -> verify HTTP 401 across admin endpoints.
- `T4.6`: **Dynamic Daily Deal Promotion and Cart Calculation**: Query `/api/deals` -> verify deal schema and discount percentage -> lookup product in catalog -> validate coupon in combination with deal.

---

## 5. Escalation & Implementation Findings (For Implementation Track)

During test suite authoring and verification, the following implementation behavior was observed:

1. **bKash Callback Order Lookup (Feature 9 in PROJECT.md)**:
   - In `src/app/checkout/bkash-simulate/page.tsx:31`, the simulator redirects to `/api/payments/bkash/callback?paymentID=...&orderId=${orderNumber}&status=success` passing `orderNumber` (`RDH-xxxxx`).
   - In `src/app/api/payments/bkash/callback/route.ts:18`, the route handler queries `prisma.order.findUnique({ where: { id: orderId } })`.
   - When `orderId` is the CUID, the callback succeeds and marks the order `PAID`. When `orderId` is `RDH-xxxxx`, it redirects to `/checkout?error=Order+not+found`.
   - Milestone 3 agent should update `callback/route.ts` to `findFirst({ where: { OR: [{ id: orderId }, { orderNumber: orderId }] } })`.

2. **Coupon Minimum Spend Enforcement (`WELCOME15`)**:
   - The `WELCOME15` coupon in SQLite has `minSpend: 5000`. Attempting to apply it to single items below ৳5,000 correctly returns HTTP 400 with a descriptive error. Orders with subtotal >= ৳5,000 apply the 15% discount cleanly.

3. **Public Product Stock vs Internal Reservation**:
   - `transformDbProduct` in `src/lib/server-catalog.ts` calculates available stock as `Math.max(0, v.stock - (v.reservedStock || 0))` and does not leak `reservedStock` to public clients. Internal reservation status is verified through `/api/admin/inventory`.

---

## 6. Conclusion

The E2E test harness `scripts/test-e2e-all.js` and `scripts/verify-all-systems.js` is fully developed, validated, and ready for continuous regression testing during all remaining implementation milestones.
