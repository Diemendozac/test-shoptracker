# CHANGES — Dropspy Frontend

Registro de cambios importantes. Cada entrada incluye fecha, qué cambió, por qué, y archivos afectados.

> **La fecha es el campo más importante.** Permite saber cuándo se hizo el cambio y correlacionarlo con lo que los usuarios ven en producción.

---

### CHANGE-075 — Fix: subtítulo de signup decía "14 días" en vez de "7 días"

**Fecha:** 2026-07-14
**Tipo:** fix (typo/consistencia)

Quedó de un texto genérico al escribir las traducciones en CHANGE-071, antes de que el modelo de trial de 7 días quedara definido en CHANGE-074. Corregido en `messages/es.json` (`Auth.signup.subtitle`).

---

### CHANGE-074 — Modelo de precios: prueba gratis de 7 días reemplaza al plan Free, renombre Starter→Básico, precios reales, gating por plan

**Fecha:** 2026-07-13
**Tipo:** feature / pricing

**Por qué:** el plan Free permanente se reemplaza por una prueba gratis de 7 días con límites — el gancho de conversión es el trial, no un tier gratuito indefinido (referencia: modelo de Kalodata). Los precios mostrados no coincidían con los reales (el usuario los confirmó a mano). El plan "Starter" se renombra a "Básico" para coincidir con el nombre real usado en la pasarela de pago. Además, la página de precios no debe ser pública — el flujo es: CTA de trial en la landing → signup → límites dentro de la app → upgrade linkeado a `/pricing`.

**Qué cambió:**
- **Precios reales** (COP, mensual/anual) en `app/(marketing)/pricing/page.tsx`:
  - Básico (antes Starter): $59.900/mes · $49.900/mes anual ($598.800/año)
  - Pro: $119.900/mes · $99.900/mes anual ($1.198.800/año)
  - Agency: $239.900/mes · $199.900/mes anual ($2.398.800/año)
  - Se eliminó la tarjeta "Free" de `/pricing` y de la landing.
- **`app/(marketing)/page.tsx`:** se quitó el link "Pricing" del nav público y toda la sección de precios embebida (`id="pricing"`, toggle mensual/anual, tarjetas). El único CTA público ahora es "Empezar prueba gratis" → signup. `/pricing` queda como página solo accesible desde dentro de la app (links de upgrade), no linkeada públicamente.
- **`lib/view-as.tsx` (`usePlanTier`)** — nuevos campos, ninguno existía antes:
  - `maxPoolPage`: última página del pool visible por plan. Trial: solo página 1 (índice 0). Básico: hasta 500. Pro: hasta 1000. Agency/Admin: sin límite.
  - `canTrackStores`: `false` solo en trial — sin rastreador de tiendas.
  - `canViewAds` corregido: antes estaba hardcodeado en `true` para todos los planes (ningún plan ocultaba video ads pese a la intención del producto). Ahora es `false` solo en trial; Básico/Pro/Agency ven los thumbnails de video sin blur (antes el candado estaba mal atado a `isStarter`, bloqueando a Básico en vez de al trial).
- **`components/tracker/pool-winners.tsx`** — el candado de "solo página 1" (antes atado a `isStarter`) ahora usa `maxPoolPage`, aplicable a cualquier plan. Mensaje de bloqueo diferenciado: trial → "Ver planes" (link a `/pricing`); plan pago que alcanza su tope → "Actualizar plan" (link a `/settings`).
- **`app/(dashboard)/stores/page.tsx`** — los 3 botones de "Agregar tienda" quedan bloqueados (ícono de candado + redirigen a `/pricing`) cuando `canTrackStores` es `false`.
- **`app/(dashboard)/settings/page.tsx`** — label del plan `free` pasa de "Free" a "Prueba gratis"; `starter`/`basic` (alias legacy) pasan de "Starter" a "Básico"; texto de upgrade actualizado.
- **`components/admin/ViewAsBar.tsx`** — se agregó la opción "Prueba gratis" al simulador de planes de admin (antes no existía forma de previsualizar el trial); `PlanOverride` ahora incluye `'free'`.

**Qué NO cambió:** el valor interno del plan `starter`/`free` en la API y en `PlanOverride`/`LsPlan` no se renombró (solo el texto mostrado) — evita tocar contrato de backend. Ningún endpoint ni el modelo de datos de Redux se modificó.

**Pendiente — requiere revisor técnico (Diego):** el trial de 7 días no expira automáticamente. Hoy solo existen las restricciones de UI (página 1 del pool, sin rastreador de tiendas, sin video ads); no hay lógica de backend que bloquee el acceso al día 8 o fuerce elegir un plan. El usuario confirmó que esto es un pendiente conocido, no un requisito de esta sesión.

**Verificación:** `npx next build` sin errores.

**Riesgo:** con cuidado (toca `lib/view-as.tsx`, hook compartido por 5+ componentes).

**Wiki actualizado:** No aplica en esta sesión — pendiente registrar en el vault (scout-permisos-plan.md queda desactualizado con estos cambios, ver discrepancia).

---

### CHANGE-072 — Traducción de la UI a español (bloque 2: dashboard, tracker, stores, settings)

**Fecha:** 2026-07-13
**Tipo:** i18n / bugfix

**Por qué:** continuación de CHANGE-071. El dashboard, tracker y stores ya estaban mayormente en español (desarrollados después del template inicial en inglés), pero quedaban restos de texto en inglés sueltos, y un hallazgo importante: el badge de rendimiento (`PerformanceBadge`) mostraba literalmente "Rising", "Watching", "Declining", "Stable", "New" en inglés en toda la app (tracker table, store cards, detalle de candidato, pool de ganadores) — no se había traducido nunca.

**Qué cambió:**
- `components/dashboard/performance-badge.tsx`: se agregó un mapa `labelText` que traduce el label interno a texto visible (Rising→"En alza", Watching→"En observación", Declining→"En baja", Stable→"Estable", New→"Nuevo"). **El valor interno (`PerformanceLabel`) no cambió** — otro código lo compara por string exacto (`resolveDisplayLabel` en `lib/label-utils`, usado en `home/page.tsx`), así que cambiar solo el texto renderizado evita romper esas comparaciones.
- `app/(dashboard)/tracker/[candidateId]/page.tsx`: título/descripción de página, "Current/Best Rank", "Growth", "Confidence", "Rank Progression", "Performance Score", "Tracking History", cabeceras de tabla (Day/Date/Rank/Growth/Score/Status), "Loading…", mensajes de error, "Back to Tracker", "First seen", "Day X of 30". También el formato de fecha `formatDate` usaba locale `en-US` (mostraba "Jan 15, 2026") → cambiado a `es-CO`.
- Textos sueltos en inglés en: `app/(dashboard)/dashboard/page.tsx` (vía next-intl, namespace `Dashboard`), `app/(dashboard)/stores/components/AddStoreModal.tsx`, `StoreCard.tsx`, `StoreRow.tsx`, `components/dashboard/store-card.tsx`, `components/tracker/tracker-table.tsx`, `components/layout/app-header.tsx` (aria/sr-only "Search" → "Buscar").
- `app/(dashboard)/settings/page.tsx`: título/descripción de `PageLayout`.

**Qué NO se tradujo (dead code, verificado sin ningún import activo):** `components/ui/pagination.tsx`, `command.tsx`, `carousel.tsx`, `sidebar.tsx` (SidebarTrigger/SidebarRail), `dialog.tsx`, `sheet.tsx`, `spinner.tsx` — todos shadcn boilerplate sin ningún `import` en el resto del código. Si algún día se usan, quedan pendientes de traducir.

**Archivos modificados:** ver lista arriba — ~15 archivos entre `app/(dashboard)` y `components/`.

**Qué NO cambió:** Redux (`store/`, ningún slice tocado), lógica de negocio, endpoints, `PerformanceLabel` como tipo/valor interno.

**Verificación:** `npx next build` sin errores. Grep dirigido sobre `app/` y `components/` para confirmar ausencia de strings en inglés user-facing (excluyendo dead code).

**Riesgo:** solo (frontend puro).

**Wiki actualizado:** No aplica.

---

### CHANGE-071 — Traducción de la UI a español (bloque 1: base i18n + marketing + auth)

**Fecha:** 2026-07-13
**Tipo:** i18n

**Por qué:** la mayoría de usuarios actuales de SCOUT/Dropspy son de Colombia. El landing, pricing, login/signup y onboarding tenían texto hardcodeado en inglés (herencia del template v0.app original), inconsistente con el resto de la app que ya estaba en español.

**Qué cambió:**
- Se instaló `next-intl` como sistema de traducción (en vez de hardcodear español directo) para dejar la puerta abierta a otros idiomas sin rehacer el trabajo — decisión del usuario, ver spec de la sesión.
- Configuración **sin routing por URL** (un solo locale `es`, sin prefijo `/es/` en las rutas) — no rompe links ni SEO existente.
- Todo el texto de usuario en `app/(marketing)/page.tsx`, `app/(marketing)/pricing/page.tsx`, `app/(auth)/login/page.tsx` y `app/(auth)/onboarding/page.tsx` se extrajo a `messages/es.json` y se reemplazó por `useTranslations()`.

**Archivos modificados:**
- `package.json` / `pnpm-lock.yaml` — nueva dependencia `next-intl`
- `next.config.mjs` — plugin de next-intl
- `i18n/request.ts` (nuevo) — config de locale único `es`
- `messages/es.json` (nuevo) — diccionario de traducción (namespaces `Landing`, `Auth`, `Onboarding`)
- `app/layout.tsx` — `NextIntlClientProvider`, `lang="es"`, metadata traducida
- `app/(marketing)/page.tsx`, `app/(marketing)/pricing/page.tsx`
- `app/(auth)/login/page.tsx`, `app/(auth)/onboarding/page.tsx`

**Qué NO cambió:** lógica de negocio, Redux (`store/`, `authSlice`, `onboardingSlice` no se tocaron — solo se leen igual que antes), rutas, nombres de archivos/componentes.

**Verificación:** `npx next build` sin errores tras cada archivo. Nota: `pnpm build` falla por un problema de pnpm ajeno a este cambio (bloqueo por "ignored build scripts" de `@parcel/watcher`/`@swc/core`) — usar `npx next build` o correr `pnpm approve-builds` una vez.

**Riesgo:** solo (frontend puro, sin tocar Redux/DB/APIs).

**Pendiente en esta misma sesión:** dashboard, tracker, stores, settings y `components/ui` — bloques 2 y 3, cada uno con su propio CHANGE-NNN.

**Wiki actualizado:** No aplica (cambio de UI, sin impacto en lógica documentada).

---

### CHANGE-073 — Onboarding rediseñado: de wizard de página completa a modal compacto sobre /dashboard

**Fecha:** 2026-07-13
**Archivos:**
- `app/(auth)/onboarding/page.tsx` — **eliminado**. Reemplazado por modal.
- `components/onboarding/onboarding-modal.tsx` (nuevo) — mismos 6 grupos de datos que CHANGE-070, comprimidos en un solo modal con dropdowns e inputs chicos + chips multi-select para nichos/plataformas, en vez de 6 pantallas con cards grandes y barra de progreso.
- `app/(dashboard)/layout.tsx` — monta `<OnboardingModal />`, superpuesto al dashboard (no bloquea via ruta, bloquea via `Dialog` no descartable — sin botón de cerrar, `onInteractOutside`/`onEscapeKeyDown` deshabilitados).
- `app/(auth)/store/onboardingSlice.ts` — reescrito: sin `step`/`nextStep`/`prevStep` (ya no hay multi-step). Nuevo campo `justRegistered` + acción `markJustRegistered`, y `completed` + `markOnboardingCompleted` (antes era un simple reset).
- `app/(auth)/hooks/useAuth.ts` — `register()` ahora despacha `markJustRegistered()` y redirige a `/dashboard` (ya no a `/onboarding`, esa ruta no existe más).
- `messages/es.json` — namespace `Onboarding` reescrito: se eliminaron las claves de wizard multi-paso (`steps`, `page.stepOf`, `page.back`, etc., huérfanas tras borrar la página) y se adaptaron las traducciones reales (ya existían en español desde CHANGE-071) a la estructura plana del modal.

