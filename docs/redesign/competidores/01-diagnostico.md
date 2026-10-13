# Competidores (`/stores`): diagnóstico

**Fecha:** 2026-10-13 · **Base:** `own/main` `1abd2f9` (lo que corre en producción) · **Backend:** `Diemendozac/ShopTracker` `origin/master` `df2a6d4`

**Detonante:** captura de producción de Daniel (2026-10-13). Las tarjetas se montan unas sobre otras, aparecen textos "fantasma" ("Activa", "Estable", "⋮") encima de otras tiendas, y el distintivo "Inactiva" sale cortado ("Inac").

## Qué hace la pantalla y para quién

La usa el dropshipper Drop 2.0 que sigue de 5 a 15 tiendas de su competencia. Responde tres preguntas: ¿quién está lanzando?, ¿qué le funciona?, ¿qué tienda no vale el cupo? (ver la página del vault `audiencia-drop2`). La acción principal es **Seguir tienda**, y la segunda es entrar a la ficha de una tienda.

## Hallazgos (archivo:línea en `own/main`)

| # | Severidad | Hallazgo | Dónde |
|---|---|---|---|
| 1 | **Alta** | **Las tarjetas se desbordan sobre la vecina.** `<article className="grid …">` no define columnas, así que usa una columna implícita `auto`. El tamaño mínimo de esa columna es el *min-content* de sus hijos, y un texto con `truncate` (`white-space: nowrap`) tiene como *min-content* todo su largo. Con un título largo, la columna crece hasta el ancho del título y todo lo de la derecha (distintivo, ⋮, barras, señal) se corre fuera de la tarjeta. Medido con datos de ejemplo: **6 de 9 tarjetas desbordadas, hasta 456 px**, a 390 y a 1440. | `components/stores/store-card.tsx:60` |
| 2 | **Alta** | **Los textos "fantasma" salen de `opacity-90`.** Las tiendas quietas llevaban `opacity-90`, que las vuelve translúcidas y crea un contexto de apilamiento. Por eso lo que se sale de la tarjeta de al lado se ve a través, atenuado. Además baja el contraste del texto de esas tarjetas. | `store-card.tsx:60` |
| 3 | **Alta (verdad)** | **La pantalla pide soltar las tiendas que más lanzan.** En producción, dos tiendas con 29 y 28 productos nuevos en 7 días salían "Inactiva · está quieta: considera liberar este cupo". El tier viene del backend (`StoreSyncService.updateInactivityScore`, `:283-314`): con un producto nuevo hace ≤ 7 días la recencia aporta 0, pero el 60 % restante del puntaje es `0,35 × % de productos no "Rising" + 0,25 × (100 − puntaje medio / 60)`. Un producto recién lanzado no puede ser "Rising" el primer día (su puntaje máximo ronda 30, ver CLAUDE.md), así que **lanzar mucho sube la inactividad**: con todo nuevo da 35 + 25 = 60 → INACTIVA. Pasa en Competidores, en Hoy (`components/home/store-health.tsx`) y en la ficha (`stores/[storeId]/page.tsx:157`), porque las tres usan `storeHealth` (`lib/today.ts:102-120`). | backend + `lib/today.ts:111-117` |
| 4 | Media (verdad) | **Si el servidor falla, la pantalla dice que no tienes tiendas.** Con `GET /stores` en 500 se ve "Todavía no sigues ninguna tienda" y "0 de 15 tiendas en tu plan". `useStores` ya expone `error`, pero la página no lo usaba. | `app/(dashboard)/stores/page.tsx:126`, `:73-81` |
| 5 | Media | Las barras de "semanas previas" usan `bg-primary-subtle`: **1,16:1** sobre la tarjeta (WCAG 1.4.11 pide 3:1 en gráficos). Con un 0 en esas semanas casi no se ven. Las barras no tenían rótulo visible: no se sabía qué medían. | `store-card.tsx:100-104` |
| 6 | Baja | Los países fuera de un mapa fijo de 8 se mostraban como código: "CN", "GB". Ya existía `countryName()` (con `Intl.DisplayNames`) en la biblioteca de anuncios. | `store-card.tsx:28` |
| 7 | Baja | "Activa" en todas las tarjetas sanas: es ruido verde que compite con los estados que sí piden atención (Moderada, Inactiva, Pausada). | `store-card.tsx:70` |
| 8 | Baja | El orden ponía las "Moderada" antes que tiendas sanas con más lanzamientos, porque `storeHealth` ordena por tono (pensado para Hoy) y la página lo heredaba. El comentario de la página decía "activas primero por productos nuevos". | `page.tsx:49-61` |
| 9 | Baja | El título del mejor producto se cortaba en una línea. Los títulos de Shopify traen prefijos de promoción y emojis ("⏳LAST DAY SALE ONLY £13.99!!🔥✨…"), así que en una línea casi nunca se llegaba al nombre real del producto. No había foto. | `store-card.tsx:112` |

