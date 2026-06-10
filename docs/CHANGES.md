# CHANGES — Dropspy Frontend

Registro de cambios importantes. Cada entrada incluye fecha, qué cambió, por qué, y archivos afectados.

> **La fecha es el campo más importante.** Permite saber cuándo se hizo el cambio y correlacionarlo con lo que los usuarios ven en producción.

---

### CHANGE-008 — Refactorizar scraper: búsqueda por dominio con abandono temprano
**Fecha:** 2026-06-10
**Tipo:** refactor / performance

**Qué cambió:** El scraper de Meta Ad Library ya no navega al perfil del anunciante. Ahora se queda en la página de búsqueda por dominio y hace dos pasadas:
1. **Probe**: scroll hasta ~50 ads, verifica si alguno tiene una URL de destino que apunte al dominio de la tienda. Si ninguno apunta → abandono temprano (`⏭ usaimpor.shop — 50 ads revisados, ninguno apunta al dominio → skip`).
2. **Full scroll**: solo si hay match, carga todos los ads disponibles y los extrae.

El `advertiser_name` ahora se extrae por card individual en lugar de asignarse globalmente — soporta el caso donde múltiples anunciantes (p.ej. "Tendencias Colombia" + "Importaciones Usa") pautan el mismo dominio.

**Por qué:** El flujo anterior buscaba el anunciante, entraba a su perfil, scrapea TODOS sus ads (potencialmente 3500), y luego descartaba el 99%. El nuevo flujo evita la segunda navegación completa cuando la tienda no está pautando activamente.

**Archivos modificados:**
- `lib/scrapers/meta-ads.ts` — reescritura: eliminado `findAdvertiser` + navegación a perfil del anunciante; nueva función `probeSearchResults`; `extractAllAds` sin parámetro advertiser (extrae por card)
- `lib/jobs/sync-ads.ts` — removidas opciones `knownPageId`/`knownPageName` del call a `scrapeAdsForStore`

---

### CHANGE-007 — Ocultar origen de tienda en vista "Explorar testeos"
**Fecha:** 2026-06-10
**Tipo:** privacidad / fix

**Qué cambió:** En la sección de anuncios activos, cuando el contexto es `?from=pool` (Explorar testeos), se oculta la columna "Origen" — el nombre del anunciante y el dominio de la tienda. Solo queda visible la fecha de inicio del anuncio, que es información neutral. En vista propia (Mis testeos) sigue mostrando todo.

**Por qué:** Los datos de "Explorar testeos" pertenecen a otras cuentas de usuario. Mostrar el nombre del anunciante o el dominio de la tienda en ese contexto expone información privada de terceros.

**Archivos modificados:**
- `components/tracker/product-ads.tsx` — `showOrigin` prop en `AdRow`; `isFromPool` derivado de `useSearchParams`; header "Origen" condicional

---

### CHANGE-006 — Editor de tiendas: cambio de dominio, nombre y pago anticipado
**Fecha:** 2026-06-10
**Tipo:** feature

**Qué cambió:** El botón "Editar tienda" en el dropdown de cada fila de Stores ahora abre un modal funcional. Antes no hacía nada. El modal precarga los datos actuales de la tienda y permite cambiar nombre, dominio (baseUrl) y tipo de pago (pago anticipado). Al guardar llama `PUT /api/stores/:storeId` y refresca la lista automáticamente.

**Archivos modificados:**
- `app/(dashboard)/stores/components/EditStoreModal.tsx` — modal nuevo (creado)
- `app/(dashboard)/stores/components/StoreRow.tsx` — prop `onEdit` añadida y conectada al DropdownMenuItem
- `app/(dashboard)/stores/page.tsx` — estado `editingStore`, render del modal y `onEdit` en cada StoreRow
- `app/(dashboard)/stores/services/storeApi.ts` — nuevo endpoint `updateStore` (PUT)
- `app/(dashboard)/stores/types/index.ts` — nuevo tipo `UpdateStoreRequest`

**Relacionado con backend:** requiere que el backend tenga `PUT /api/stores/:storeId` implementado.