**Por qué:** pedido explícito de rediseño — referencia visual de Kalodata (modal "Welcome back!" con 4 campos, dropdowns, "Can't skip"). Se mantienen los mismos datos que CHANGE-070 (nada se recortó), solo cambia la densidad/presentación.

**Riesgo encontrado y resuelto — no afectar a usuarios existentes:** si el modal se mostrara simplemente cuando `!completed`, cualquier usuario ya registrado vería el modal bloqueante la próxima vez que cargue `/dashboard`, porque nadie tiene ese flag en `true` todavía (no hay backend). Se resolvió con `justRegistered`, seteado únicamente dentro de `register()` — `login()` nunca lo setea, así que el modal solo aparece en la sesión inmediatamente posterior a un registro nuevo. Es una solución client-side temporal: cuando Diego implemente el endpoint (`scout-onboarding-propuesta-tecnica`), `GET /users/me` debería devolver un campo `onboardingCompleted` real para que el gate sea robusto entre dispositivos/sesiones, no solo dentro del mismo browser.

**Conflicto detectado y resuelto durante la implementación:** al momento de este cambio, otra sesión ya había corrido CHANGE-071/072 (traducción completa de la app a `next-intl`), incluyendo una traducción completa del wizard de página que este commit elimina. Se reaprovecharon esas traducciones (ya en español, ya revisadas) reestructurándolas para el modal en vez de descartarlas. También se encontraron cambios de precios sin commitear y sin `CHANGE-NNN` en `app/(marketing)/page.tsx` y `pricing/page.tsx` (ajenos a este cambio) — se descartaron por indicación explícita del usuario, no se tocó nada más de esos archivos.

**Sigue bloqueado en backend:** igual que CHANGE-070 — `PATCH /users/me/onboarding` no existe, issue #1 en `ShopTracker` sin resolver.

---

### CHANGE-070 — Wizard de onboarding post-registro (6 pasos, superseded por CHANGE-073)

**Fecha:** 2026-07-13
**Archivos:**
- `app/(auth)/store/onboardingSlice.ts` (nuevo) — Redux slice para las respuestas del wizard, persistido a localStorage entre pasos/recargas
- `store/index.ts` — registra `onboardingReducer`
- `app/(dashboard)/services/userApi.ts` — nueva mutación `submitOnboarding` → `PATCH /users/me/onboarding` (endpoint aún no existe en el backend, ver más abajo)
- `app/(auth)/onboarding/page.tsx` (nuevo) — wizard de 6 pasos: País + Teléfono, Sobre ti, Modelo, Objetivos, Nichos, Plataformas
- `app/(auth)/hooks/useAuth.ts` — `register()` redirige a `/onboarding` en vez de `/dashboard`. `login()` no cambia.

**Por qué:** SCOUT no capturaba ningún dato del usuario al registrarse más allá de email/password — sin país, teléfono, modelo de negocio, ni nichos. Diseño inspirado en el patrón de Dropkiller (onboarding post-signup sin gate, ver wiki `benchmark-dropkiller-onboarding`), pero adaptado a lo que SCOUT necesita, no copiado — en particular el paso "Modelo" usa el filtro pago-anticipado/contra-entrega que es la pregunta de calificación #1 de SCOUT, no la taxonomía de tipo de negocio de Dropkiller. Las categorías del paso "Nichos" reusan la taxonomía de 13 categorías ya usada por `NicheClassificationService` (`product_niche`) para que los datos del onboarding puedan cruzarse con productos clasificados más adelante.

**Bloqueado en backend:** el endpoint `PATCH /users/me/onboarding` no existe todavía — `User.java` no tiene ningún campo para esta data. Propuesta técnica completa (schema `user_onboarding`, endpoint, y fix del bug donde `name` se manda en el registro pero el backend lo descarta) redactada en la wiki del proyecto (`scout-onboarding-propuesta-tecnica`) y flageada a Diego vía issue en GitHub — no implementada acá, requiere su revisión (cambio de schema de DB).

**Pendiente relacionado, también flageado a Diego:** botón de "Sign in with Google" — hoy 100% decorativo en `login/page.tsx`, sin backend OAuth. Propuesta técnica separada (`scout-google-oauth-propuesta`), bloqueada en que Daniel cree las credenciales OAuth en Google Cloud Console primero.

---

### CHANGE-069 — Filtro "solo con video" en pool global, para usuarios no-admin

**Fecha:** 2026-07-13
**Archivos:**
- `app/(dashboard)/services/dashboardApi.ts` — nuevo param `hasVideo` en `getPoolWinners`, forwardeado como query param `hasVideo` a `GET /dashboard/pool/winners`
- `app/(dashboard)/pool/page.tsx` — usa `useViewAs().effectivePlan`; pasa `hasVideo: true` salvo que `effectivePlan === 'admin'`

**Por qué:** en "Explorar testeos" los usuarios normales solo deben ver productos que tengan al menos un anuncio con video (ads). Admin sigue viendo el pool completo, sin filtrar, para poder auditar todo el catálogo.

**Fix 2026-07-13 (mismo día):** la primera versión usaba `isAdmin` (plan real) en vez de `effectivePlan`. Bug: si un admin usaba la ViewAsBar para simular "Pro"/"Starter", el filtro no se activaba porque `isAdmin` seguía en `true` — el admin veía el pool sin filtrar aunque estuviera simulando otro plan. Corregido a `effectivePlan === 'admin'`, que sí respeta la simulación.

**Backend correspondiente:** ShopTracker SPEC-001 / FIX-048 (rama `feature/pool-has-video-filter`) — Diego autorizó verbalmente implementarlo. `ScoreSummaryRepository.java` agrega `hasVideo` a las 12 queries del pool con `EXISTS` contra `product_ads.video_url_r2`, aplicado antes de paginar. Pendiente: que Diego revise/compile (no se pudo compilar localmente, no hay Java instalado) y redeploye desde Easypanel.

---

### CHANGE-068 — Logout automático al vencer el JWT (redirect a /login en 401)

**Fecha:** 2026-07-12
**Archivos:**
- `lib/baseQuery.ts` — nuevo wrapper `makeAuthBaseQuery` compartido entre todas las APIs
- `app/(dashboard)/services/dashboardApi.ts`, `candidateApi.ts`, `userApi.ts`, `adminApi.ts`, `stores/services/storeApi.ts` — usan makeAuthBaseQuery

**Por qué:** cuando el JWT expiraba, el frontend mostraba "Error 500" genérico. Ahora cualquier 401 dispara `logout()` y redirige a `/login` automáticamente. Coordinado con backend (`fix/jwt-expiration`): JWT ahora dura 24h en vez de 7 días.

---

### CHANGE-067 — ShareButton extendido a Mis testeos y páginas de detalle

**Fecha:** 2026-07-06
**Archivos:**
- `components/tracker/pool-winners.tsx` — `ShareButton` exportado (antes era privado)
- `components/tracker/tracker-table.tsx` — `ShareButton` importado y añadido en columna Acción (entre "Ver" y "Eliminar")
- `app/(dashboard)/tracker/[candidateId]/page.tsx` — `ShareButton` añadido en header del producto, junto al botón "Ver producto"

**Por qué:** el botón de compartir link solo aparecía en "Explorar testeos" (pool-winners). El operador también necesita compartir productos desde "Mis testeos" y desde la página de detalle del producto.

**Qué cambió:** el componente `ShareButton` es ahora exportado y reutilizado en tres vistas. El link generado es siempre `origin/share/{candidateId}`.

---

### CHANGE-066 — Link compartible para productos del pool

**Fecha:** 2026-07-05
**Archivos:**
- `components/tracker/pool-winners.tsx` — botón "Link" en columna Acción de cada fila del pool
- `app/share/[candidateId]/page.tsx` — página pública sin autenticación que muestra el producto

**Por qué:** el operador necesita mostrarle un producto del pool a su editor (videos, datos) sin que el editor tenga cuenta en Dropspy. Se construyó un link compartible que cualquiera puede abrir sin login.

**Qué cambió:**
- Cada fila del pool tiene ahora un botón "Link" bajo el botón "Ver". Al hacer clic copia al portapapeles la URL `getdropspy.com/share/{candidateId}`. Muestra "Copiado" por 2 segundos.
- La ruta `/share/[candidateId]` es pública (fuera del layout autenticado). Muestra imagen, título, precio, score, crecimiento, rank, tipo de pago, country, y ads/videos activos del producto.
- La página consume `GET /api/public/candidates/{candidateId}` en el backend. **Este endpoint aún no existe — requiere FIX de Diego (ver spec abajo).**

**Estado del backend:** PENDIENTE. Sin el endpoint del backend, la página muestra "Producto no disponible". La URL ya se puede copiar y compartir; la página funcionará completa cuando Diego implemente el endpoint.

**Spec para Diego (FIX-XXX):**
```
GET /api/public/candidates/{candidateId}
- No requiere Authorization header
- Solo responde si el candidateId pertenece a un producto del pool global
- Respuesta JSON:
  {
    candidateId, productTitle, productImage, productUrl,
    productPrice, currency, performanceScore, performanceLabel,
    growthPct, currentRank, storeName, storeCountry,
    pagoAnticipado,
    ads: [{ id, thumbnail_url, video_url_r2, ad_snapshot_url, status, days_running }]
  }
- SecurityConfig: agregar .requestMatchers("/api/public/**").permitAll()
- Si candidateId no existe o no es del pool: 404
```

**Nivel:** solo (frontend puro, nuevo endpoint no toca lógica existente)
**Relacionado con backend:** FIX pendiente (spec arriba)

---

### CHANGE-065 — Tabla "Todos los productos en testeo": diseño alineado con Top 5

