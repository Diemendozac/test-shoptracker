# 03 · Spec para la fase 2 (implementación)

Implementa las opciones recomendadas de [`02-propuesta.md`](./02-propuesta.md): el **panel de triage** para `/pool` y **ficha + veredicto** para `/tracker/[candidateId]`. Todavía no se implementa nada.

**Niveles de riesgo:**

- **solo:** un componente que usa una sola vista y se revierte solo.
- **con cuidado:** toca piezas compartidas o el layout de varias vistas, así que hay que revisar a mano cada lugar donde aparece.
- **requiere-revisor-técnico:** cambia lo que el usuario interpreta de los datos, o necesita una decisión de Diego antes de mergear.

## Orden y dependencias

Cada fila es un PR independiente, con su entrada en `docs/CHANGES.md` (regla de CLAUDE.md) y reversible por sí solo.

| # | Spec | Riesgo | Depende de |
|---|---|---|---|
| 1 | **S7** Fechas cortas y seguras | con cuidado | — (conviene confirmar con Diego el formato de fecha de la API) |
| 2 | **S4** Gráficos con tokens y en español | con cuidado | S7 |
| 3 | **S3** Tarjeta de anuncio v2 y sección de anuncios | con cuidado | S7 |
| 4 | **S1** Shell: que `sticky` funcione | con cuidado | — |
| 5 | **S2** Pool: split desde `xl`, cabecera igual a las filas, `Sheet` por debajo | con cuidado | S1 |
| 6 | **S5** Panel del pool, composición A | solo | S2, S3, S4 |
| 7 | **S6** Página de detalle, composición A | con cuidado | S3, S4, S7 y el OK de Diego a la columna "Estado" (ver S6) |
| — | **D-1** ScoreRing con confianza | **requiere-revisor-técnico** | Decisión de Diego (SPEC-R2a en `../03-spec-fase-2.md`) |
| — | **M1** Shell móvil | con cuidado (necesita spec propia) | — |

**Sin M1, nada de esto se ve bien en móvil:** el contenido recibe 134 px (Q9). S1–S7 dejan el contenido listo para 390 px, pero el shell es un trabajo aparte.

## Qué NO cambia en ningún PR

- **Lógica de scoring:** no se tocan `lib/score-decay.ts` (`applyScoreDecay`, `computeDecayFactor`) ni `lib/label-utils.ts` (`resolveDisplayLabel`, `isScalable`). Se consumen igual que hoy, con los mismos argumentos.
- **Redux:** ningún slice. `useCurrency` se sigue usando tal cual.
- **Servicios de API y tipos:** `dashboardApi`, los endpoints de RTK Query, `app/(dashboard)/types`, `lib/types.ts`. No hay endpoints ni campos nuevos.
- **`ScoreRing` y `PerformanceBadge`:** se usan sin modificarlos. D-1 y D-2 van aparte.
- **Las 3 regresiones vivas:**
  - `tracker/[candidateId]/page.tsx:625`: el elemento "Pico" se deja literal, con su contenido y sus clases;
  - `hero-signal-card.tsx:87–89`;
  - `consecutiveTop10Days()`.
- **Control por plan:** `lib/view-as.tsx` no se toca y todas las condiciones de hoy se mantienen (`canViewAds`, `allowMetaLink`, `maxPoolPage`, `fromTracker || isPro || isScoutStore`). G-1…G-5 son decisiones de negocio pendientes.
- **Dependencias:** ninguna nueva. `Sheet`, `Collapsible`, `Tooltip` y `Segmented` ya están en `components/ui/`, y las container queries son nativas en Tailwind v4.

---

## S7 · Fechas cortas y seguras (P10)

**Riesgo:** con cuidado. Cambia fechas visibles en 4 componentes.

### Archivos

- [ ] **Nuevo `lib/format-date.ts`** con `formatShortDate(iso: string | null | undefined): string`.
  - Si el string es `YYYY-MM-DD`, se arma como **fecha local**: `new Date(y, m - 1, d)`, no como UTC.
  - Cualquier otro formato válido pasa por `new Date(iso)`.
  - Si es null o inválido, devuelve "—".
  - Formato de salida: "19 sept", con el año solo si no es el actual ("19 sept 2025").