**Wiki actualizado:** No aplica.

---

### CHANGE-028 — Fix: sidebar activo incorrecto al navegar desde Explorar testeos
**Fecha:** 2026-06-09
**Tipo:** bugfix

**Qué cambió:** El sidebar resaltaba "Mis testeos" al navegar a `/tracker/[id]` desde "Explorar testeos", porque la lógica solo usaba `pathname.startsWith('/tracker')`. Ahora lee el query param `?from=` (ya presente en los links) para distinguir el origen.

**Archivos modificados:**
- `components/layout/app-sidebar.tsx` — agrega `useSearchParams`, lógica `isActive` diferenciada por `fromParam`

**Por qué:** Los links desde el pool ya incluían `?from=pool` y los del tracker `?from=tracker`, pero el sidebar no los leía.

---

### CHANGE-027 — Detección proactiva de cambio de dominio en sync

**Fecha:** 2026-06-09
**Archivos:** `lib/jobs/sync-ads.ts`

**Qué cambió:**
- `checkDomain` + `resolveNewDomain` reemplazados por `checkAndResolveDomain(storeId, domain)` — una sola función que sigue redirects HTTP directamente en `/products.json` (más confiable que root URL)
- Si el dominio final difiere del guardado → actualiza DB **proactivamente** durante la ventana de transición, antes de que el redirect venza
- Nueva función `markDomainError(storeId)` que llama `PATCH /internal/stores/{storeId}/domain-error`
- Cuando el dominio no responde Y no hay redirect → llama `markDomainError` + log `✗ dominio no verificado`

**Por qué:** Sin esto, cuando un dueño de tienda cambia su dominio en Shopify, Dropspy lo detecta solo cuando el dominio viejo muere — potencialmente semanas después. Con la nueva lógica lo detecta durante la ventana de transición (mientras el redirect aún vive) y actualiza automáticamente.

**Relacionado con backend:** FIX-020 (endpoint domain-error).

---

### CHANGE-026 — Smart scraping gate: saltar tiendas sin momentum

**Fecha:** 2026-06-09
**Archivos:** `lib/jobs/sync-ads.ts`

**Qué cambió:**
- Nuevo tipo `Candidate` con campos `score`, `label`, `daysSinceLastImprovement`
- Nueva función `shouldScrapeStore(candidates)` con dos reglas:
  - **Regla 1:** Si ningún candidato tiene score ≥ 20 ni label activo → skip ("sin candidatos activos")
  - **Regla 2:** Si todos los candidatos llevan ≥ 5 días sin mejorar → skip ("estancada Nd")
- Log en formato: `⏸ trivexicol.com — estancada 6d → skip` / `✓ boniss.com — activa → scrapeando`

**Por qué:** Evitar gastar tiempo de browser en tiendas que ya no tienen tracción. La lógica de scraping era ciega: corría para todas las tiendas Pro sin importar si el producto seguía vivo.

**Relacionado con backend:** El endpoint `/internal/stores/{storeId}/candidates` ahora devuelve `score`, `label` y `daysSinceLastImprovement` calculados desde los campos existentes (`daysInBestseller`, `firstBestsellerDate`, `daysElapsed`). Ver FIX-010 en el backend.

---

### CHANGE-025 — Scraper Meta Ads: flujo dos fases (anunciante → todos sus anuncios)
**Fecha:** 2026-06-09
**Tipo:** feature

**Qué cambió:**
Reescritura completa de `lib/scrapers/meta-ads.ts` con flujo de cuatro fases:

- **F1 — `findAdvertiser`**: busca por keyword derivada del dominio, voto por mayoría en primeros 8 cards para detectar nombre de anunciante y extrae `view_all_page_id` del HTML.
- **F2 — `extractAllAds`**: navega directo al perfil del anunciante (`?view_all_page_id=ID`), parsea `~N resultados`, hace scroll progresivo hasta cargar todos (tope 200), extrae todos los anuncios sin filtro de dominio.
- **F3 — `matchAdToCandidate`**: compara `destinationUrl` de cada anuncio con el `productUrl` de cada candidato extrayendo el handle de `/products/{handle}`.
- **R2**: sin cambios, se ejecuta igual que antes sobre el resultado de F2.