**Sin hallazgos:** no hay `href="#"`; el menú ⋮ tiene nombre accesible; el estado vacío y el de carga existen; a 390 px no hay scroll horizontal de página (el desborde queda dentro de la grilla).

**Fuera de alcance (anotado, no tocado):**
- En `stores/[storeId]`, `components/stores/store-launches.tsx:54` repite el problema de contraste de las barras (`bg-primary-subtle`). Va con el ítem 7 de la cola.
- La barra superior translúcida deja ver el contenido que pasa por debajo; se nota en la captura de producción detrás de "Corte: hoy…". Es del layout compartido (ítem 2 de la cola).
- En `components/tracker/pending-candidates.tsx` ("Nuevos por revisar"), a 390 px el título y la línea de datos se cortan muy pronto.

## Tabla de verdad

| Afirmación en pantalla | Dónde se cumple | Veredicto |
|---|---|---|
| "N de M tiendas en tu plan" | `me.maxStores` (`userApi`), que sale de `PLAN_MAX_STORES` del backend. Se cuentan las tiendas `isActive` (`page.tsx:39-40`). | EXISTE. Los límites publicados y los del backend todavía no coinciden: ver `scout-limite-tiendas-propuesta` en el vault. |
| "N productos nuevos en 7 días" | Candidatos con `daysElapsed ≤ 7` de `GET /dashboard/tracker` (`lib/today.ts:103-106`). El backend devuelve solo `trackingStatus = 'active'` (`DashboardController.java:122`). | EXISTE, con un límite: **no cuenta los que están en "Nuevos por revisar"** (pendientes). Sin la detección automática, el número se queda corto. Queda anotado; no se cambia el texto. |
| Barras "últimas 4 semanas" | `launchesByWeek` (`store-card.tsx`), con los mismos candidatos activos. | EXISTE, con el mismo límite. |
| "Su mejor producto ahora" | El candidato activo con mayor `performanceScore`, y la señal por `computeSignal` (`lib/signal.ts`). | EXISTE. |
| "N anuncios activos" | `GET /dashboard/stores/{id}/ads/count` → `productAdRepo.countActiveAdsByStoreId` (`DashboardController.java:772-782`). | EXISTE. |
| "Activa / Moderada / Inactiva / Sin movimiento" | `inactivityTier` del backend (`StoreSyncService.java:283-314`). | EXISTE, pero **"Inactiva" es falso para las tiendas que lanzan mucho** (hallazgo 3). |
| "Está quieta: considera liberar este cupo" | Derivado del tier `bad`. | **Falso** en el caso del hallazgo 3. Corregido en el frontend (CHANGE-143); la causa queda para Diego. |

## Capturas "antes"

`capturas/antes/`, con `tools/capturas.mjs` (Playwright y la API simulada con datos de ejemplo; nombres y títulos inventados que reproducen el caso de producción): `datos`, `vacio`, `error` y `cargando`, a 390 y 1440. La sesión es falsa (JWT sin firma) y no hay backend real.