- [ ] Se usa en:
  - `components/tracker/product-ads.tsx`: reemplaza `formatDate`, `:679`;
  - `app/(dashboard)/tracker/[candidateId]/page.tsx`: reemplaza `formatDate`, `:314`;
  - `rank-chart.tsx:17` y `score-chart.tsx:21` (eje X);
  - `pool-detail-panel.tsx`.

### Qué no cambia

Las fechas del resto de la app (Resumen, Tiendas…). Pueden tener el mismo bug de UTC, pero quedan para otra tarea.

### Verificación

1. Correr `TZ=America/Bogota node -e "…formatShortDate('2026-09-19')…"`:
   - `'2026-09-19'` → "19 sept";
   - `null` → "—";
   - un timestamp con hora → el día local correcto.
2. Playwright con `timezoneId: 'America/Bogota'`: "Primera vez visto" coincide con `firstSeenDate` de la API.
3. **Antes de mergear, confirmar con Diego si la API manda `LocalDate` (`YYYY-MM-DD`) o timestamps.** Si manda timestamps, P10 no aplica y solo queda el formato corto.

### Reversión

Revertir el commit.

---

## S4 · Gráficos con tokens y en español (P9)

**Riesgo:** con cuidado. Lo usan solo la página y el panel.

### Archivos