Nuevos tipos exportados: `AdvertiserInfo`, `CandidateForMatch`, `ScrapeResult`.
`scrapeAdsForStore` ahora retorna `ScrapeResult` (antes `ScrapedAd[]`).

**Por qué:** El flujo anterior buscaba por keyword y filtraba solo los anuncios que enlazaban al dominio de la tienda. Muchos anuncios usan tracking URLs o rutas distintas y se perdían. El nuevo flujo extrae el universo completo de anuncios del anunciante.

**Archivos:**
- `lib/scrapers/meta-ads.ts` — reescritura completa
- `lib/jobs/sync-ads.ts` — tipos actualizados (`Store.metaPageId/Name`, `Candidate.productUrl`), `getCandidatesForStore` movido antes del scrape, `updateStoreAdvertiser` nueva función, flujo F1→F5
- `lib/scrapers/test-scraper.ts` — output actualizado para mostrar `advertiser`, `totalAdsOnMeta`, `matchedCandidateId`

---

### CHANGE-024 — Admin ve anuncios desbloqueados igual que Pro
**Fecha:** 2026-06-09
**Tipo:** feature

**Qué cambió:**
Usuarios con `plan === 'admin'` ahora ven los anuncios sin blur, igual que Pro y Agency.

**Por qué:** El backend ya tenía `admin` en el gate (`List.of("pro","agency","admin")`). El frontend solo evaluaba `pro` y `agency`, dejando a admin bloqueado.

**Archivos:**
- `app/(dashboard)/tracker/[candidateId]/page.tsx` — línea `isPro`: agregado `|| me?.plan === 'admin'`
- `components/tracker/tracker-table.tsx` — línea `isPro`: mismo cambio para `AdStripPreview`

---

### CHANGE-023 — Fix: lastSeen Date→string en meta-ads scraper
**Fecha:** 2026-06-09
**Tipo:** bugfix

**Qué cambió:**
`lib/scrapers/meta-ads.ts` — dentro de `page.evaluate()`, la variable `today` del for-loop interno era un `Date` object que sobreescribía el `today` string del scope externo. El campo `lastSeen` se enviaba como Date en lugar de string YYYY-MM-DD. Java rechazaría el payload con error de deserialización en `LocalDate`.

**Fix:** Renombrar la variable interna a `nowDate` para evitar el shadowing. `lastSeen` usa el `today` string del scope externo.

**Archivos:** `lib/scrapers/meta-ads.ts`

---

### CHANGE-022 — Sección "Anuncios Activos" conectada a datos reales de Meta Ad Library
**Fecha:** 2026-06-08
**Tipo:** feature

**Qué cambió:**

**UI (completado en sesión anterior):**
- `components/tracker/product-ads.tsx` — sección `ProductAdsSection` en la página de detalle: grid de ad cards con badge "Activo", contador de días corriendo (verde si ≥30), hover overlay "Ver anuncio →". Blur + lock overlay para plan Free/Starter. Toggle dev `[dev] Pro ✓ / Free 🔒`.
- `AdStripPreview` — strip de 3 thumbnails en cada fila de la tracker table. Link directo a `#ads` en la página de detalle.