**Fecha:** 2026-06-17
**Archivos:** `app/(dashboard)/stores/[storeId]/page.tsx`
**Por qué:** la tabla inferior de la vista de tienda usaba un layout flex simple (imagen, título+badge, precio, ads, score) que era visualmente inconsistente con la tabla Top 5. Ambas secciones muestran los mismos datos — tenían que verse igual.
**Qué cambió:** la tabla inferior ahora usa el mismo `grid-cols-[28px_52px_1fr_100px_70px_140px_52px_52px]` que el Top 5, agregando las columnas faltantes: rank (#6, #7…), sparkline, y porcentaje de growth con color. Se unificó el array fuente a `sorted` para que los números de posición sean consistentes entre ambas secciones. Se eliminaron imports y variables huérfanas (`convertCurrency`, `currencySymbol`, `useCurrency`, `sym`).
**Nivel:** solo (frontend puro, sin lógica de negocio)

---

### CHANGE-064 — Filtro "Escalar" activado (scalable ya funciona en backend)

**Fecha:** 2026-06-17
**Archivos:** `app/(dashboard)/services/dashboardApi.ts`
**Por qué:** el parámetro `scalable` se enviaba con `// TODO: backend pendiente`. El backend ya implementa el filtro (FIX-044). Se elimina el comentario — el filtro "Escalar" en "Explorar testeos" ahora filtra server-side por `performanceScore ≥ 60 AND signalConfidence ≥ 0.5`.
**Nivel:** solo (un comentario eliminado, no cambia la lógica)

---

### CHANGE-063 — Filtro de fechas activado (days ya funciona en backend)

**Fecha:** 2026-06-17
**Archivos:** `app/(dashboard)/services/dashboardApi.ts`
**Por qué:** el parámetro `days` se enviaba con un `// TODO: backend pendiente`. El backend ya implementa el filtro (FIX-043). Se elimina el comentario — el filtro "Últimos 7d / 15d / 30d" ahora funciona de verdad server-side.
**Nivel:** solo (un comentario eliminado, no cambia la lógica)

---

### CHANGE-062 — Fix buildProductUrl para candidatos de tiendas no propias

**Fecha:** 2026-06-17
**Archivos:** `app/(dashboard)/tracker/[candidateId]/page.tsx`, `app/(dashboard)/types/index.ts`
**Por qué:** `buildProductUrl` solo usaba `storeBaseUrl` derivado de la lista de tiendas del usuario. Para candidatos de tiendas sistema o de otros usuarios en el pool, ese valor era vacío y el botón no aparecía aunque la condición de plan fuera verdadera. El backend ahora devuelve `storeBaseUrl` en `candidateDetail` (FIX-042), y `buildProductUrl` lo usa como fallback (`baseOverride`). Además se corrigió el caso donde `productUrl` es null pero hay `handle` — ahora construye `{base}/products/{handle}`.
**Nivel:** solo (frontend puro, no afecta Redux)

---

### CHANGE-061 — Botón "Ver producto" visible para tiendas de system@scout.internal

**Fecha:** 2026-06-17
**Archivos:** `app/(dashboard)/tracker/[candidateId]/page.tsx`, `app/(dashboard)/types/index.ts`
**Por qué:** CHANGE-060 mostró el botón solo para Pro/Agency en Explorar testeos. Pero el pool incluye candidatos de todos los usuarios — no solo de `system@scout.internal`. El requisito correcto: mostrar "Ver producto" a cualquier plan cuando el candidato es de una tienda sistema (descubierta por el sistema, sin restricción de plan), y mantener el gate Pro/Agency para candidatos de tiendas de otros usuarios. El campo `isScoutStore` lo provee el backend (FIX-041). Condición final: `fromTracker || isPro || candidate.isScoutStore`.
**Nivel:** con cuidado (toca contrato de API y lógica de gating de plan)

---

### CHANGE-060 — Botón "Ver producto" en Explorar testeos visible para Pro/Agency

**Fecha:** 2026-06-17
**Archivos:** `app/(dashboard)/tracker/[candidateId]/page.tsx`
**Por qué:** el botón "Ver producto" (link a la URL del producto en la tienda) solo aparecía cuando el usuario venía de "Mis testeos" (`fromTracker = true`). En "Explorar testeos" (`from=pool`) no aparecía para nadie. Se extiende la condición para mostrarlo también en el pool cuando el usuario es Pro o Agency, igual que ya funciona en "Mis testeos". Usuarios Starter o sin plan siguen sin verlo en el pool.
**Nivel:** solo (frontend puro, lectura del contexto de plan ya existente)

---

### CHANGE-059 — Revert a dual-pass en scraper de tiendas con >200 ads

**Fecha:** 2026-06-17
**Archivos:** `lib/scrapers/meta-ads.ts`
**Por qué:** el single-pass de CHANGE-056/057 (cap=130, una sola navegación a "recientes") fue superado en calidad de datos en producción. En run9 (run 27631041144, CHANGE-057), 4 de 8 tiendas dual-sort perdieron todos sus matches vs run6/run7: chic-lucky 0/30 (antes 7-11/45), comprasmart 0/18 (antes 2/42), boniss 0/30 (antes 1-5/28), hogar-inteligente 0/28 (antes 1/53). La causa probable es throttling de Meta a la IP de datacenter de GitHub Actions: `scrollToLoadAll` se estanca a los 17-40 ads en ~30-45s en CI, sin alcanzar el cap=130 validado localmente. Dos navegaciones frescas de cap=50 cada una (dual-pass) extraen más ads crudos en ese entorno que una sola pasada de cap=130. Revertimos al dual-pass de CHANGE-054 hasta investigar el throttling.
**Nivel:** con cuidado (afecta qué ads se pushean al backend)
**Verificación:** próximo run debe recuperar matches en chic-lucky, comprasmart, boniss, hogar-inteligente (target: ≥1 candidato_con_ads cada una, como en run6/run7)

---

### CHANGE-058 — Filtro "Solo activos" en TrackerTable: oculta productos dormidos por defecto

**Fecha:** 2026-06-17
**Archivos:** `components/tracker/tracker-table.tsx`
**Por qué:** la BD acumula candidatos con señal muerta que generan ruido en el dashboard. Mientras se implementa el archivado en backend (capas 2 y 3), este filtro frontend oculta los productos con `performanceScore < 15` y `daysElapsed > 14` — señal confirmada como plana después de 2 semanas de tracking. El botón "Solo activos" (ámbar) activa/desactiva el filtro; viene activo por defecto. El usuario puede desactivarlo para ver el histórico completo.
**Nivel:** solo (solo frontend, sin tocar BD ni lógica de negocio)
**Pendiente:** capas 2 y 3 requieren a Diego — campo `is_active` en `candidate_products` + tabla de archivo.

---

### CHANGE-057 — Fix CHANGE-056: pasada única se quedaba pegada en el conteo del probe

**Fecha:** 2026-06-16

**Qué cambió:**
- En el mismo branch `probe.totalAdsOnMeta > 200` de `scrapeAdsForStore` (`lib/scrapers/meta-ads.ts`), se agrega de vuelta un `page.goto` fresco (navegación completa, no solo reload) antes de forzar `fixSortOrder(page, 'recent')`. CHANGE-056 forzaba el sort directo sobre la página ya scrolleada por el probe, solo con `page.reload()`.

**Por qué (causa raíz confirmada en producción, run 27626600525):**
Las 4 tiendas dual-sort de ese run (chic-lucky, comprasmart, thritake, boniss) quedaron con el conteo final de ads **exactamente igual** al conteo que ya tenía el probe — el scroll no avanzó nada tras el reload. Causa: el sort por defecto que usa el probe ya es "Más recientes" (hallazgo de CHANGE-052). Forzar "recientes" otra vez con solo `reload()` no es un cambio real de sort desde la perspectiva de Meta — sigue sirviendo desde el mismo cursor de paginación que el probe ya agotó, aunque el DOM se vea reseteado visualmente. La pasada vieja de "recientes" (pre-CHANGE-056) sí funcionaba porque hacía un `page.goto` completo (no solo reload) antes de forzar el sort, lo cual resetea la paginación de Meta de verdad.
- Error metodológico en la validación de CHANGE-056: la prueba local que "confirmó" la mejora nunca corrió el probe antes del sort+reload (solo goto inicial + sort directo), por lo que no reproducía el escenario real. Validé el código equivocado.

**Verificación:** re-testeado con `scrapeAdsForStore` real (probe incluido) contra las mismas 4 tiendas que fallaron en producción:
| Tienda | Antes (bug) | Después (fix) |
|---|---|---|
| chic-lucky | 30 | 131 |
| comprasmart | 18 | 147 |
| thritake | 6 | 130 |
| boniss | 28 | 151 |

**Archivos afectados:** `lib/scrapers/meta-ads.ts`

**Riesgo:** solo

**Pendiente de verificar:** correr un sync real completo (requiere que el backend esté disponible — el run 27626600525 también falló por un 502 al pushear datos, problema de infraestructura separado de este fix) para confirmar en producción.

---

### CHANGE-056 — Scraper dual-sort: pasada única bajo "recientes" en vez de 2 pasadas

**[CORREGIDO POR CHANGE-057 — ver arriba]** Esta versión tenía un bug que dejaba el scroll pegado en el conteo del probe en las 4 tiendas dual-sort probadas en producción. Se deja la entrada original sin editar como registro histórico.

**Fecha:** 2026-06-16

**Qué cambió:**
- En `scrapeAdsForStore` (`lib/scrapers/meta-ads.ts`), el branch `probe.totalAdsOnMeta > 200` pasa de 2 pasadas completas (impresiones → reload → scroll, luego goto → recientes → reload → scroll, con merge por `adSnapshotUrl` único) a **1 sola pasada**: forzar sort "Más recientes" → reload → scroll con cap=130 (antes 50 por pasada) y `stagnantLimit=5` (antes 4) → extraer directo. Se elimina el segundo `page.goto`, el merge de únicos, y el log `[F3-dual]`.
- El branch `≤200 ads` (sort por defecto del probe, esaske y similares) no se tocó.

**Por qué:**
CHANGE-054 (pausa más larga) confirmó que el costo de las 2 pasadas no se justificaba — +220s/sync por una ganancia marginal. Probé localmente (headless, contra Meta real, sin tocar producción) si una sola pasada bajo "recientes" con scroll más profundo daba mejor resultado que las 2 pasadas combinadas, igualando el presupuesto total de scroll (cap=130 ≈ la suma de los 2 caps de 50 que ya tenía cada pasada). Resultado en las 6 tiendas dual-sort de producción (chic-lucky, thrivin, comprasmart, coolddy, shoponlygo, hogar-inteligente): **nunca perdió ads** (rango +0 a +42 vs el total de las 2 pasadas) y fue más rápido en 5/6 casos (rango -10.3s a +3.5s, la única excepción es ruido de red). El segundo reload completo (goto + settle + fixAdTypeFilter + wait ~10-15s de overhead fijo) resultó ser más caro que el valor que aportaba mantener 2 sorts separados — un solo "recientes" con scroll profundo cubre más superficie total, aunque no es subconjunto exacto del de "impresiones" (overlap parcial, ~60-85 de los ads coinciden entre los 2 approaches, pero la pasada única siempre encontró más en total).
- Se probó también un tercer approach (re-sort en sitio a "impresiones" sin reload, antes de extraer) — descartado: rompe el DOM de Meta y colapsa el conteo de ads cargados (204→21, 217→29 en la primera prueba). No se llegó a implementar en ninguna versión.

**Archivos afectados:** `lib/scrapers/meta-ads.ts`

**Riesgo:** solo

**Pendiente de verificar:** esta prueba se corrió sin candidatos reales (solo conteo bruto de ads únicos) — falta confirmar en el próximo sync real si los ads adicionales que capturó la pasada única generan matches reales con candidatos rastreados, sobre todo en comprasmart y thrivin (los 2 casos que venían en 0 matches con el approach anterior).

---

### CHANGE-055 — Filtro de país en pool: dropdown server-side con todos los países del pool

**Fecha:** 2026-06-16

**Qué cambió:**
- `dashboardApi.ts` — `getPoolWinners` ahora envía `country` como query param. Nuevo `getPoolCountries` (`GET /pool/countries`).
- `pool/page.tsx` — `countryFilter` pasó de `Set<string>` (multi-select client-side) a `string` (single-select), enviado al backend en `useGetPoolWinnersQuery`.
- `pool-winners.tsx` — los pills de país se reemplazaron por un `<select>`, alimentado por `useGetPoolCountriesQuery` (países distintos de TODO el pool, no solo la página de 20 cargada). Se eliminó el filtrado client-side de país (`filtered` useMemo) — ahora el backend ya devuelve solo lo que corresponde.

**Por qué:**
El filtro de país anterior operaba sobre `winners`, que es solo la página actual (20 ítems) — no podía filtrar productos fuera de esa página, y el dropdown solo mostraba países presentes en esa página. Pedido explícito del usuario: un dropdown con TODOS los países del pool, que filtre de verdad sobre todo el dataset. Ver FIX-039 en el repo backend para el detalle de los cambios server-side correspondientes (incluye también la 4ª señal de detección de país que cierra el hueco de tiendas como thritake.com).

**Qué NO cambió:** el bug pre-existente de `niche`/`currency`/`days`/`scalable` ignorados por el backend (TODO ya existente en el código) — fuera de alcance de este cambio, documentado como pendiente separado. `tracker-table.tsx` ("Mis testeos") no se tocó — ya tenía un dropdown de país funcionando correctamente sobre el dataset completo (su endpoint no pagina).

**Archivos afectados:**
- `app/(dashboard)/services/dashboardApi.ts`
- `app/(dashboard)/pool/page.tsx`
- `components/tracker/pool-winners.tsx`

**Riesgo:** con cuidado — toca un endpoint compartido (`/pool/winners`) y su contrato de filtros, aunque de forma aditiva (parámetro nuevo, comportamiento previo sin filtro queda igual).

---

### CHANGE-054 — Scraper: pausa más larga antes de scroll en dual-sort (descartar timing)

**Fecha:** 2026-06-16

**Qué cambió:**
- En el branch `probe.totalAdsOnMeta > 200`, la pausa final antes de `scrollToLoadAll` sube de 1500ms → 4000ms en la pasada de impresiones (2a), y de 2000ms → 4000ms en la pasada de recientes (2b). Sin cambios fuera de este branch.

**Por qué:**
Tras confirmar que CHANGE-052 funcionó (run 27595841892: la mayoría de las 6 tiendas dual-sort ya muestran `recientes únicos > 0`), quedaban 2 casos en 0 matches (comprasmart, thrivin). Análisis de evidencia: en ambos, el conteo final de la pasada de impresiones fue MAYOR que el del probe (comprasmart 19→23, thrivin 18→29) — la señal contraria al bug viejo (donde probe == final indicaba scroll pegado). Esto sugiere que el 0-matches no es un problema de timing/carga sino que esos candidatos simplemente no tienen ads enlazados a su página de producto en Meta en este momento. Se implementa la pausa más larga igual, a pedido explícito, para descartarlo por completo — no se espera que cambie el resultado de comprasmart/thrivin, pero es un cambio de bajo riesgo.

**Archivos afectados:** `lib/scrapers/meta-ads.ts`
**Riesgo:** solo — cambio de timing en una rama del scraper, no toca matching ni ingest.
**Pendiente de verificar:** correr un sync y confirmar que comprasmart/thrivin siguen en 0 matches (esperado, ya explicado por evidencia) y que no sube significativamente la duración total ni regresiona a las otras 4 tiendas dual-sort que ya estaban funcionando.

---

### CHANGE-053 — Sync: filtrar advertiser pages por ad realmente matcheado a un candidato

**Fecha:** 2026-06-16

**Qué cambió:**
- En `syncStore()` (paso F4), `advertiserMap` ya no agrega el `advertiser` detectado por el probe de forma incondicional, ni cualquier `advertiserName` que aparezca en `ads`. Ahora solo agrega el advertiser de un ad si ese ad tiene `matchedCandidateId` (es decir, si Meta lo devolvió como anuncio de un producto/candidato real de la tienda).
- Se quitó `advertiser` del destructuring de `scrapeResult` (quedó sin uso tras el cambio).

**Por qué:**
El run 27592121043 mostró el caso de hogar-inteligente.co: `[F4] ✓ 21 página(s) anunciante(s)` (PC-SOLUTIONS, ADT Costa Rica, Bazar Aram's, etc.) guardadas como anunciantes de la tienda, pero `[F3] 0 / 29 ads con candidato` — cero matches reales. La causa: esta tienda usa el fallback `effectiveMatch` (dominio no visible en el DOM, pero Meta devuelve resultados de búsqueda igual — log `≈ ... dominio no visible en DOM → scrapeando`). En ese modo, el "advertiser" del probe y los `advertiserName` de los ads pueden ser cualquier página que Meta asoció a la búsqueda por texto, no necesariamente la tienda real. Un ad con `matchedCandidateId` es la única señal confiable de que ese anunciante realmente vende ese producto — se usa como filtro.

**Verificación local (sin live scrape):** se replicó el bloque exacto de `advertiserMap` con datos sintéticos imitando el caso real (6 advertisers garbage sin match + 1 advertiser con `matchedCandidateId` real + 1 duplicado + 1 ad matcheado sin `advertiserName`). Resultado: solo el advertiser con match sobrevive, sin duplicados, con su `pageId` correcto. Test descartado tras confirmar (no se commitea, era solo de verificación).

**Archivos afectados:** `lib/jobs/sync-ads.ts`
**Riesgo:** con cuidado — afecta datos persistidos que el frontend consume (`AdvertiserPagesSection` en `app/(dashboard)/stores/[storeId]/page.tsx`), aunque la lectura/render del lado frontend ya estaba correcta (usa `pageId` para el link clickeable a Facebook) y no se tocó.
**Pendiente de verificar:** correr un sync real y confirmar que hogar-inteligente.co (y otras tiendas en modo `effectiveMatch`) ya no guardan advertiser pages sin match real — debería bajar a 0 páginas si sigue sin matches, o solo las legítimas si los hay.

---

### CHANGE-052 — Scraper: forzar sort "Impresiones" explícito en dual-sort (revierte parte de CHANGE-051)

**Fecha:** 2026-06-16

**Qué cambió:**
- El reload sin forzar sort de CHANGE-051 se reemplaza por `fixSortOrder(page, 'impressions')` + reload, solo dentro del branch `probe.totalAdsOnMeta > 200` (dual-sort). Las tiendas de un solo pase (≤200 ads, incluida esaske) siguen sin forzar nada — sin cambios para ellas.

**Por qué:**
El reload-sin-forzar de CHANGE-051 (probado en run 27592121043, tras esperar a que el backend de Easypanel volviera de un timeout) tampoco resolvió la regresión: mismo patrón de "0 nuevos" en las 6 tiendas dual-sort, con el conteo del probe idéntico al final de la pasada de impresiones en cada una (chic-lucky 22→22, thritake 3→3, comprasmart 19→19, thrivin 18→18, shoponlygo 30→30, coolddy 28→28) — descartando la hipótesis de "paginación trabada".

Nueva hipótesis con más evidencia a favor: el sort que Meta deja por defecto (el que usa pasada 2a sin forzar, desde commit `5437576`) ya no es "por impresiones" sino algo equivalente a "recientes"/relevancia. Sin forzar, pasada 2a y la pasada de recientes (2b, que sí fuerza "Más recientes") terminan viendo el mismo conjunto — de ahí el 0 nuevos consistente en 3 runs distintos (stagnant=2, stagnant=4, +reload). Esto también explica por qué quitar el forzado de impresiones arregló a esaske: el sort real por defecto sí mostraba sus productos en crecimiento que "Impresiones" forzado ocultaba.

Se restringe el forzado de "Impresiones" únicamente al branch dual-sort, donde sí necesitamos dos sorts genuinamente distintos para que el merge tenga sentido. Las tiendas de un solo pase (esaske y el resto con ≤200 ads) no se tocan — siguen usando el sort default sin forzar, que es lo que las arregló.

**Archivos afectados:** `lib/scrapers/meta-ads.ts`
**Riesgo:** solo — cambia el sort forzado únicamente dentro del branch >200 ads; no toca el path de esaske ni la lógica de matching/ingest.
**Pendiente de verificar:** correr un sync y confirmar (a) `recientes únicos` > 0 en al menos algunas de las 6 tiendas dual-sort, y (b) esaske sigue en ~30/30 (no debería verse afectada, queda fuera de este branch).

---

### CHANGE-051 — Scraper: reload de paginación antes de la pasada de impresiones (dual-sort)

**Fecha:** 2026-06-16

**Qué cambió:**
- Para tiendas con `probe.totalAdsOnMeta > 200` (las que disparan dual-sort), se agrega un `page.reload()` — sin forzar ningún sort — antes de la pasada 2a (impresiones). Las demás ~25 tiendas no se ven afectadas.

**Por qué:**
CHANGE-050 (subir `stagnantLimit` a 4 solo en la pasada de recientes) no resolvió la regresión de "0 nuevos" — el run 27589293246 mostró el mismo patrón: las 6 tiendas dual-sort en 0 matches únicos de recientes. Diagnóstico más profundo: en ese run, para las 31 tiendas SIN excepción, el conteo de `match detectado (N ads cargados)` del probe es idéntico al conteo final de la pasada de impresiones — la pasada 2a no scrollea nada nuevo, solo confirma lo que el probe ya había cargado. Como la pasada de recientes hace reload + ve el mismo techo bajo, ambas pasadas terminan con el mismo subconjunto pequeño de tarjetas, y "0 nuevos" es matemáticamente inevitable, no un problema de timing. Hipótesis: el probe deja la paginación de Meta trabada en el lote chico que cargó para detectar el match; el commit `5437576` (que quitó el reload forzado de la pasada 2a para arreglar el sesgo de esaske) eliminó el único mecanismo que destrababa esa paginación. Este cambio reintroduce el reload, pero sin forzar sort — separa "refrescar paginación" de "forzar orden", que era la causa del sesgo de esaske.

**Archivos afectados:** `lib/scrapers/meta-ads.ts`
**Riesgo:** solo — afecta timing/paginación del scroll en una rama del scraper (>200 ads), no toca lógica de matching ni de ingest.
**Pendiente de verificar:** correr un sync nuevo y confirmar que `recientes únicos` vuelve a tener matches >0 en las 6 tiendas dual-sort, sin que esaske regrese (sigue sin forzar sort en pasada 2a) ni que la duración total suba significativamente.

---

### CHANGE-050 — Scraper: umbral de estancamiento separado para la pasada de recientes

**Fecha:** 2026-06-16

**Qué cambió:**
- `scrollToLoadAll` ahora acepta un 4° parámetro `stagnantLimit` (default 2).
- La pasada de recientes (`fixSortOrder(page, 'recent')` + reload, dentro de `scrapeAdsForStore`) ahora llama `scrollToLoadAll(page, 50, 50, 4)` — 4 rondas de estancamiento en vez de 2. La pasada de impresiones no cambia (sigue en el default de 2).

**Por qué:**
Run 27587693514 (post CHANGE-049) bajó el sync a 17.3 min, pero el log `[F3-dual]` mostró `recientes únicos: 0 matches` en las 6 tiendas dual-sort, con conteos idénticos entre pasadas (ej. chic-lucky: 22/22, comprasmart: 30/30, thrivin: 18/18) — la pasada de recientes no estaba capturando ads nuevos en ninguna tienda, patrón 100% consistente que descarta coincidencia. Hipótesis: el umbral de 2 rondas (~8.4s) es insuficiente después del reload + click en "Más recientes" — el scroll se da por estancado antes de que Meta termine de aplicar el nuevo orden, dejando la pasada de recientes leyendo contenido todavía ordenado por impresiones. La pasada de impresiones no tiene este problema (no hay reload/cambio de sort de por medio), por eso mantiene el umbral rápido de 2.

**Archivos afectados:** `lib/scrapers/meta-ads.ts`
**Riesgo:** solo — cambio de timing en una rama del scraper, no toca matching ni ingest.

---

### CHANGE-049 — Scraper: reducir tiempo de estancamiento al fondo

**Fecha:** 2026-06-16

**Qué cambió:**
- `scrollToLoadAll`: eliminado el `waitForTimeout(5000)` extra al detectar estancamiento al fondo, y reducido el umbral de corte de 4 a 2 rondas consecutivas sin nuevos ads.

**Por qué:**
Análisis del sync run 27583736543 (39 min) vs run viejo 27550717277 (11 min): la mayor parte del tiempo extra venía del estancamiento. Con 4 rondas × 9.2s = 36.8s por tienda × 31 tiendas = 1140s (~19 min) solo esperando el fondo. La mayoría de tiendas tienen <50 ads activos y tocan fondo genuinamente — los 5s extra no cargan más ads. Con 2 rondas × 4.2s = 8.4s por tienda, ahorro estimado de ~880s (~15 min). El dual-sort para >200 ads se mantiene — shoponlygo y coolddy dependen críticamente de la pasada de recientes (12 y 7 matches respectivamente).

**Archivos afectados:** `lib/scrapers/meta-ads.ts`
**Riesgo:** solo — afecta solo el timing del scroll, no la lógica de matching ni de ingest.

---

### CHANGE-048 — Dual-sort scraper: scroll fix + pasada de recientes corregida

**Fecha:** 2026-06-15

**Qué cambió:**
1. `scrollToLoadAll` — reemplaza lógica de estancamiento fija (6 rondas) por corte basado en `atBottom`. Solo corta si el conteo no creció Y ya se llegó al fondo de la página. Antes salía con 20 ads; ahora llega a 200+.
2. Pasada de recientes — antes navegaba a una URL con `sort_data[mode]=creation_time` lo que confundía a Meta y retornaba 0 cards. Ahora navega a la misma URL de impresiones (fresh load) y DESPUÉS hace click en "Más recientes". Resultado verificado: 122 ads recientes cargados para thritake.com (>900 ads en Meta).
3. Orden de operaciones en pasada de recientes: `fixAdTypeFilter` → wait cards → `fixSortOrder` → `fixAdTypeFilter` de nuevo (Meta puede resetear el filtro al cambiar sort) → wait re-render → scroll.

**Por qué:** Tiendas con >200 ads activos solo mostraban 20 ads por estancamiento prematuro. Los productos en crecimiento (bajo número de impresiones, recientes) nunca aparecían en la pasada por impresiones.

**Archivos afectados:**
- `lib/scrapers/meta-ads.ts` — `scrollToLoadAll`, bloque pasada 2b en `scrapeAdsForStore`

---

### CHANGE-047 — F4: múltiples páginas anunciantes por tienda

**Fecha:** 2026-06-15

**Qué cambió:** El bloque F4 del sync ya no guarda solo la primera página anunciante descubierta. Ahora colecta todas las páginas únicas de los ads extraídos + la del probe, y las pushea en un solo `POST /internal/stores/{id}/advertiser-pages` (upsert). El backend guarda todas en la nueva tabla `store_advertiser_pages`.

**Por qué:** Una tienda puede tener múltiples páginas de Facebook anunciando para ella (comprasegura26 tenía ImportadorDirecto, NaturaZen y OfertasOnline). El modelo anterior solo guardaba una (la primera, y nunca la actualizaba).

**Archivos afectados:**
- `lib/jobs/sync-ads.ts` — F4 reemplazado, nueva función `pushAdvertiserPages`
- Backend: nueva tabla, entidad, repository y endpoint (en feature branch `feature/multiple-advertiser-pages`)

---

### CHANGE-046 — Scroll: page.mouse.wheel() en probe y scrollToLoadAll

**Fecha:** 2026-06-15

**Qué cambió:** Reemplazado el scroll incremental Node-side (`window.scrollTo` en pasos) por `page.mouse.wheel(0, 600)` repetido en ambos lugares: probe y `scrollToLoadAll`.

**Por qué:** `window.scrollTo` dentro de `page.evaluate` cambia `window.scrollY` pero no genera un evento de input real — los intersection observers de Meta no se disparan. `page.mouse.wheel()` es un evento físico de Playwright que sí los activa. comprasegura26 tiene 67 ads pero el scraper solo cargaba 30.

**Archivos afectados:**
- `lib/scrapers/meta-ads.ts` — loop de scroll en `probeSearchResults` y `scrollToLoadAll`

---

### CHANGE-045 — Probe: scroll incremental + fallback totalAdsOnMeta

**Fecha:** 2026-06-15

**Qué cambió:**
1. El loop de scroll del probe ahora usa el mismo patrón incremental Node-side (pasos de 800px) que `scrollToLoadAll` — el `scrollTo(0, scrollHeight)` anterior no disparaba el lazy load de Meta.
2. Si el check de DOM (`hasMatch`) falla pero Meta reporta resultados (`totalAdsOnMeta > 0`), se procede igualmente con el scraping. Se loguea `≈` en vez de `✓` para distinguirlo.

**Por qué:** `chic-lucky.com` fallaba el probe intermitentemente porque las ~15 cards que cargaban inicialmente no siempre incluían el dominio en texto visible. Con 680 resultados reportados por Meta para la búsqueda exacta del dominio, es evidencia suficiente para proceder.

**Archivos afectados:**
- `lib/scrapers/meta-ads.ts` — `probeSearchResults` (scroll) y `scrapeAdsForStore` (fallback)

---

### CHANGE-044 — Scroll: incremental en vez de salto directo al fondo

**Fecha:** 2026-06-15

**Qué cambió:** `scrollToLoadAll` ahora hace scroll incremental (pasos de 800px con 80ms de pausa) en vez de `scrollTo(0, scrollHeight)` que salta directo al fondo.

**Por qué:** `window.scrollTo(0, scrollHeight)` no dispara los intersection observers de Meta que controlan el lazy load de ads. En headless Chromium, el viewport nunca "pasa" por los elementos intermedios, así que Meta no carga más cards. Con scroll incremental el viewport recorre la página y activa el lazy load. `chic-lucky.com` tenía 680 ads disponibles pero el sync solo extraía 12.

**Archivos afectados:**
- `lib/scrapers/meta-ads.ts` — lógica de scroll en `scrollToLoadAll`

---

### CHANGE-043 — Scroll: dual-selector + umbral sort > 1000 + maxAds 500

**Fecha:** 2026-06-15

**Qué cambió:**
- `scrollToLoadAll` ahora usa dual-selector (`[role="article"]` primero, `[class*="_7jyh"]` como fallback) — igual que el probe. Stagnation threshold subió de 3 a 6 rondas.
- Sort por "Más recientes" ahora solo se activa con > 1000 ads (antes: > 200). Con ≤ 1000 se mantiene el sort por impresiones.
- `maxAds` sube a 500 cuando no se ordena por recientes (≤ 1000 ads). Con > 1000 se mantiene en 200.

**Por qué:** `chic-lucky.com` tiene ~660 ads pero el sync solo extraía 12. El selector `[class*="_7jyh"]` no matcheaba todos los cards para ese advertiser. Además, activar el sort por recientes con 660 ads reiniciaba la página y dejaba aún menos cards visibles. Con el nuevo umbral, tiendas con ≤ 1000 ads cargan hasta 500 con el sort original.

**Archivos afectados:**
- `lib/scrapers/meta-ads.ts` — `scrollToLoadAll` y bloque de sort en `scrapeAdsForStore`

---

### CHANGE-042 — Probe: fallback de dominio en textContent del card

**Fecha:** 2026-06-15

**Qué cambió:** En `probeSearchResults`, se agregó un fallback que verifica si el dominio de la tienda aparece como texto en el card cuando no se encontró ningún `<a href>` que apunte al dominio.

**Por qué:** Meta renderiza el dominio de destino del CTA (ej: "CHIC-LUCKY.COM") dentro de un `<div role="button">`, no como `<a href>`. El probe solo buscaba con `querySelectorAll('a[href]')`, lo que causaba `hasMatch = false` aunque los ads claramente apuntaran al dominio — bloqueando el scraping completo. `chic-lucky.com` tiene ~610 ads activos y el sistema scrapeaba 0.

**Archivos afectados:**
- `lib/scrapers/meta-ads.ts` — 4 líneas agregadas en `probeSearchResults`

---

### CHANGE-041 — Admin: dropdown para cambiar plan de usuario

**Fecha:** 2026-06-14

**Qué cambió:** En el panel admin (`/admin`), cada fila de usuario tiene ahora un dropdown en la columna Plan. El admin puede cambiar el plan de cualquier usuario (free/starter/pro/agency/admin) directamente desde la tabla. El cambio persiste en la base de datos vía `PATCH /api/admin/users/{id}/plan` y la tabla se refresca automáticamente.

**Por qué:** Usuario `hsebash4@gmail.com` no veía ads (plan Free → backend devuelve lista vacía). No existía forma de cambiar el plan desde la UI — el admin tenía que hacerlo directamente en la DB.

**Archivos afectados:**
- `app/(dashboard)/services/adminApi.ts` — nuevo mutation `updateUserPlan` + cache invalidation
- `app/(dashboard)/admin/page.tsx` — componente `PlanSelector` reemplaza `PlanBadge` en la columna Plan

---

### CHANGE-040 — Tracker: bandera de país en celda Tienda + filtro por país

**Fecha:** 2026-06-14

**Qué cambió:**
- Cada fila del tracker muestra la bandera emoji del país de la tienda (🇨🇴 🇲🇽 🇧🇷...) antes del nombre.
- Nuevo filtro "Todos los países" en la barra de filtros — aparece solo si hay más de 1 país distinto en los candidatos.
- `TrackerCandidate` type: campo `storeCountry: string | null`.
- `DashboardController.java` (`/api/dashboard/tracker`): campo `storeCountry` incluido en el response.

**Por qué:** Los dropshippers gestionan tiendas de múltiples países. La bandera da contexto visual inmediato para separar CO/MX/BR sin leer el nombre. El filtro permite enfocarse en un mercado específico.

**Afecta Redux:** No. Estado local del componente.

**Archivos modificados:**
- `app/(dashboard)/types/index.ts`
- `app/(dashboard)/tracker/page.tsx`
- `components/tracker/tracker-table.tsx`

**Archivos modificados (backend):**
- `src/main/java/com/shoptracker/controller/DashboardController.java`

---

### CHANGE-039 — EditStoreModal: select de país para tiendas USD
**Fecha:** 2026-06-14
**Tipo:** UI / edge case fix

**Qué cambió:**
- `EditStoreModal` muestra un `<select>` de país únicamente cuando `store.country === null` (tiendas con moneda USD donde el auto-detect no puede distinguir US vs EC).
- El select permite elegir manualmente entre los 9 países soportados. Al guardar, envía `country` en el body del PUT.
- `UpdateStoreRequest` type: campo opcional `country?: string`.

**Por qué:** USD es ambiguo — tanto US como Ecuador usan USD. Sin este campo el usuario no podía corregir el `null`.

**Qué NO cambió:** Para tiendas con país ya detectado (COP, MXN, etc.) el campo no aparece.

**Afecta Redux:** No.

**Archivos modificados:**
- `app/(dashboard)/stores/components/EditStoreModal.tsx`
- `app/(dashboard)/stores/types/index.ts`

---

### CHANGE-038 — Campo country en tiendas: detección automática por moneda
**Fecha:** 2026-06-14
**Tipo:** feature

**Qué cambió:**
- `StoreResponse` ahora incluye el campo `country: string | null` (código ISO-2, ej. "CO", "MX").
- `StoreCard` muestra el country como badge secundario junto a la moneda.
- `StoreRow` muestra el country code en la sección de nombre/URL.
- `types/index.ts`: `country: string | null` agregado a `StoreResponse`.

**Por qué:** Para el filtro por país en la vista de pool global (Data Infinita) y para dar más contexto al usuario sobre qué mercado opera cada tienda. No se pide al usuario — se detecta silenciosamente vía el mapping moneda→país que el backend ya calcula al detectar la moneda.

**Qué NO cambió:** Formulario de agregar tienda (sin nuevo campo), lógica de scoring, Redux.

**Afecta Redux:** No — solo tipo de respuesta y display.

**Archivos modificados:**
- `app/(dashboard)/stores/types/index.ts` — `country` en `StoreResponse`
- `app/(dashboard)/stores/components/StoreCard.tsx` — badge country
- `app/(dashboard)/stores/components/StoreRow.tsx` — country code en sección nombre

---

### CHANGE-037 — Sección de anuncios: cards llenan ancho completo + campo body_text
**Fecha:** 2026-06-14
**Tipo:** UI / feature

**Qué cambió:**
- `AdSlide` ahora usa `w-full` + `aspect-[9/16]` en lugar de dimensiones fijas `w-[160px] h-[284px]`. Las cards crecen para llenar su celda de grid.
- El grid en `ProductAdsSection` cambió de `flex flex-wrap` a `grid grid-cols-6`, de modo que los 6 slots llenan siempre el ancho disponible sin espacio en blanco a la derecha.
- Se agrega sección de copy debajo del botón "Ver en Meta →": si la API devuelve `body_text` en el objeto `Ad`, se muestra en texto pequeño con `line-clamp-3`. Si no hay copy, la sección no renderiza.
- Se agrega `body_text?: string | null` al interface `Ad` en `types/index.ts`.

**Por qué:** Las cards de 160px dejaban espacio en blanco visible a la derecha de la fila. El grid de 6 columnas con 1fr elimina ese espacio. El copy del anuncio es información clave para evaluar creativos — pendiente de implementación en el backend.

**⚠️ Pendiente para Diego:** el endpoint de ads (`GET /api/ads/:candidateId`) debe agregar el campo `body_text` (texto del anuncio de Meta) al objeto `Ad` en la respuesta. Sin ese campo el copy no aparece, pero el frontend ya está listo.

**Qué NO cambió:** lógica de dedup (×N), permisos por plan, floating video panel, `AdStripPreview`, `StoreVideosGrid`.

**Afecta Redux:** No — solo estado local.

**Archivos modificados:**
- `components/tracker/product-ads.tsx` — `AdSlide` (dimensiones, copy), grid en `ProductAdsSection`
- `app/(dashboard)/types/index.ts` — campo `body_text` en interface `Ad`

---

### CHANGE-036 — Sección de anuncios: de tabla plana a carrusel de slides 9:16
**Fecha:** 2026-06-13
**Tipo:** UI / feature

**Qué cambió:** `ProductAdsSection` reemplaza la vista de tabla (columnas #/Creativo/Anunciante/Días/Meta) por un carrusel horizontal de cards 9:16. Cada slide muestra: thumbnail grande, badge de días activo (verde si ≥30d), badge ×N para creativos repetidos, overlay inferior con plataforma (Facebook) y nombre del anunciante, fecha "Desde X" y "● Activo" debajo de la imagen, y botón "Ver en Meta →". Navegación con flechas ←/→ y contador "1 / N". El carrusel es también scrolleable por drag/swipe.

**Por qué:** La tabla plana mostraba información útil pero era visualmente pobre — las thumbnails (56px de ancho) no transmitían el formato real del anuncio. El carrusel 9:16 refleja cómo los usuarios ven el anuncio en Meta y facilita evaluar creativos de un vistazo.

**Qué NO cambió:** lógica de dedup por creativo (×N), permisos por plan (blur/lock para free), floating video panel en hover, `AdStripPreview`, `StoreVideosGrid`, helpers de formato.

**Afecta Redux:** No — solo estado local (`slideIdx`, `scrollRef`).

**Archivos modificados:**
- `components/tracker/product-ads.tsx` — nuevo componente `AdSlide`, constante `SLIDE_W`, carrusel en `ProductAdsSection`

### CHANGE-035 — StoreVideosGrid usa candidatos del pool (Explorar testeos) en vez de candidatos store-specific

**Fecha:** 2026-06-13
**Archivos:** `app/(dashboard)/stores/[storeId]/page.tsx`

**Qué cambió:** La sección "Videos de la tienda" en la página de detalle de tienda ahora filtra candidatos del pool global (`getPoolWinners`) por dominio de la tienda, en lugar de usar los candidatos store-specific (`getTrackerCandidates({ storeId })`).

**Por qué:** Los candidatos store-specific no tienen ads scrapeados en el backend — el scraper de Meta Ads opera sobre los candidatos del pool. Filtrar por dominio (`baseUrl`) permite cruzar la tienda con sus candidatos que sí tienen datos de anuncios.

**Pendiente para Diego:** La columna ADS en Mis testeos muestra vacío para los mismos productos porque sigue usando los candidatos store-specific. Requiere sincronización de ads en el backend entre candidatos del pool y candidatos del tracker, o un cambio en el endpoint.

---

### CHANGE-016 — Detalle de producto: revertir a tabla AdRow + mover sección sobre los charts
**Fecha:** 2026-06-12
**Tipo:** UX / posición

**Qué cambió:**
- `ProductAdsSection` revertida al layout de tabla (AdRow) después de múltiples intentos fallidos con grid horizontal (el flex row expandía el page layout a ~6800px independientemente del wrapper de overflow).
- Posición movida: la sección ahora aparece debajo del header card del producto (Current Rank / Best Rank / Growth / Confidence) y antes de los gráficos Rank Progression / Performance Score. Antes aparecía al fondo, después del Tracking History.
- Restaurado `showOrigin` (useSearchParams + isFromPool logic).
- Añadido `relative` al contenedor para que el lock overlay (absolute inset-0) se posicione correctamente.

**Qué NO cambió:** Header, dedup, sort, overlay de canViewAds, AdRow component.

**Archivos modificados:**
- `components/tracker/product-ads.tsx` — return restaurado a tabla AdRow; showOrigin restaurado.
- `app/(dashboard)/tracker/[candidateId]/page.tsx` — ProductAdsSection movida después del header card.

**Por qué:** El grid horizontal de cards quiebra el page layout por un conflicto CSS en el contexto específico del tracker page (flex items con shrink-0 expanden el layout a pesar de overflow-x-auto). Requiere investigación adicional con Diego. La tabla AdRow es visualmente correcta y no tiene ese problema.

---

### CHANGE-015 — Detalle de producto: sección de anuncios como grid horizontal
**Fecha:** 2026-06-12
**Tipo:** UX / visualización — REVERTIDO en CHANGE-016

**Qué cambió:** `ProductAdsSection` reemplazó la tabla AdRow por grid horizontal de `StoreVideoCard` (igual que "Videos de la tienda"). Dedup por creativo, ×N badge, product image y label del candidato.

**Por qué se revirtió:** El flex row de cards expandía el page layout a ~6800px. Ninguna combinación de overflow-hidden / overflow-x-auto / overflow-x-clip / min-w-max resolvió el problema sin romper otra cosa. Requiere investigación de raíz.

---

### CHANGE-014 — AdsCell: dedup por creativo antes de mostrar strip y count
**Fecha:** 2026-06-12
**Tipo:** UX / visualización

**Qué cambió:** `AdsCell` en `tracker-table.tsx` (columna ADS en "Explorar testeos") ahora deduplica los ads activos por creativo antes de calcular `previews` y `remaining`. Si hay 41 ads pero 18 creativos únicos, muestra 3 thumbnails distintos y `+15`, no `+38`.

**Qué NO cambió:** `ProductAdsSection` (detalle de producto) ya tenía dedup — funciona automáticamente con el content-hash de R2 sin cambios adicionales.

**Archivos modificados:**
- `components/tracker/tracker-table.tsx` — dedup con Map keyed por `thumbnail_url.split('?')[0]` antes de `slice(0, 3)`.

**Por qué:** El mismo video creativo corriendo como múltiples ads inflaba el count (`+58` cuando en realidad hay 18 creativos únicos). El content-hash en R2 (CHANGE-013) garantiza que mismo video = misma URL = dedup funciona.

---

### CHANGE-013 — R2: content-hash como filename para dedup de creativos idénticos
**Fecha:** 2026-06-12
**Tipo:** storage / scraper

**Qué cambió:** `mirrorUrlToR2` ahora computa SHA-256 de los bytes descargados y usa los primeros 40 chars del hash como filename en R2, en lugar del `adId`. El directorio y extensión no cambian. Ejemplo: `ads/videos/thritake-com/{sha256}.mp4` en lugar de `ads/videos/thritake-com/{adId}.mp4`.

**Qué NO cambió:** URLs existentes en DB (siguen funcionando — los archivos viejos en R2 permanecen). La firma pública de `mirrorUrlToR2` y `adMediaKey` no cambia. El caller sigue pasando el key basado en adId, pero la función lo reemplaza internamente.

**Archivos modificados:**
- `lib/storage/r2.ts` — import `createHash` de `crypto`. En `mirrorUrlToR2`: extraer dir y ext del key recibido, computar `sha256(buffer).slice(0,40)`, construir `contentKey = dir/hash.ext`, subir y retornar ese URL.

**Por qué:** Mismo video creativo en Meta corre como múltiples ads (diferentes ad IDs, diferentes URLs en Facebook CDN). El scraper los subía como archivos distintos en R2 → URLs distintas → el dedup frontend no funcionaba. Con content-hash, el mismo video siempre produce el mismo URL en R2 desde el primer sync.

**Efecto en el frontend:** A partir del próximo sync, ads con el mismo video tendrán el mismo `video_url_r2` → `StoreVideosGrid` los colapsa en un card `×N`.

---

### CHANGE-012 — Videos de la tienda: dedup por creativo, sort por count, label badge
**Fecha:** 2026-06-12
**Tipo:** UX / visualización

**Qué cambió:** El grid "Videos de la tienda" ahora: (1) deduplica creativos — el mismo video aparece como un solo card con badge `×N`; (2) ordena de más anuncios a menos (los creativos ganadores primero); (3) muestra el `performanceLabel` del candidato (Rising, Hot, etc.) en el card. Internamente, `StoreVideosForCandidate` se convirtió en un fetcher invisible que reporta sus ads al padre, y `StoreVideosGrid` acumula, deduplica y renderiza centralmente.

**Qué NO cambió:** Número de API calls (uno por candidato), lógica de hover panel, paywall.

**Archivos modificados:**
- `components/tracker/product-ads.tsx` — `StoreVideoCard` añade `count` + label badge. `StoreVideosForCandidate` pasa a render null y llama `onAds`. `StoreVideosGrid` acumula en Map, deduplica con creativeMap, ordena por count desc.

**Por qué:** El mismo video de un candidato con 19 ads aparecía 19 veces en el scroll. La dedup lo colapsa a 1 card con `×19`, y el sort pone los creativos más usados primero — señal de cuáles son los ganadores.

---

### CHANGE-011 — Videos de la tienda: mostrar todos los ads activos por candidato
**Fecha:** 2026-06-12
**Tipo:** UX / visualización

**Qué cambió:** La sección "Videos de la tienda" ahora muestra un card por cada ad activo de cada candidato, en lugar de uno solo por candidato. Un candidato con 19 ads activos contribuye 19 thumbnails al grid horizontal.

**Qué NO cambió:** La fuente de datos (mismo query por candidato), el diseño visual de cada card, la lógica de hover panel, el paywall de clic a Meta.

**Archivos modificados:**
- `components/tracker/product-ads.tsx` — `StoreVideoCard` ya no fetcha datos (recibe `ad: Ad` directamente). Nuevo componente `StoreVideosForCandidate` fetcha todos los ads del candidato y renderiza un card por cada uno. `StoreVideosGrid` usa `StoreVideosForCandidate`.

**Por qué:** El grid mostraba 8 thumbnails para una tienda con 17 candidatos y cientos de ads. El candidato #1 solo tenía 19 ads pero solo se veía 1. El usuario esperaba ver todos los videos que la tienda está corriendo en Meta.

---

### CHANGE-010 — Plan FREE puede ver anuncios igual que Starter
**Fecha:** 2026-06-12
**Tipo:** acceso / plan

**Qué cambió:** `canViewAds` en `usePlanTier()` ahora devuelve `true` para todos los planes, incluyendo FREE. Antes FREE veía un overlay con candado sobre la sección de anuncios. Ahora ve thumbnails + panel flotante con video al hover, igual que Starter.

**Qué NO cambió:** `allowMetaLink` sigue siendo exclusivo de Pro. Los thumbnails en el strip de la tracker-table siguen blur para non-Pro. Backend sin cambios.

**Archivos modificados:**
- `lib/view-as.tsx` — línea 66: `canViewAds = isPro || isStarter` → `canViewAds = true`

**Por qué:** Usuario `hsebash4@gmail.com` (FREE) reportó que no veía los videos de anuncios. Se decidió dar acceso de visualización a todos los planes como primer valor entregado.

---

### CHANGE-010 — Dedup de ads por video: badge ×N en thumbnail + R2 key por source URL
**Fecha:** 2026-06-12
**Tipo:** mejora / UI + scraper

**Por qué:** La misma tienda puede correr N anuncios distintos usando el mismo video (mismo creative). Antes aparecían N filas idénticas. Ahora se colapsan en una sola con un badge naranja ×N, que indica cuántos anuncios usan ese video — a mayor número, más señal de ganador.

**Qué cambió:**
- `components/tracker/product-ads.tsx` — dedup de `sorted` por `thumbnail_url` (sin query params) antes del render. `AdRow` acepta prop `count` y muestra badge `×N` en esquina del thumbnail cuando `count > 1`.
- `lib/scrapers/meta-ads.ts` — R2 mirror ahora usa `sourceUrlCache`: si dos ads del mismo scrape comparten la misma URL de thumbnail original, se reutiliza el mismo objeto R2. Mismo creative → misma URL en DB → dedup del frontend funciona.

**Riesgo:** solo — display puro en frontend. Scraper: solo afecta qué key se usa en R2 para nuevas subidas, sin cambios en contratos de API ni DB.

---

### CHANGE-009 — Sort automático por "Más recientes" para tiendas con más de 200 ads en Meta
**Fecha:** 2026-06-12
**Tipo:** mejora / scraper

**Por qué:** El scraper cargaba los 200 ads por defecto en orden de impresiones — los más veteranos y escalados. Para tiendas con más de 200 ads activos, esos 200 no son necesariamente los más relevantes para detectar productos nuevos. Ordenando por "Más recientes" se prioriza el catálogo actual de la tienda, mejorando el match rate. Validado en thritake.com: 41/108 matches vs 20/201 con el orden anterior.

**Qué cambió:**
- `lib/scrapers/meta-ads.ts` — nueva función `fixSortOrder` (interacción UI con dropdown de Meta, igual que `fixAdTypeFilter`). Se llama automáticamente después del probe si `totalAdsOnMeta > 200`.
- `lib/scrapers/meta-ads.ts` — `buildSearchUrl` acepta parámetro `sort` (preparación, Meta lo ignora vía URL).
- Sin cambios en `sync-ads.ts` — la lógica es completamente automática.

**Riesgo:** solo — lógica interna del scraper, sin cambios en contratos de API, Redux ni base de datos.

---

### CHANGE-008 — Fix: scrollToLoadAll sale después de 3 scrolls sin nuevas cards, no del primero
**Fecha:** 2026-06-12
**Tipo:** fix / scraper

**Por qué:** El scraper detectaba que una tienda tenía ads en Meta (ej: thritake.com con ~1.500) pero solo extraía 17 — los que cargó el probe. `scrollToLoadAll` salía en el segundo intento porque el lazy loading de Facebook no respondía en el primer scroll adicional. El resultado era un `17 ✓` silencioso cuando el objetivo eran 200.

**Qué cambió:**
- `lib/scrapers/meta-ads.ts` — `scrollToLoadAll` ahora requiere 3 scrolls consecutivos sin nuevas cards antes de parar. El cap de 200 ads no cambia.

**Riesgo:** solo — lógica interna del scraper, no afecta contratos de API ni store de Redux.

---

### CHANGE-007 — Documentación de diseño: Sistema de Alertas completo
**Fecha:** 2026-06-12
**Tipo:** documentación / diseño de arquitectura

**Por qué:** El sistema de alertas existe parcialmente (AlertService envía Rocket sin verificar plan). Antes de ampliar, se necesita una fuente de verdad que documente el diseño completo, las reglas de negocio, y las fases de implementación. Este documento es esa fuente.

**Qué cambió:**
- Creados 5 documentos en `docs/alerts/`
- `alerts-overview.md` — visión, 3 tipos, principios
- `alerts-architecture.md` — integración con pipeline, modelo de datos, idempotencia, canales
- `alerts-rules.md` — catálogo completo: 9 alertas con condición SQL exacta, cooldowns, copys
- `alerts-digest-spec.md` — especificación del email digest: secciones, layout HTML, caso sin novedades
- `alerts-roadmap.md` — 4 fases, riesgos, dependencias, tabla estado actual vs. falta

**Discrepancias encontradas en el codebase:**
- `AlertService` no verifica `user.plan` — usuarios Free reciben alertas Rocket (bug)
- `previous_rank` y `entry_score` en `ScoreSummary.java` no están en `schema.sql` (migración faltante)
- `EmailService.buildHtml()` usa gradientes — contradice el principio "sin gradientes" de la marca

**Riesgo:** solo — documentación, sin modificar lógica de producción.

---

### CHANGE-006 — Restricción de paginación para plan Starter en Explorar testeos
**Fecha:** 2026-06-12
**Tipo:** feature / access control

**Por qué:** El plan Starter debe tener acceso limitado al pool — solo la primera página. Esto crea un incentivo concreto para subir a Pro y alinea la propuesta de valor con los niveles de plan.

**Qué cambió:**
- Si un usuario Starter intenta navegar a página 2+, ve un componente `PageLockedForStarter`: 4 filas blureadas + overlay con candado + CTA "Actualizar a Pro".
- En la paginación (cuando el usuario está en página 1), los botones de página 2+ se renderizan con un icono `Lock` en lugar del número — no son clicables.
- El botón "Siguiente" queda `disabled` para usuarios Starter.
- La lógica usa `isStarter` del hook `usePlanTier()` ya existente — sin nuevo estado, sin Redux.

**Archivos modificados:**
- `components/tracker/pool-winners.tsx` — guard `if (isStarter && page > 0)`, paginación bloqueada, nuevo componente `PageLockedForStarter`

**Riesgo:** solo — display puro, sin afectar lógica de scoring ni backend.

**Verificación:** TypeScript sin errores nuevos (tsc --noEmit). Visual: usuario Starter en page 0 ve paginación con locks en páginas 2+; al llegar a page 1 ve overlay con candado.

---

### CHANGE-006 — AdvertiserBadge visible aunque no haya videos con match

**Fecha:** 2026-06-11

**Por qué:** Productos como "Camiseta Colombia Roja/Negro" tienen anunciante identificado en base de datos pero sus ads no pasan el filtro de activos (status inactive o sin thumbnail). El early return previo descartaba esa información y mostraba solo los placeholders vacíos, desperdiciando la data del anunciante.

**Qué cambió:** En `AdsCell` (tracker-table.tsx), el bloque `if (active.length === 0)` ahora extrae `advertiser_name` de todos los ads no-test (incluyendo inactivos). Si encuentra anunciantes, muestra los placeholders + los `AdvertiserBadge` con el link a Meta Ads Library.

**Archivos tocados:**
- `components/tracker/tracker-table.tsx` — lógica del early return en `AdsCell`

**Afecta Redux:** No. Solo estado local del RTK Query hook.

---

---

### CHANGE-034 — Framework multi-proyecto: starter-kit, agente auditor y formalización del vault
**Fecha:** 2026-06-11
**Tipo:** docs / infra

**Qué cambió:** Se estableció el framework de escalamiento a múltiples proyectos futuros:
- `~/.claude/CLAUDE.md` extendido con protocolos universales (niveles de riesgo, specs, escalamiento, verdad del código, doble registro, Protocolo de promoción a SecondBrain, referencia a /cierre)
- `~/.claude/agents/auditor.md` — subagent de solo lectura para revisiones pre-commit y auditorías
- `~/.claude/commands/cierre.md` — comando global `/cierre` de cierre de sesión
- `~/Desktop/SecondBrain/CLAUDE.md` extendido con tres categorías de admisión para conocimiento transversal
- Vault Shoptracker: `raw/` materializada; `CLAUDE.md` extendido con regla de subordinación y LINT formalizado; `wiki/lint-2026-06-11.md` creada; `index.md` actualizado

**Por qué:** Dropspy tiene un framework maduro (skills, SPEC-TEMPLATE, DEV-CHANGE). Este cambio lo escala a todos los proyectos futuros y formaliza la relación wiki-código (wiki es derivada, el código manda).

**Hallazgo del lint:** `scout-score-momentum.md` documenta fórmula v4 pero producción corre v5 — marcado STALE, pendiente confirmación Diego (ver DECISION-004). 2 páginas wiki huérfanas. Archivos no-wiki en vault root — limpieza pendiente de aprobación del usuario.

**Archivos creados/modificados:**
- `~/.claude/CLAUDE.md`, `~/.claude/agents/auditor.md`, `~/.claude/commands/cierre.md`
- `~/Desktop/SecondBrain/CLAUDE.md`
- `~/Desktop/Shoptracker/CLAUDE.md`, `raw/`, `wiki/lint-2026-06-11.md`, `index.md`
- `docs/CHANGES.md` (esta entrada), `docs/DECISIONS.md` (DECISION-006)

**Relacionado con backend:** No aplica.
**Wiki actualizado:** Sí — lint-2026-06-11.md + index.md + log.md del vault.

---

### CHANGE-033 — Store detail: grid de videos de la tienda
**Fecha:** 2026-06-11
**Tipo:** feature

**Qué cambió:** Se agregó la sección "Videos de la tienda" en la página de detalle de cada tienda (`/stores/[storeId]`). Muestra un scroll horizontal de tarjetas 9:16, una por producto (candidato) que tenga al menos un ad activo. Cada tarjeta muestra el thumbnail/video del primer ad activo, un overlay de play en hover, los días corriendo el ad, y la imagen del producto en esquina inferior izquierda (decorativa). El clic abre el `ad_snapshot_url` en Meta — disponible solo para Pro/Agency/Admin. Starter ve las tarjetas pero el clic está bloqueado con un lock en hover.

**Por qué:** Dar al usuario un vistazo rápido de la actividad publicitaria de la tienda completa antes de entrar al detalle de cada producto.

**Archivos modificados:**
- `components/tracker/product-ads.tsx` — nuevo componente `StoreVideosGrid` + subcomponente `StoreVideoCard`
- `app/(dashboard)/stores/[storeId]/page.tsx` — importa y renderiza `StoreVideosGrid` entre el store header y el Top 5 productos

**Sin cambios de backend:** reutiliza `GET /candidates/{candidateId}/ads` por candidato.

---

### CHANGE-032 — Documentación de estrategia de orquestación de agentes en roadmap
**Fecha:** 2026-06-11
**Tipo:** docs

**Qué cambió:** Se creó `docs/ROADMAP.md` con la estructura base del roadmap del proyecto (secciones Ahora / Próximo / Diferido). Se registró la estrategia de orquestación de agentes (subagents y agent teams) bajo `ROADMAP-001` con estado DIFERIDO. Se actualizaron `docs/DECISIONS.md` (DECISION-005) y este archivo.

**Por qué:** Los agent teams de Claude Code fueron evaluados como herramienta de aceleración del desarrollo. El diferimiento es por costo de tokens del plan actual y por ser feature experimental. La Fase A (subagents dentro de sesiones normales) queda permitida desde ya. Registrar la decisión evita re-evaluar el mismo tradeoff en futuras sesiones.

**Archivos creados/modificados:**
- `docs/ROADMAP.md` — nuevo. Estructura base + ROADMAP-001
- `docs/DECISIONS.md` — DECISION-005 agregada
- `docs/CHANGES.md` — esta entrada

**Relacionado con backend:** No aplica.
**Wiki actualizado:** No aplica (decisión de tooling, sin impacto en lógica de producto).

---

### CHANGE-031 — Fase A Spikear: verbo propietario + mecánica visual de espinas
**Fecha:** 2026-06-11
**Tipo:** feature

**Qué cambió:** Se introdujo el concepto "Spikear" como acción propietaria de SCOUT para activar seguimiento activo de un producto candidato. Reemplaza el label estático "Escalar" con un botón interactivo. Al hacer click, aparecen raíces SVG sobre la imagen del producto; las espinas crecen/decrecen/desaparecen según el delta del score vs. el piso fijado en el momento de spikear. Estado persistido en localStorage (sin backend, Phase A).

**Por qué:** diferenciación de marca — ningún competidor tiene un verbo propio para esta acción. Las espinas son la visualización directa del momentum del producto desde que el usuario decidió actuar. Ver wiki `scout-spikear.md` para la filosofía completa.

**Lógica de espinas:**
- `score > floor` y subiendo → espinas crecen (color esmeralda)
- `score > floor` pero bajando → espinas decrecen (color ámbar)
- `score < floor` → espinas desaparecen, producto sale de spike mode automáticamente
- Al hacer click: aparecen raíces (estado inicial, score en piso)

**Archivos creados:**
- `lib/spike-store.ts` — localStorage CRUD + cálculo de estado y nivel de espina
- `components/tracker/spike-overlay.tsx` — overlay SVG de raíces/espinas sobre imagen del producto

**Archivos editados:**
- `components/tracker/tracker-table.tsx` — badge "Escalar" → botón "Spikear" interactivo + SpikeOverlay en imagen + filtro renombrado
- `app/(dashboard)/tracker/[candidateId]/page.tsx` — label "Listo para escalar" → botón "Spikear" / "Spikeando"

**Pendiente Fase B (requiere Diego):** migrar spike_floor y spiked_at a base de datos; endpoint POST /candidates/{id}/spike para persistir entre dispositivos.

---

### CHANGE-030 — Auditoría del Performance Score contra 7 casos borde
**Fecha:** 2026-06-10
**Tipo:** docs

**Qué cambió:** Se creó `docs/AUDIT-SCORE-2026-06-10.md` auditando el scoring real del backend (`TrackingService.java`, copiado a `backend-src/` para lectura) contra 7 casos borde. Solo diagnóstico — ningún fix de scoring implementado.

**Por qué:** validar que la intención de producto del score coincide con lo que corre en producción antes de seguir construyendo encima.

**Hallazgos principales:** (1) la fórmula en producción es una v5 no documentada (`g×0.5 + rq×0.3 + wm×0.2`, señales independientes) que reintroduce el problema que v4 resolvía; (2) los labels son bandas de score (≥70/≥50/≥30/≥15), no tendencias — "Declining" en día 1 para productos top; (3) el veto frontend de Declining usa `growthPct < 0`, imposible porque el backend clampa ≥0; (4) productos estancados en la cima se expiran en el día 10 como si estuvieran muertos; (5) rank=0 produce un score astronómico (~10¹⁶) con label Rocket; (6) la racha "Xd en top 10%" del frontend divide ranks históricos por el total de hoy. Detalle y propuestas en el archivo de auditoría, sección "Para Diego".

**Archivos creados:**
- `docs/AUDIT-SCORE-2026-06-10.md` — nuevo
- `CLAUDE.md` y `docs/DECISIONS.md` — actualizados con los umbrales/fórmula reales del backend

**Relacionado con backend:** requiere revisión de Diego (6 puntos listados en la auditoría). Ningún FIX-NNN aún.
**Wiki actualizado:** pendiente — `scout-score-momentum` describe la fórmula v4 superada; actualizar tras confirmación de Diego.

---

### CHANGE-031 — Framework operativo: SPEC-TEMPLATE, DECISIONS y gobierno CLAUDE.md
**Fecha:** 2026-06-10
**Tipo:** docs
**Nota de numeración:** esta entrada era CHANGE-029 en la sesión original perdida; CHANGE-029 fue ocupado por la instalación de skills en la sesión de recuperación (2026-06-11).

**Qué cambió:** Se estableció el framework operativo para sesiones con Claude: (1) `CLAUDE.md` actualizado con principios de diseño, reglas canónicas de labels, lista de regresiones prohibidas verificada contra el código real, protocolo de cambios y verificación mínima; (2) `docs/SPEC-TEMPLATE.md` — plantilla obligatoria para cambios medianos/grandes con nivel de riesgo (solo / con cuidado / Diego); (3) `docs/DECISIONS.md` — registro de decisiones reconstruido desde el vault y el código.

**Por qué:** Daniel no es desarrollador; el framework reduce el riesgo de cambios prompteados sin contexto y define cuándo detener todo y flagear a Diego (scoring, DB, migraciones, arquitectura).

**Hallazgos al verificar contra código real (solo diagnóstico — no se corrigió nada):**
- Regresión viva: `tracker/[candidateId]/page.tsx:589` muestra `peakGrowthPct` con `%` (debería ser el score, no el porcentaje).
- Falta clamp de `topPct` ≤100 en `hero-signal-card.tsx:88` y en la narrativa de `page.tsx:601` (sí existe en `tracker-table.tsx` y `pool-winners.tsx`).
- Sistema de labels inconsistente entre `lib/types.ts`, `performance-badge.tsx`, `kpi-cards.tsx` y `label-utils.ts`.
- La regla "Declining nunca si currentRank === bestRank" no está implementada en ningún punto del frontend.

**Archivos creados/modificados:**
- `docs/SPEC-TEMPLATE.md` — nuevo
- `docs/DECISIONS.md` — actualizado
- `CLAUDE.md` — actualizado

**Relacionado con backend:** pendiente auditoría del Performance Score (AUDIT-SCORE-2026-06-10) sobre `TrackingService.java`.
**Wiki actualizado:** pendiente — registrar en `log.md` del vault.

---

### CHANGE-029 — Instalación de skills de React y Redux Toolkit en `.claude/`
**Fecha:** 2026-06-11
**Tipo:** infra / configuración

**Qué cambió:** Se instalaron 23 skills de código en `.claude/skills/` para guiar a Claude al generar código React/Redux. Las skills son archivos de criterio (solo markdown) — no modifican código de la app ni dependencias del `package.json`.

**Skills instaladas:**
- `redux-toolkit` — patrones RTK: slices, selectores, RTK Query
- `react-core-architecture`, `react-core-state`, `react-core-concurrent` — arquitectura React
- `react-syntax-*` (8 skills) — hooks, jsx, componentes, eventos, contexto, refs, formularios
- `react-impl-testing`, `react-impl-performance`, `react-impl-styling`, `react-impl-server-components`, `react-impl-data-fetching` — implementación
- `react-errors-boundaries`, `react-errors-debugging`, `react-errors-hooks`, `react-errors-hydration` — debugging
- `react-agents-review`, `react-agents-project-scaffolder` — revisión y scaffolding

**Skills descartadas:** `react-impl-project-setup` (orientada a Vite, incompatible con Next.js) y `react-impl-routing` (enseña React Router, usamos Next.js App Router). Ver `docs/DECISIONS.md` (DECISION-001) para el razonamiento completo.

**Archivos modificados:**
- `.claude/skills/` — 23 carpetas nuevas (solo markdown, sin impacto en build)
- `CLAUDE.md` — sección `## Skills instaladas — reglas de uso` agregada al final
- `docs/SKILLS-CHEATSHEET.md` — guía de uso para Daniel (nuevo)
- `docs/DECISIONS.md` — registro de decisiones (nuevo)

**Relacionado con backend:** No aplica.
**Wiki actualizado:** No aplica.

---

### CHANGE-010 — Badge bloqueado mantiene fondo azul Facebook
**Fecha:** 2026-06-10
**Tipo:** fix

**Qué cambió:** El `AdvertiserBadge` en estado bloqueado (`!allowMetaLink`) mostraba fondo negro (`#1a1a1a`) y texto gris. Ahora mantiene siempre `background: #1877F2` y `color: #fff`. La diferencia visual entre activo y bloqueado es únicamente: blur en el nombre del anunciante + ícono de candado a la derecha.

- **Archivo:** `components/tracker/product-ads.tsx` — función `AdvertiserBadge` (estilos inline + render del nombre)
- **Por qué:** El badge oscuro confundía al usuario — parecía un elemento roto, no un gate de plan.

---

### CHANGE-009 — Badge de anunciante con link directo al centro de anuncios de Meta
**Fecha:** 2026-06-10
**Tipo:** feature

**Qué cambió:** El `pageId` del anunciante ya se extraía en el scraper por card pero no se persistía. Ahora se propaga hasta la UI en un badge clicable.

- **Scraper** (`sync-ads.ts`): `pushAds()` ahora incluye `advertiserPageId` en cada ad del payload.
- **Tipo** (`types/index.ts`): campo `advertiser_page_id` agregado al tipo `Ad`.
- **Componente** (`product-ads.tsx`): nuevo `AdvertiserBadge` con logo FB + nombre del anunciante. Link a `facebook.com/ads/library/?search_type=page&view_all_page_id={pageId}`. Badges en el header de `ProductAdsSection` (vista detalle). Azul si Pro + tiene pageId; gris sin click si Free.
- **Tabla** (`tracker-table.tsx`): badges de anunciantes únicos debajo de los thumbnails en `AdsCell`.
- **Backend**: `ProductAd.java` + `schema.sql` (columna `advertiser_page_id`), `WebhookController.java` (acepta el campo), `DashboardController.java` (lo incluye en el response).

**Por qué:** Permite ir directo al centro de anuncios del anunciante en Meta, que muestra TODOS sus ads activos — no solo los del candidato puntual. Es el punto de entrada para competencia directa y research de creativos.

**Archivos modificados:**
- `lib/jobs/sync-ads.ts`
- `app/(dashboard)/types/index.ts`
- `components/tracker/product-ads.tsx`
- `components/tracker/tracker-table.tsx`
- Backend: `ProductAd.java`, `schema.sql`, `WebhookController.java`, `DashboardController.java`

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