- [ ] **`components/tracker/rank-chart.tsx`:**
  - colores con `var(--primary)` (línea y área) y `var(--border)` (grilla);
  - ejes en `var(--subtle-foreground)` a 12 px (hoy #808080, 3,95:1);
  - id del degradado con `useId()` (hoy es fijo, `rankGradient`);
  - puntos de entrada y de mejor posición;
  - fechas con `formatShortDate`;
  - tooltip en español con `text-success-foreground`.
- [ ] **`components/tracker/score-chart.tsx`:**
  - barras de **un solo color** (`var(--chart-1)`), sin la escala rojo/ámbar/verde (`:10–13`), porque el color del score lo pone el anillo (D-1);
  - "Growth:" → "Crecimiento:";
  - ejes igual que el gráfico de rank.
- [ ] En los dos, un prop `height` (default 256, igual que hoy): 140 en el panel y 224 en la página.

### Qué no cambia

- Los datos (`history`).
- El eje Y invertido del rank.
- Recharts 2.15.
- La información de los tooltips (solo cambia el idioma).

### Verificación

1. `grep -n "en-US\|Growth\|oklch(" components/tracker/rank-chart.tsx components/tracker/score-chart.tsx` → 0 resultados.
2. Con un mock de score bajo en el día 1, no aparece ninguna barra roja.
3. Correr los dos verificadores de contraste.

### Reversión

Revertir el commit.

---

## S3 · Tarjeta de anuncio v2 y sección de anuncios (P1–P3, Q6)

**Riesgo:** con cuidado.

- `AdSlide` también lo usa **`/ads-library`** (`app/(dashboard)/ads-library/page.tsx:184`).
- `AdvertiserBadge` lo usan las tablas del pool y de Mis testeos.

### Archivos

Todo en `components/tracker/product-ads.tsx`:

- [ ] **`AdSlide` (`:147–284`):**
  - `@container` en la tarjeta. Por debajo de 160 px, los metadatos van en columna y se oculta el copy.
  - Chips de 12 px con `bg-sidebar/80 text-sidebar-foreground`; ≥ 30 días con `bg-success-foreground text-white`.
  - Se saca el overlay "FACEBOOK" y el anunciante pasa a texto debajo.
  - Metadatos con `flex-wrap`, **sin `shrink-0`**.
  - "Ver en Meta" como link de texto (`text-primary-text`). Sin `allowMetaLink`: `Lock` + "Meta · Pro" en `text-subtle-foreground` con `Tooltip` "Disponible en Pro".
  - Misma firma de props que hoy.
- [ ] **Fallback de picsum** (`:198` y `:526`): se reemplaza por un placeholder neutro (`bg-secondary` + ícono de video). Una foto de stock al azar no puede pasar por el creativo.
- [ ] **`ProductAdsSection` (`:318–495`):**
  - Grilla `grid-cols-[repeat(auto-fill,minmax(var(--ad-min),1fr))]`, con prop `density: 'compact' | 'comfortable'` (104 / 152 px; 96 px en la página en móvil).
  - Cabecera en dos líneas: título + conteos + orden / chips + "actualizado".
  - Prop `embedded`, sin borde ni padding propio, para el panel.
  - Estado vacío ("No detectamos anuncios de este producto…") en lugar de `return null`.
  - Copy del bloqueo: "Anuncios bloqueados en la prueba gratis" / "…Se ven desde el plan Básico" + `Ver planes` (`outline`, `/pricing`). Hoy dice "plan Starter" y "Upgrade →".
- [ ] **`AdvertiserBadge` (`:610`):** prop opcional `variant?: 'facebook' | 'neutral'`.
  - El default `'facebook'` deja las tablas **idénticas**.
  - `'neutral'` es el chip de la cabecera de la sección.
  - El gating (`allowMetaLink`, blur y link) es el mismo en las dos variantes.

### Qué no cambia

- `isTestAd`.
- El orden: primero los activos, luego el `select`, con la misma lógica de `sortFn`.
- El dedupe por miniatura, `INITIAL = 6` y "Ver N anuncios más".
- `canViewAds` y `allowMetaLink`.
- `FloatingVideoPanel` y el hover.
- `useGetProductAdsQuery`.
- `StoreVideosGrid`, `AdStripPreview`, `mockAds` y `devPlan`.
- El anunciante sigue visible en las tarjetas para Básico (**G-3 pendiente**).

### Verificación

1. **Sin desbordes:** Playwright en el panel (1440) y en la página (1024, 1280, 1440, 390). Ningún texto de `.ad` se sale de su tarjeta (rect de cada hijo dentro del rect de la tarjeta) y nada mide menos de 12 px dentro de la sección.
2. **Los 5 planes, con ViewAs:**
   - Prueba gratis: blur + candado con el copy nuevo.
   - Básico: chips borrosos y "Meta · Pro" sin link.
   - Pro, Agency y Real: el link a Meta abre `ad_snapshot_url` con `target=_blank rel=noopener`.
3. **`/ads-library`** en 1440 y 390: la grilla de 6/4/3/2 columnas se ve bien.
4. **Tablas del pool y de Mis testeos:** captura igual a `main` (el `AdvertiserBadge` default no cambia).
5. `node docs/redesign/detalle-producto/tools/contrast-check-detalle.mjs` → 37/37.

### Reversión

Revertir el commit. La sección vuelve a `grid-cols-6`.

---

## S1 · Shell: que `sticky` funcione (P6)

**Riesgo:** con cuidado. Es una línea, pero está en el layout de todas las páginas del dashboard.

### Archivos

- [ ] `app/(dashboard)/layout.tsx:46`: `overflow-y-auto overflow-x-hidden` → `overflow-x-clip`.
  - `clip` recorta igual que `hidden` pero **no crea un contenedor de scroll**. Así el `sticky` de los hijos se ata al viewport, que es el que scrollea de verdad.
  - Soporte: Chrome 90, Safari 16, Firefox 81.

### Qué no cambia

- El recorte horizontal.
- `scrollRef` y `layout.tsx:31`, que ya hoy no hacen nada porque el div no scrollea. Limpiarlos es otra tarea.

### Alternativa si Diego prefiere no tocar el shell

Dejar el panel en `position: fixed` (derecha, `top-20`, `bottom-4`) con una columna espaciadora de 440 px en la grilla. Es solo para el pool, pero es más frágil.

### Verificación

1. En `/pool`, con el panel abierto, bajar 700 px: el borde superior del panel queda en 80 px y el ✕ sigue visible (hoy sube a −561, medido).
2. Todas las páginas del dashboard en 1440 y 390: `scrollWidth` igual que antes del cambio (comparar la lista).
3. El topbar sigue sticky.

### Reversión

Revertir la línea.

---

## S2 · Pool: split desde `xl`, cabecera igual a las filas, `Sheet` por debajo (P4, P5, P7)

**Riesgo:** con cuidado. `pool-winners.tsx` es el componente principal del pool y la tabla completa tiene que quedar idéntica.

### Archivos

- [ ] **`components/tracker/pool-winners.tsx`:**
  - Constantes `COLS_FULL` y `COLS_COMPACT`, usadas **tanto** en la cabecera (`:635`) **como** en las filas (`:956–959`).
  - En modo compacto, la cabecera oculta Tendencia, Contexto, Ads y Acción, y dice "Crecim.".
  - En modo compacto, la celda de crecimiento muestra solo el %. El "superó al…" se parte en 4 líneas en 64 px.
  - `isCompact` pasa a ser `selectedCandidateId != null && isSplit`.
- [ ] **`app/(dashboard)/pool/page.tsx:175`:**
  - `lg:grid-cols-[minmax(0,1fr)_400px]` → `xl:grid-cols-[minmax(0,1fr)_440px]`.
  - Por debajo de `xl`, el mismo `PoolDetailPanel` se renderiza dentro de un `Sheet` (`side="right"`, `w-full sm:max-w-[440px]`), abierto con `selectedWinner`.
- [ ] **Nuevo `hooks/use-media-query.ts`** para saber si hay split (`min-width: 1280px`). `hooks/use-mobile.ts` tiene el 768 fijo y no se toca.
- [ ] **`components/tracker/pool-detail-panel.tsx:50`:** `sticky top-4 max-h-[calc(100vh-2rem)]` → `sticky top-20 max-h-[calc(100vh-6rem)]`, porque tiene que quedar debajo del topbar de 64 px. Dentro del `Sheet`, sin sticky y a todo el alto.

### Qué no cambia

- Los datos, el orden, los filtros, la paginación y `maxPoolPage`.
- La tabla completa (sin panel).
- Cmd/ctrl + clic abre en otra pestaña (CHANGE-110).
- `AdsCell` sin blur para todos (CHANGE-082).

### Verificación

1. **1280, 1366, 1440 y 1600 con el panel abierto:**
   - `gridTemplateColumns` de la cabecera = el de la fila;
   - la pista "Producto" mide ≥ 180 px;
   - la cabecera no se desborda (`scrollWidth ≤ clientWidth`).
2. **1024 y 1100:** el clic en una fila abre el `Sheet` dentro de la pantalla. Esc lo cierra y el foco vuelve a la fila.
3. **1440 con el panel cerrado:** captura igual a `main`.
4. Cmd/ctrl + clic sigue abriendo en otra pestaña.

### Reversión

Revertir el commit (3 archivos + el hook).

---

## S5 · Panel del pool, composición A

**Riesgo:** solo. El componente se usa solo en `/pool` y consume las piezas compartidas sin modificarlas.

### Archivos

- [ ] **`components/tracker/pool-detail-panel.tsx`:**
  - **Cabecera:** `sticky top-0` dentro del panel.
    - Imagen por el mismo proxy que la tabla: `/api/image-proxy?url=`, como `HoverImagePreview proxy`.
    - Título en 2 líneas y "dominio · precio" con `FormattedPrice`.
    - Botón `Maximize2` que lleva a la página completa (con `Tooltip`) y `X` con `hover:bg-accent` (hoy rojo).
  - **Veredicto:**
    - `ScoreRing size="md" confidence={summary?.signalConfidence}` (como hoy);
    - `PerformanceBadge` con `resolveDisplayLabel(...)`, **la misma llamada que `page.tsx:403`**;
    - "Día N de 30";
    - confianza con número y barra: ámbar por debajo de 0,5 (`LOW_CONFIDENCE = 0.5`, comentado como "mismo umbral que `isScalable`, `lib/label-utils.ts:60`"). Se duplica la constante para no tocar un archivo de scoring;
    - la frase narrativa con `buildNarrative()` sin `totalProducts`.
  - **Tres métricas:**
    - Rank actual + "entró en #N";
    - Mejor rank + "día N" (el día con el menor `bestsellerRank` de `history`);
    - Crecimiento: verde solo si es > 0; `null` → "—".
  - **Orden de las secciones:**
    1. veredicto;
    2. `<ProductAdsSection embedded density="compact">`;
    3. trayectoria: `Segmented` Rank/Score + un gráfico de 140 px. El estado vive en el panel, que no se desmonta al cambiar de producto, así que se recuerda;
    4. `ProductDescriptionModal variant="row"`;
    5. "Abrir página completa" (`outline`).
  - Sale el stat "Score" duplicado y los tonos `good`/`accent`.
- [ ] **Nuevo `lib/candidate-narrative.ts`:** `buildNarrative({ entryRank, currentRank, growthPct, daysElapsed, totalProducts? })`. Es **el mismo texto** que arma hoy `page.tsx:634–657`, solo movido para compartirlo con S6.
- [ ] **`components/tracker/product-description.tsx`:** prop `variant?: 'card' | 'row'`. El default `'card'` es el de hoy. Lo usan solo la página y el panel.

### Qué no cambia

- `useGetCandidateDetailQuery`.
- **El score que se muestra:** el crudo, `summary.performanceScore`, sin decay (**S-1 pendiente**).
- El destino de "página completa": `?storeId=…&from=pool`.
- El gating de los anuncios.

### Verificación

1. **1440 × 900:** el primer creativo entra en la pantalla sin scroll. En el preview queda a 444 px del borde del panel; hoy está a 1144 px.
2. Con el panel scrolleado, la cabecera y el ✕ siguen visibles.
3. Un mock con un día `Declining` no muestra "En baja" en ningún lado.
4. Un mock con `summary: null` muestra "—" en todos los números, no "+0%" ni "0%".
5. Prueba gratis ve el bloqueo de anuncios (G-1 sigue como hoy).

### Reversión

Revertir el commit.

---

## S6 · Página de detalle, composición A

**Riesgo:** con cuidado. Es el archivo más grande y tiene muchos estados: carga, error, sin `storeId`, `summary` null, desde el pool o desde el tracker, y cada plan.

### Archivos

Todo en `app/(dashboard)/tracker/[candidateId]/page.tsx`:

- [ ] **Migas y cabecera de la página:**
  - En el estado con datos (`:413`), `PageLayout` sin `title` ni `description`: queda **un solo h1**, el del producto. En carga y error se deja como está.
  - Migas: "← Explorar testeos" (`/pool`) si `from === 'pool'`; si no, "← Mis testeos" (`/tracker`).
  - A la derecha, `ShareButton` y "Ver producto" con **la misma condición de `:517`**.
- [ ] **Hero:**
  - Grilla `lg:grid-cols-[minmax(240px,340px)_minmax(0,1fr)]`, sin `from-primary/10` (`:425`).
  - `ProductGallery` (local, `:70–256`): imagen 1:1 con miniaturas en fila debajo. El lightbox y el teclado quedan igual.
- [ ] **Información del producto:**
  - Línea de tienda + "visto por primera vez el {formatShortDate}".
  - h1 `font-display` 26/32.
  - Precio en 18 px con `FormattedPrice`.
  - `PerformanceBadge label={currentLabel}` (misma variable).
  - "Día N de 30" (el texto no cambia).
- [ ] **Veredicto:**
  - `ScoreRing size="lg" score={adjustedScore}`. **Sin `confidence`: eso es D-1, va aparte.**
  - Bloque de confianza.
  - `buildNarrative(…, totalProducts)`: el texto de `:634–657`, movido y no reescrito.
  - Spikear / Spikeando como `Button variant="brand"` / `variant="outline"`, con los **mismos handlers y la misma condición `isScalable`**.
  - Nota de decay en 12 px con `text-subtle-foreground`, mismo contenido y coma decimal ("×0,87").
- [ ] **Métricas:** 3 celdas neutras.
  - El crecimiento pasa a chequear `summary.growthPct == null ? '—' : …`. Corrige el "+0 %" verde con null en `:560` y `:697`.
  - "Superó al X %" sin los 4 colores de Tailwind.
- [ ] **Resto de la página:**
  - `ProductDescriptionModal variant="row"` al pie del hero.
  - Contenedor con `space-y-6`.
  - `ProductAdsSection density="comfortable"`.
  - Gráficos con `height={224}`.
  - **Las líneas `:621–626` (el bloque "Pico") no se tocan.**
- [ ] **Historial:**
  - Dentro de `Collapsible`, cerrado por defecto.
  - Columnas: Día · Fecha · Rank · **Cambio** (delta de `bestsellerRank` contra el día anterior) · Crecimiento · Score.
  - **La columna "Estado" sale solo con el OK de Diego**, porque roza D-2: [ ] aprobado. Si Diego prefiere esperar a D-2, la columna queda como hoy. Si sale, `computeSmartLabel` (`:37–66`) queda sin uso y se borra. Con D-2a, la columna vuelve con el campo nuevo del backend, no con esa función.
  - Se borra el párrafo narrativo de abajo (`:634–657`), que pasó al veredicto.

### Qué no cambia

- `useGetCandidateDetailQuery`, `useGetStoresQuery` y `/api/product-images`.
- `applyScoreDecay` y `computeDecayFactor`: mismos argumentos, mismo `adjustedScore`.
- La llamada a `resolveDisplayLabel`, `isScalable`, `spike`/`unspike` y su almacenamiento.
- `buildProductUrl` y la condición de "Ver producto".
- `ShareButton`.
- `page.tsx:625`.
- El significado de `?from`.

### Verificación

1. **Mismos valores:** texto renderizado con 3 mocks (normal, `summary: null` y desde el pool). Score, ranks, crecimiento, confianza y frase son idénticos antes y después, salvo el null, que pasa de "+0%" a "—" (con un script que compare los valores).
2. **R-1 intacta:** `git diff main -- 'app/(dashboard)/tracker/[candidateId]/page.tsx' | grep peakGrowthPct` → sin cambios en esa expresión.
3. `document.querySelectorAll('h1').length === 1`.
4. **Los 5 planes con ViewAs:** desde el pool con Básico no aparece "Ver producto"; desde Mis testeos sí. Todo igual que hoy.
5. **1440 y 1920:** el hero es una grilla, así que no hay hueco entre el título y el veredicto. Hoy mide 24–550 px.
6. **390:** sin scroll horizontal dentro del contenido.
7. Con un día `Declining` en el mock, "En baja" no aparece en el DOM.

### Reversión

Revertir el commit.

---

## D-1 · ScoreRing con confianza (ítem separado)

**Riesgo:** requiere-revisor-técnico. **No es parte de este rediseño.**

- **Qué es:** SPEC-R2a completa en `../03-spec-fase-2.md`. Para estas vistas, solo `page.tsx:485` suma `confidence={summary?.signalConfidence}`. El panel ya lo pasa.
- **Por qué requiere revisor:** cambia lo que el usuario lee de la señal principal en toda la app. Un producto con 72 de score y 20 % de confianza pasa de verde a casi todo ámbar.
- **Cómo verificarlo y revertirlo:** está en SPEC-R2a. El rediseño funciona igual con o sin D-1.

## M1 · Shell móvil (necesita spec propia)

**Riesgo:** con cuidado. Toca todas las páginas del dashboard.

- **Qué haría:**
  - `app/(dashboard)/layout.tsx:43–44`: la sidebar se oculta por debajo de `md` y `main` pasa a `md:pl-64`;
  - `AppHeader` suma una hamburguesa que abre la navegación de `AppSidebar` en un `Sheet` (`side="left"`).
- **Verificación:** todas las páginas del dashboard a 390 px sin scroll horizontal.
- **Reversión:** revertir el commit.

---

## Verificación común a todos los PR

1. `npx tsc --noEmit`: la línea base de `main` tiene **9 errores previos** (1 en `lib/jobs/sync-ads.ts` y 8 en `lib/mock-data.ts`). Tiene que seguir en 9.
2. `pnpm build`.
3. **Playwright con la API simulada**, como en el diagnóstico:
   - 1440, 1024 y 390 × los 5 planes de ViewAs;
   - sin errores en consola;
   - sin scroll horizontal en la página.
4. `node docs/redesign/tools/contrast-check.mjs` y `node docs/redesign/detalle-producto/tools/contrast-check-detalle.mjs`.
5. Una entrada en `docs/CHANGES.md` por PR.

## Riesgos que quedan abiertos

- **El gating es solo del frontend** (G-4): el payload trae `productUrl` y `storeBaseUrl` para todos los planes. Este rediseño no lo empeora ni lo arregla.
- **S7 corre las fechas un día** para usuarios de Latinoamérica si la API manda `LocalDate`. Es lo buscado, pero se puede notar ("ayer decía 18"), así que conviene coordinarlo con Diego.
- **S-1:** el panel muestra el score crudo y la página el ajustado por decay. El rediseño hace más visible la diferencia porque ahora las dos vistas tienen un veredicto. Diego tiene que decidir cuál es el canónico.