**Backend pipeline (esta sesión):**
- `lib/scrapers/meta-ads.ts` — Playwright headless. Busca en Meta Ad Library por dominio de tienda (keyword = dominio sin TLD), detecta ads cuyos links CTA apuntan al dominio objetivo, extrae snapshot URL, thumbnail, días corriendo, URL del producto.
- `lib/jobs/sync-ads.ts` — Job de sincronización. Obtiene tiendas Pro/Agency del backend, corre el scraper por cada una, hace POST a `/api/internal/webhook/ads`. Debe correr en Node.js (Easypanel o local) — Playwright no puede correr en Vercel (límite 50MB de función).
- `app/api/products/[candidateId]/ads/route.ts` — Proxy Vercel → backend Java para el endpoint de ads. Propaga el JWT del usuario.
- `app/(dashboard)/services/dashboardApi.ts` — nuevo endpoint `useGetProductAdsQuery(candidateId)` en RTK Query.
- `app/(dashboard)/types/index.ts` — tipos `Ad` y `ProductAdsResponse`.
- `components/tracker/product-ads.tsx` — `ProductAdsSection` usa `useGetProductAdsQuery`. Loading skeleton + fallback a mockAds en desarrollo cuando no hay datos reales.
- `app/(dashboard)/tracker/[candidateId]/page.tsx` — props de `ProductAdsSection` actualizadas a `{ candidateId, isPro }`.

**Relacionado con backend:** FIX-015 (tabla `product_ads`, `POST /api/internal/webhook/ads`, `GET /api/dashboard/candidates/{candidateId}/ads`). Pendiente redeploy del backend desde rama `feature/ads-pipeline` en Easypanel.

**Para activar el job de scraping:**
1. Redeploy del backend (rama `feature/ads-pipeline`) en Easypanel.
2. Correr `npx tsx lib/jobs/sync-ads.ts` con `NEXT_PUBLIC_API_URL` y `WEBHOOK_SECRET`.
3. O agregar como Schedule Trigger diario en n8n.

**Wiki actualizado:** No aplica.

---

### CHANGE-021 — Pool (Explorar testeos): fix overflow + búsqueda + favoritos + storeName
**Fecha:** 2026-06-03
**Tipo:** fix + feature

**Qué cambió:** Mismas mejoras del CHANGE-020 aplicadas a `pool-winners.tsx`:
- Grid de `[40px_56px_1fr_72px_56px_80px_130px_100px_72px]` a `[32px_44px_1fr_70px_48px_72px_110px_90px_72px]`, gap `gap-3`, padding `px-4`. Elimina overflow horizontal.
- "superó al X% del catálogo" → "superó al X% de [storeName]" con `winner.storeName`.
- Búsqueda client-side por nombre de producto (input con lupa arriba del filter bar), combinado con todos los filtros activos.
- Columna `#` reemplazada por estrella interactiva de favoritos. Estado compartido en `localStorage["dropspy_favorites"]` — mismo key que tracker.
- Título del producto truncado a 1 línea (`truncate`).

**Archivos modificados:**
- `components/tracker/pool-winners.tsx` — todos los cambios anteriores
- `app/(dashboard)/pool/page.tsx` — expone `error` del hook para mostrar mensaje cuando la request falla

**Relacionado con backend:** No aplica.
**Wiki actualizado:** No aplica.

---

### CHANGE-020 — Tabla tracker: fix overflow + texto tienda + favoritos localStorage
**Fecha:** 2026-06-03
**Tipo:** fix + feature

**Qué cambió:**

**Fix 1 — Scroll horizontal eliminado:** Grid pasó de `[40px_56px_1fr_140px_72px_56px_80px_130px_100px_72px]` a `[32px_44px_1fr_110px_70px_48px_72px_110px_90px_72px]`. Gap de `gap-6` a `gap-3`, padding de `px-6` a `px-4`. Reducción total de ~220px de ancho mínimo (1010px → ~790px), entra sin overflow en pantallas de 1280px+. Título del producto truncado a 1 línea (`truncate` en vez de `line-clamp-2`).

**Fix 2 — Texto contextual corregido:** "superó al X% del catálogo" → "superó al X% de [nombre tienda]". El nombre proviene del campo `candidate.storeName` del schema.

**Feature — Favoritos con localStorage:** Columna `#` reemplazada por estrella interactiva en cada fila. Click alterna favorito (★ amber llena / ☆ outline muted). Estado persiste en `localStorage["dropspy_favorites"]` como array de candidateIds. Compatible con futura tab "Favoritos" que filtre por `isFavorite`. Búsqueda ya estaba implementada — solo se actualizó el placeholder a "Buscar producto…".

**Archivos modificados:**
- `components/tracker/tracker-table.tsx` — todos los cambios anteriores

**Relacionado con backend:** No aplica (cambios puramente de UI y localStorage).
**Wiki actualizado:** No aplica (mejoras de UX sin impacto en lógica de producto).

---

### CHANGE-019 — Integración Lemon Squeezy: base de planes pagos
**Fecha:** 2026-06-02
**Tipo:** feature

**Qué cambió:** Preparación de la arquitectura de cobro con Lemon Squeezy. Aún sin variant IDs reales (pendiente creación de productos en LS dashboard).
- Nuevo `lib/lemonsqueezy.ts`: constantes de variant IDs (placeholders), helper `lsCheckoutUrl()` que genera URLs de checkout con email y userId pre-cargados.
- Fix `PLAN_LABELS` en settings: se agrega `starter` y `agency`, se elimina `basic` como plan principal (queda como alias legacy para usuarios existentes). Alineado con los planes de la página de pricing.
- Billing section en settings reescrita como `BillingSection`: muestra plan actual, CTA de upgrade directo a checkout de LS (con email pre-cargado), y link a `/pricing` para ver todos los planes. Lógica por plan: Free → upgrade a Starter, Starter → Pro, Pro → Agency, Agency → solo gestión.

**Archivos modificados:**
- `lib/lemonsqueezy.ts` — nuevo. Variant IDs + helper de checkout URL
- `app/(dashboard)/settings/page.tsx` — PLAN_LABELS corregido, billing section reescrita

**Relacionado con backend:** Ver `/tmp/scout-backend-ls/` para el código del webhook (LemonSqueezyWebhookController + LemonSqueezyService). Pendiente que Diego integre al repo del backend. También requiere agregar campo `ls_customer_id` a la tabla `users` y variable de entorno `LEMONSQUEEZY_WEBHOOK_SECRET` en Easypanel.

**Wiki actualizado:** No aplica (cambio de infraestructura de cobro, sin impacto en lógica de producto documentada).

---

### CHANGE-018 — Rebrand: ShopTracker → Dropspy
**Fecha:** 2026-05-30
**Tipo:** ui

**Qué cambió:** Renombramiento completo de la plataforma de "ShopTracker" a **Dropspy**. Se creó el componente `DropspyIcon` (SVG teardrop+eye) y `DropspyWordmark`. Se agregó la fuente Outfit (Google Fonts) para el wordmark. Todos los textos "ShopTracker" en sidebar, login, home, marketing y metadata fueron reemplazados. Las claves de localStorage también se actualizaron (`dropspy_currency`, `dropspy_fx_v1`).

**Archivos modificados:**
- `components/ui/dropspy-logo.tsx` — nuevo componente SVG del logo (teardrop + ojo)
- `app/layout.tsx` — metadata actualizada, fuente Outfit añadida
- `components/layout/app-sidebar.tsx` — logo reemplazado
- `app/(auth)/login/page.tsx` — logo reemplazado
- `app/(dashboard)/home/page.tsx` — logo reemplazado
- `app/(marketing)/page.tsx` — todas las menciones de ShopTracker
- `lib/types.ts`, `app/globals.css` — comentarios actualizados
- `store/currencySlice.ts`, `lib/exchange-rates.ts` — claves localStorage actualizadas
- `CLAUDE.md`, `docs/CHANGES.md` — documentación actualizada

**Relacionado con backend:** No aplica (solo frontend)
**Wiki actualizado:** Sí — este archivo

---

### CHANGE-011 — Home page + logo clickeable
**Fecha:** 2026-05-25
**Tipo:** feature

**Qué cambió:** Se creó una vista `/home` como landing page principal de la plataforma. El logo "ShopTracker" en el sidebar ahora es un link que lleva a `/home`.

**Archivos modificados:**
- `app/(dashboard)/home/page.tsx` — nueva página con: hero + buscador, KPI strip (tiendas activas, en testeo, en alza), acceso rápido a 4 secciones, ranking top productos del pool, panel de insights
- `components/layout/app-sidebar.tsx` — logo envuelto en `<Link href="/home">` con hover opacity

**Relacionado con backend:** Usa los mismos endpoints existentes: `GET /api/dashboard/overview`, `GET /api/tracker/candidates`, `GET /api/pool/winners`, `GET /api/dashboard/insights`.

---

### CHANGE-010 — Eliminar estimaciones de ventas e ingresos del dashboard
**Fecha:** 2026-05-22
**Tipo:** ui

**Qué cambió:** Se removieron todas las estimaciones de unidades/día e ingresos/día del dashboard y el pool. El modelo power law existe pero aún no está suficientemente calibrado para mostrarlo al usuario — se quitó para evitar ruido y expectativas incorrectas.

**Archivos modificados:**
- `components/tracker/tracker-table.tsx` — eliminadas columnas `~Ventas/d` e `~Ingr./d`, grid de 11 a 9 columnas, removidas constantes PL y función `plEst`
- `components/tracker/pool-winners.tsx` — ídem: columnas de estimación eliminadas, grid de 10 a 8 columnas, removidas constantes PL
- `components/dashboard/store-card.tsx` — eliminada línea `~X uds/día · ~$Y/día` bajo el top candidato
- `components/tracker/kpi-cards.tsx` — card `~Artículos/día` reemplazada por `Score promedio`, removidos `fmtUnits` y `totalUnits`

**Relacionado con backend:** El modelo sigue en el backend (`DashboardController`, constantes `PL_ALPHA`, `PL_S1_CONS`). Solo se oculta en el frontend.

**Wiki actualizado:** No aplica (cambio de visibilidad de UI, sin impacto en lógica documentada).

---

### CHANGE-009 — Conversión de moneda a preferredCurrency del usuario
**Fecha:** 2026-05-22
**Tipo:** feature

**Qué cambió:** Todas las estimaciones de precio, ventas e ingresos ahora se muestran en la moneda preferida del usuario. Antes todo salía en la moneda cruda de la tienda (COP, MXN, USD mezclados). Ahora hay un selector de moneda en el header y un Redux slice que persiste la preferencia en localStorage.

**Archivos modificados:**
- `store/currencySlice.ts` — nuevo. Estado global: `{ currency: string, symbol: string, rate: number }`. Persiste en localStorage.
- `app/(dashboard)/layout.tsx` — importa `CurrencySelector` en el header
- `components/layout/currency-selector.tsx` — nuevo. Dropdown con USD/COP/MXN. Actualiza el Redux store y el backend (`PATCH /api/users/me/currency`).
- `lib/utils.ts` — función `formatCurrency(amount, currency, symbol)` que usa la tasa del Redux store
- `components/tracker/tracker-table.tsx` — usa `formatCurrency` en columnas de precio, ventas e ingresos
- `components/dashboard/store-card.tsx` — usa `formatCurrency` en estimaciones del top candidato
- `components/tracker/pool-winners.tsx` — usa `formatCurrency`
- `app/(dashboard)/types/index.ts` — `TrackerCandidate` y `TopCandidate` con campo `currency`

**Relacionado con backend:** `feat: inactivity score, preferred currency, and reliability factor` (commit 4c9e545)

**Wiki actualizado:** No aplica (feature de UX/moneda, sin impacto en lógica de scoring documentada en wiki).

---

### CHANGE-008 — Badge de inactividad de tienda en store-card y tracker
**Fecha:** 2026-05-22
**Tipo:** feature

**Qué cambió:** Las tiendas ahora muestran su tier de inactividad (MODERADA / INACTIVA / ZOMBIE) en la store-card y en la tabla de tiendas. ACTIVA se oculta para no generar ruido visual.

**Archivos modificados:**
- `components/dashboard/store-card.tsx` — badge inline junto al nombre de la tienda. Colores: amarillo (MODERADA), naranja (INACTIVA), rojo (ZOMBIE).
- `app/(dashboard)/stores/page.tsx` — columna Status con el mismo badge

**Relacionado con backend:** FIX (inactivity score implementado en `StoreSyncService.updateInactivityScore()`)

**Wiki actualizado:** Sí — `scout-inactividad-tienda.md` (sección implementación frontend).

---

### CHANGE-007 — Podium de winners (productos que llegaron a rank #1)
**Fecha:** 2026-05-22
**Tipo:** feature

**Qué cambió:** Nueva sección "Podium" en el tracker que muestra los top 5 productos que alguna vez llegaron a rank #1 en cualquier tienda del usuario. Cada entrada muestra la fecha en que llegó al #1 y cuántos días sostuvo esa posición.

**Archivos modificados:**
- `components/tracker/winner-podium.tsx` — nuevo componente. Fetch a `GET /api/dashboard/podium?days=N`. Filtro por período (7d / 30d / todo el tiempo).
- `app/(dashboard)/tracker/page.tsx` — importa `WinnerPodium`, renderiza bajo el WinnerCard

**Relacionado con backend:** endpoint `GET /api/dashboard/podium` (commit bd4e61f)

**Wiki actualizado:** Sí — `scout-top1-hito.md` (sección implementación frontend).

---

### CHANGE-006 — Estimaciones de ventas e ingresos en tablas de productos
**Fecha:** 2026-05-21
**Tipo:** feature

**Qué cambió:** La tabla del tracker y las store-cards ahora muestran estimaciones de ventas diarias (`~X uds/día`) e ingresos (`~$Y/día`) basadas en el modelo power law calibrado. Las estimaciones usan el `reliabilityFactor` de inactividad del backend — tiendas zombies tienen estimaciones más conservadoras.

**Archivos modificados:**
- `components/tracker/tracker-table.tsx` — columnas `~Ventas/d` y `~Ingr./d` con prefijo `~` y fallback `—`
- `components/dashboard/store-card.tsx` — línea `~X uds/día · ~$Y/día` bajo los badges del topCandidate
- `lib/utils.ts` — helpers `fmtCompact(n)` (K/M) y `fmtUnits(n)` (1 decimal si <10)
- `app/(dashboard)/types/index.ts` — `TrackerCandidate` y `TopCandidate` con `estUnitsDayLow`, `estRevDayLow`, `currentRank`, `productPrice`

**Nota de diseño:** siempre `~` antes de cualquier estimación. Nunca mostrar cifras exactas de ventas — son estimaciones con un modelo power law conservador (p5 empírico).

**Relacionado con backend:** power law implementado en `DashboardController` (constantes `PL_ALPHA`, `PL_S1_CONS`, helper `estUnitsDay`)

**Wiki actualizado:** Sí — `scout-power-law-calibracion.md` (parámetros en producción).

---

### CHANGE-005 — Pool de winners global con paywall por plan
**Fecha:** 2026-05-18
**Tipo:** feature

**Qué cambió:** Nueva sección en el tracker que muestra los mejores candidatos del pool global (todas las tiendas de todos los usuarios del plan Normal/Básico). Plan free ve la sección bloqueada con blur y CTA de upgrade. Plan básico+ ve los winners reales.

**Archivos modificados:**
- `components/tracker/pool-winners.tsx` — nuevo. Fetch a `GET /api/dashboard/pool/winners`. Dos estados: bloqueado (blur + lock icon + CTA) o real.
- `app/(dashboard)/types/index.ts` — `PoolWinnersResponse`, `PoolWinnerProduct`
- `app/(dashboard)/services/dashboardApi.ts` — función `getPoolWinners(page, size)`
- `app/(dashboard)/tracker/page.tsx` — importa `PoolWinnersSection`

**Relacionado con backend:** FIX-012 (pool arquitectura + endpoint `GET /api/dashboard/pool/winners`)

**Wiki actualizado:** Sí — `scout-modelo-audiencias.md` (sección implementación del pool).

---

### CHANGE-004 — ScoreRing con dos arcos: score confirmado vs. débil
**Fecha:** 2026-05-18
**Tipo:** feature

**Qué cambió:** El anillo de score ahora usa dos arcos superpuestos para comunicar confianza:
- **Verde:** `score × signalConfidence` — porción confirmada por historial
- **Amarillo:** `score × (1 - signalConfidence)` — porción con señal aún débil (pocos días de tracking)

Un candidato en día 1 con score 80 aparece mayormente amarillo. El mismo candidato en día 15 aparece mayormente verde. El score no cambia — cambia la certeza visual de la señal.

**Archivos modificados:**
- `components/dashboard/score-ring.tsx` — reescrito con dos arcos SVG calculados desde `score` y `signalConfidence`
- `components/tracker/tracker-table.tsx` — pasa `signalConfidence` al ScoreRing
- `app/(dashboard)/types/index.ts` — `TrackerCandidate.signalConfidence: number`

**Relacionado con backend:** FIX-011 (ScoreRing) y FIX-005 (signal_confidence en la API)

**Wiki actualizado:** Sí — `scout-pipeline.md` (visualización del score).

---

### CHANGE-003 — Detección de fase del ciclo en badges
**Fecha:** 2026-05-18
**Tipo:** feature

**Qué cambió:** Nuevo componente `PhaseBadge` que muestra la fase del ciclo de vida de un candidato: Despegue (verde), Meseta (gris), Caída (rojo), Rebote (azul). Aparece en la tracker-table, winner-card y pool-winners. Nulo en candidatos con menos de 10 días de tracking.

**Archivos modificados:**
- `components/tracker/phase-badge.tsx` — nuevo componente con 4 variantes de color
- `components/tracker/tracker-table.tsx` — badge inline bajo el título del producto
- `components/tracker/winner-card.tsx` — badge junto al PerformanceBadge
- `components/tracker/pool-winners.tsx` — badge por fila

**Relacionado con backend:** FIX-013 (cyclePhase calculado en TrackingService)

**Wiki actualizado:** Sí — `scout-score-momentum.md` (sección detección de fase del ciclo).

---

### CHANGE-002 — Página de detalle de candidato con historial
**Fecha:** 2026-05-17
**Tipo:** feature

**Qué cambió:** Al hacer clic en un candidato del tracker se abre la página de detalle (`/tracker/[candidateId]`) con el historial completo: ScoreChart (línea de score diario), RankChart (línea de rank inverso), y RaceTrack (visualización de posición en la carrera). Antes la página cargaba pero mostraba mock data.

**Archivos modificados:**
- `app/(dashboard)/tracker/[candidateId]/page.tsx` — refactorizado a client component con `<Suspense>` wrapper (fix error React #418)
- `components/tracker/score-chart.tsx` — historial del score con línea verde/amarillo según confianza
- `components/tracker/rank-chart.tsx` — historial del rank (eje Y invertido: rank #1 arriba)
- `components/tracker/race-track.tsx` — lanes clickeables, posición actual destacada

**Relacionado con backend:** FIX-003 (storeId faltaba en la respuesta), FIX-004 (error React #418)

**Wiki actualizado:** No aplica (UI de detalle, sin impacto en lógica documentada).

---

### CHANGE-001 — Dashboard inicial: store-cards + tracker table
**Fecha:** 2026-05-17
**Tipo:** feature

**Qué cambió:** Primera versión funcional del dashboard conectado a datos reales. Store-cards muestran el top candidato de cada tienda con su score y performance badge. Tracker table muestra todos los candidatos activos con score, días en track, y señal de confianza.

**Archivos modificados:**
- `components/dashboard/store-card.tsx` — tarjeta de tienda con top candidato
- `components/dashboard/score-ring.tsx` — anillo SVG de score (versión inicial, un solo arco)
- `components/dashboard/performance-badge.tsx` — badge con mapa de labels API → UI
- `components/tracker/tracker-table.tsx` — tabla de candidatos activos
- `app/(dashboard)/dashboard/page.tsx` — vista principal
- `app/(dashboard)/tracker/page.tsx` — vista del tracker

**Relacionado con backend:** FIX-003 (primer deploy funcional del backend), múltiples fixes de la sesión 2026-05-17

**Wiki actualizado:** No aplica (primera versión del frontend).
