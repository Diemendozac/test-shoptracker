# 03 · Spec: Biblioteca de anuncios

Implementa [`02-propuesta.md`](./02-propuesta.md). Todavía no se implementa nada, salvo F0.

**Niveles de riesgo** (los mismos de `../detalle-producto/03-spec.md`):

- **solo:** un componente que usa una sola vista y se revierte solo.
- **con cuidado:** toca piezas compartidas o varias vistas, así que hay que revisar a mano cada lugar donde aparece.
- **requiere-revisor-técnico:** cambia lo que el usuario interpreta de los datos, o necesita una decisión de Diego antes de mergear.

## Orden y dependencias

Cada fila es un PR independiente, con su entrada en `docs/CHANGES.md` (regla de CLAUDE.md) y reversible por sí solo. Los PR van contra `Diemendozac/test-shoptracker` (`main`), y nadie mergea su propio PR.

| # | Spec | Riesgo | Depende de |
|---|---|---|---|
| 0 | **F0** Hotfix de la tarjeta (hecho, CHANGE-120) | con cuidado | — |
| 1 | **L1** Pantalla nueva, sin backend | con cuidado | F0 |
| 1b | **L1b** "No visto" también en el detalle y el pool | **requiere-revisor-técnico** | L1 y el OK de Daniel |
| 2 | **D1** Una revisión incompleta no marca terminados | **requiere-revisor-técnico** | Backend acepta `complete` (se despliega primero) |
| 3 | **D3** Link y miniatura del mismo anuncio | **requiere-revisor-técnico** | Resultado de las consultas de A2 |
| 4 | **D2** Tres estados | **requiere-revisor-técnico** | D1 y backend |
| 5 | **D4** Copy del anuncio | con cuidado | Backend guarda `body_text` |
| 6 | **L2** API de la Biblioteca: búsqueda, orden, agrupado, link | con cuidado | Backend; el agrupado depende de D3 |
| — | **D5** Cobertura | prueba de 1 día y decisión de negocio | — |

**L1 y D1 pueden ir en paralelo:** uno es solo frontend y el otro solo job + backend. Juntos resuelven lo que más se nota: la primera pantalla gris y los activos marcados como terminados.

## Qué NO cambia en ningún PR

- **Scoring y labels:** no se tocan `lib/score-decay.ts` ni `lib/label-utils.ts`. La Biblioteca no muestra score.
- **Redux:** ningún slice nuevo. Todo el estado de filtros es local (`useState`) y los datos van por RTK Query (regla 1 de CLAUDE.md).
- **Control por plan:** `lib/view-as.tsx` no se toca. La Biblioteca sigue siendo solo Pro/Agency; L1 solo suma que el bloqueo respete la barra "Vista".
- **Las 3 regresiones vivas de CLAUDE.md:** no se tocan.
- **Dependencias:** ninguna nueva. `Dialog`, `Popover`, `Checkbox`, `Select`, `Segmented`, `Tooltip`, `Collapsible` y `Skeleton` ya están en `components/ui/`, e `infiniteQuery` viene en `@reduxjs/toolkit` 2.11 (instalado).
- **Server vs Client (regla 4):** `/ads-library` sigue siendo Client Component. Usa hooks de RTK Query, filtros interactivos y el token del navegador, igual que el resto del dashboard.

---

## F0 · Hotfix de la tarjeta (hecho)

- **Rama:** `redesign/fix-tarjeta-terminado`, commit `7ce418f`, CHANGE-120. Falta abrir su PR en `test-shoptracker`.
- **Qué cambia:**
  - la tarjeta de un anuncio inactivo pasa de "Terminado · desde 15 ene", que se leía como "terminó el 15 ene", a "15 ene – 27 sept", con tooltip;
  - el contador de la Biblioteca pasa de "25568" a "25.568".
- **Por qué va igual aunque venga L1:** arregla la tarjeta del detalle y del pool, que L1 no toca.

---

## L1 · Pantalla nueva, sin backend

**Riesgo:** con cuidado. Una sola pantalla, pero cambia las palabras de estado que ve el usuario en ella.

### Archivos

- [ ] **Nuevo `lib/ad-status.ts`:** `describeAdStatus(ad: Pick<Ad, 'status' | 'first_seen' | 'last_seen'>, today = new Date())` devuelve `{ tone: 'ok' | 'warn' | 'muted', label, detail, tooltip? }`.
  - Reglas en L1:

    | Caso | label | detail | tone |
    |---|---|---|---|
    | `active` con `last_seen` ≤ 2 días | Activo | "desde {first_seen}" | ok |
    | `active` con `last_seen` > 2 días | Activo | "visto hace N d" (tooltip: "Su tienda no se revisó desde el {last_seen}") | ok + detalle warn |
    | `inactive` | No visto | "desde el {last_seen}" (tooltip: "No apareció en la última revisión: puede haber terminado o no haberse revisado") | warn |

  - **Fechas:** con `parseApiDate` y `formatShortDate` de `lib/format-date.ts`. Los días se cuentan entre fechas locales, sin UTC.
  - **Null safety:** sin `last_seen`, no hay "visto hace". Sin `first_seen`, no hay "desde". Nunca "NaN" ni "Invalid Date".
  - Queda preparado para D2 (`unverified`, `ended`) sin cambiar la firma.
- [ ] **Nuevo `components/ads-library/library-ad-card.tsx`** (client):
  - creativo 4:5 con chip de días (verde desde 30 d, como S3) y ▶;
  - estado (`describeAdStatus`), anunciante y país;
  - copy en 3 líneas **solo si hay `body_text`** (hoy nunca viene, así que no se ve hasta D4);
  - bloque de producto con `productImage` (ícono si es null) y `productTitle` en 2 líneas; en L1 no es link;
  - "Ver en Meta", o "Meta · Pro" bloqueado si no `allowMetaLink`, igual que S3.
  - **Sin gris** para `inactive`.
  - Hover en escritorio (`(hover: hover) and (pointer: fine)`): `<video muted loop playsInline preload="none">` con `video_url_r2` dentro del mismo creativo.
  - Clic o Enter en el creativo: `onOpen(ad)`.
- [ ] **Nuevo `components/ads-library/ad-video-dialog.tsx`:** `Dialog` con:
  - `<video controls autoPlay playsInline>`, o miniatura + "Ver en Meta" si no hay `video_url_r2`;
  - estado, anunciante, chips de días y país, copy completo si hay, producto con nicho, "Ver en Meta".
  - Al cerrar, el foco vuelve a la tarjeta que lo abrió (mismo patrón que el `Sheet` de S2).
- [ ] **Nuevo `components/ads-library/library-toolbar.tsx`:**
  - `Segmented` de Estado ("Activos · No vistos · Todos") y Duración ("Todas · 7+ d · 30+ d · 90+ d");
  - Categoría en `Popover` + `Checkbox` con las 13 de `NICHES`, contador en el botón y chips con × debajo;
  - País en `Select`;
  - "Limpiar filtros".
  - Por debajo de `md`: no es `sticky`, y Duración, Categoría y País van dentro de un `Collapsible` con botón "Filtros (n)".
- [ ] **`app/(dashboard)/ads-library/page.tsx`:**
  - `status` arranca en `'active'`.
  - Manda `country` cuando se elige.
  - **Encabezado** "25.568 anuncios · 6.214 activos": dos `useGetAdsLibraryQuery({ size: 1 })`, uno sin `status` y otro con `status: 'active'`, de los que se lee `total`.
  - **Línea de resultados** con el `total` del filtro actual.
  - **"Cargar 24 más"** con el endpoint infinito de abajo y "Mostrando N de M".
  - `diversifyByAdvertiser` se aplica **por página**, para que cargar más no reordene lo que ya se ve.
  - **Bloqueo** cuando `data && (!data.isPro || !allowMetaLink)`:
    - esqueletos (`Skeleton`) y tarjeta con el valor de la Biblioteca + "Ver planes" (`/pricing`);
    - **no se renderiza ningún dato de anuncios en el DOM**;
    - la cifra del bloqueo sale de `data.total` si viene, y si no se omite.
  - Deja de usar `FloatingVideoPanel` y `useHoverPanel` **en esta página**: siguen exportados y en uso en el detalle y el pool.
- [ ] **`app/(dashboard)/services/dashboardApi.ts`:** nuevo `getAdsLibraryPages` con `build.infiniteQuery`:
  - `initialPageParam: 0`;
  - `getNextPageParam: last => last.page + 1 < last.totalPages ? last.page + 1 : undefined`;
  - mismos parámetros y `providesTags: ['Ads']` que `getAdsLibrary`.

  `getAdsLibrary` queda igual y se usa para las cifras del encabezado.
- [ ] **`docs/CHANGES.md`:** entrada nueva.

### Qué no cambia

- `AdSlide`, `ProductAdsSection`, `FloatingVideoPanel` y `useHoverPanel`: la tarjeta del detalle y del pool queda como en F0.
- `AdLibraryItem` y `AdsLibraryResponse`: no hay campos nuevos.
- Backend, job y scraper.

### Verificación

1. `pnpm exec tsc --noEmit`: solo los 9 errores de siempre (1 en `lib/jobs/sync-ads.ts` y 8 en `lib/mock-data.ts`).
2. Con la API simulada (el harness de fase 2, `NEXT_PUBLIC_API_URL=http://mock.local/api`):
   - el primer pedido lleva `status=active`;
   - `inactive` muestra "No visto · desde el …", en ámbar y sin gris;
   - `active` con `last_seen` de hace 9 días muestra "visto hace 9 d";
   - `body_text`, `productImage`, `country`, `advertiser_name` y `video_url_r2` en `null` no rompen nada ni muestran "null";
   - "Cargar más" agrega abajo y no mueve el scroll; sin `hasNextPage` el botón desaparece;
   - elegir país manda `country`;
   - modal: abre con clic y con Enter, cierra con Esc, el foco vuelve a la tarjeta y el `src` es `video_url_r2`;
   - `isPro: false` y "Vista: Básico" muestran el bloqueo **y el DOM no tiene ningún `ad_snapshot_url` ni miniatura**;
   - en 390 px: sin scroll horizontal, filtros plegados y la primera tarjeta visible en la primera pantalla;
   - ningún texto por debajo de 12 px.
3. **Contraste AA** del texto ámbar (`--warning-foreground`) sobre `--card`, con el mismo método de `../detalle-producto/tools/contrast-check-detalle.mjs`.
4. **Checklist de `react-agents-review`** en el resumen del PR (regla 2 de CLAUDE.md).

### Reversión

Revertir el commit. No hay datos ni contratos nuevos.

---

## L1b · "No visto" también en el detalle y el pool

**Riesgo:** requiere-revisor-técnico. Cambia lo que el usuario interpreta en dos vistas más. **Necesita el OK de Daniel.**

- `components/tracker/product-ads.tsx`:
  - `AdSlide` usa `describeAdStatus` y deja de poner `grayscale` a los `inactive`;
  - el contador de `ProductAdsSection` (`:405`) pasa de "N terminados" a "N no vistos".
- **Por qué:** si no, el mismo anuncio dice "No visto" en la Biblioteca y "Terminado" en el detalle.
- **Verificación:** la misma lista de L1, en `/tracker/[candidateId]` y en el panel de `/pool`.
- **Reversión:** revertir el commit.

---

## D1 · Una revisión incompleta no marca terminados

**Riesgo:** requiere-revisor-técnico. Cambia qué se escribe en la base.

### Contrato con el backend

- `POST /internal/webhook/ads` suma `complete: boolean`.
- **Con `complete: false`:** el backend guarda y actualiza los anuncios que vinieron (`active`, `last_seen` = hoy) y **no marca inactivo ningún anuncio ausente**.
- **Sin el campo:** vale `true`, que es el comportamiento de hoy.

**Orden de despliegue:** primero el backend, que acepta el campo y no cambia nada; después el job.

### Archivos (este repo)

- [ ] `lib/scrapers/meta-ads.ts`, en `scrapeAdsForStore`: devuelve `complete`.
  - `complete = probe.totalAdsOnMeta > 0 && ads.length >= probe.totalAdsOnMeta`: se leyeron tantos como dice Meta.
  - Cualquier corte (tope de 50/100, scroll estancado, timeout) da `false`.
- [ ] `lib/jobs/sync-ads.ts`:
  - `pushAds(candidateId, domain, ads, complete)` manda el campo;
  - el log por tienda dice "revisión incompleta: 50 de 150";
  - `sync-results.json` y `reportScraperRun` suman `stores_complete` y `stores_incomplete`, que alimentan `lastSync` en L2.
- [ ] **Caso 0 anuncios** (`sync-ads.ts:306`): hoy no se reconcilia nada.
  - Solo cuenta como revisión completa si Meta mostró explícitamente "0 resultados".
  - Si la página no cargó o no hubo selector, es incompleta y no se toca nada.
- [ ] **Backend (Diego):**
  - respetar `complete`;
  - guardar por tienda la fecha de cada revisión completa (lo necesitan D2 y `lastSync`).

### Qué no cambia

El scraping en sí (tope, pasadas, tiempos), R2, el matcheo por handle y el orden de las tiendas.

### Verificación

1. Smoke test del job contra el backend falso de CHANGE-111:
   - una tienda con 50 leídos de 150 manda `complete: false` en todos sus `pushAds`;
   - una con 12 de 12 manda `complete: true`.
2. **Backend:** un anuncio visto ayer que hoy falta en una revisión incompleta sigue `active` con `last_seen` = ayer.
3. **Después de desplegar (Diego):** comparar cuántos anuncios pasan de `active` a `inactive` por noche, antes y después. Tiene que bajar fuerte.

### Reversión

Revertir el job: el backend vuelve a asumir `complete: true`. El cambio del backend se revierte aparte.

---

## D3 · Link y miniatura del mismo anuncio

**Riesgo:** requiere-revisor-técnico. Cambia qué anuncios se guardan y con qué archivo.

**Antes de empezar:** las 3 consultas de A2 dicen cuál de las causas pesa. Si todas dan 0, se prioriza la causa 1 con `lib/scrapers/test-scraper.ts`.

**Actualización 2026-09-29 — consultas corridas contra producción:** ver [`04-hallazgos-a2.md`](./04-hallazgos-a2.md). Causas 2 y 3 descartadas (0 y 1 caso sobre 25.652 anuncios); causa 1 confirmada como dominante (42,5% de los anuncios comparten miniatura con un link distinto). **Empezar por el armado de tarjeta** (`:342–352` y su copia en el probe, `:220–231`); el trabajo sobre el link (`:361`, `:365–368`) y `extractAdId` (`:169–173`) queda de baja prioridad hasta ver si la causa 1 sola explica el 42,5%.

### Archivos

- [ ] `lib/scrapers/meta-ads.ts`:
  - **`:361`, link:** se acepta solo si `new URL(href).searchParams.get('id')` son dígitos **y** no existe `view_all_page_id`.
  - **`:365–368`, respaldo por texto:** solo el número que sigue a "Identificador de la biblioteca", "Library ID" o "Ad ID". Se elimina `\b(\d{15,16})\b`.
  - **`:342–352`, armado de la tarjeta:**
    - se mira primero el propio `_7jyh` y después sus padres;
    - el contenedor es el primero que tiene **exactamente un** ID de biblioteca;
    - si tiene 2 o más, la tarjeta se descarta y se loguea cuántas.
    - **El mismo armado está copiado en el probe (`:220–231`)** y hay que arreglar los dos. Dentro de `page.evaluate` no se puede importar una función, así que o se duplica con un comentario que ate las dos copias, o se inyecta con `page.addInitScript`.
  - **`:169–173`, `extractAdId`:** sin respaldo base64. Sin ID numérico, el anuncio no se guarda ni se sube a R2.
- [ ] `lib/storage/r2.ts:65–72` y el espejo (`meta-ads.ts:650–672`): el archivo se nombra con `sha256` de los bytes descargados (`ads/{type}s/{hash}.{ext}`), y se manda `creativeHash` en `pushAds`.
  - **Validar antes con 20 pares de duplicados conocidos que los bytes coinciden.**
  - Si Meta recodifica y no coinciden, `creativeHash` pasa a ser un hash perceptual de la miniatura (dHash de 64 bits) y el archivo se sigue nombrando por ID de anuncio, que después de la regla anterior ya no se repite.
- [ ] **Backend:** columna `creative_hash`.

### Verificación

1. `test-scraper.ts` contra 3 tiendas afectadas: 5 anuncios por tienda, miniatura contra la página de Meta, a mano.
2. Las consultas (a), (b) y (c) de A2 dan 0 en las filas nuevas.
3. **Log:** cuántas tarjetas se descartaron por tener 2 o más IDs. Si son muchas, el selector necesita otro arreglo.

### Reversión

Revertir el commit. Los archivos viejos de R2 siguen sirviendo y los nuevos conviven.

---

## D2 · Tres estados

**Riesgo:** requiere-revisor-técnico.

### Regla propuesta (Diego decide cómo guardarla)

| Estado | Condición |
|---|---|
| `ended` | Su tienda tuvo **2 o más revisiones completas** después del `last_seen` del anuncio. |
| `active` | `last_seen` ≥ hoy − 2 días. |
| `unverified` | Todo lo demás. |

### Cambios

- **Barrido de vencidos:** `reconcile-stale` deja de marcar inactivo. Con la regla, los anuncios de productos fuera de seguimiento quedan `unverified` solos.
- **Migración:** los `inactive` de hoy pasan a `unverified`. No se sabe cuáles terminaron de verdad.
- **API:** el filtro `status` acepta `active`, `unverified` y `ended`. `inactive` queda como alias de `unverified` + `ended` durante la transición, para no romper el frontend desplegado.
- **Frontend:**
  - `describeAdStatus` suma "Sin verificar · visto el {last_seen}" (warn) y "Terminado · el {last_seen}" (muted, único caso en gris);
  - el filtro de Estado pasa a "Activos · Sin verificar · Terminados · Todos".

### Verificación

1. Casos de borde con fechas: un anuncio visto hace 2 días exactos, uno con una sola revisión completa posterior y uno con dos.
2. Los conteos por estado antes y después de migrar suman lo mismo.

### Reversión

Frontend: revertir. Backend: el alias `inactive` permite volver sin migrar de nuevo.

---

## D4 · Copy del anuncio

**Riesgo:** con cuidado.

- [ ] `lib/scrapers/meta-ads.ts`:
  - `ScrapedAd.bodyText?: string | null`;
  - se extrae el bloque de texto principal de la tarjeta: el texto más largo que no sea el anunciante, "Identificador…", fechas ni el botón. **Validar el selector en vivo** con `test-scraper.ts`: Meta cambia clases seguido;
  - se recorta a 2.000 caracteres.
- [ ] `lib/jobs/sync-ads.ts`: `pushAds` manda `bodyText`.
- [ ] **Backend:** `product_ads.body_text` (TEXT), devuelto como `body_text` en `/dashboard/ads-library` y en los anuncios del detalle.
- **El frontend ya lo muestra:** `AdSlide` (`product-ads.tsx:284`) y la tarjeta de L1.

### Verificación

`test-scraper.ts` en 5 tiendas: el copy coincide con Meta a mano, con emojis y saltos de línea.

### Reversión

Revertir el job. La columna puede quedar vacía sin efecto.

---

## L2 · API de la Biblioteca

**Riesgo:** con cuidado.

- [ ] **Backend:**

  | Parámetro o campo | Qué hace |
  |---|---|
  | `q` | Busca en anunciante, título del producto y `body_text`. |
  | `sort` | `days`, `recent` o `copies`. |
  | `storeId` | En cada ítem. |
  | `counts` | `{ total, active }` |
  | `lastSync` | `{ at, storesComplete, storesTotal }` |
  | `groupBy=creative` | Un ítem por `creative_hash`, con `copies`. Depende de D3. |

- [ ] **Frontend:**
  - búsqueda con 300 ms de espera y orden;
  - bloque de producto como link a `/tracker/{candidateId}?storeId={storeId}&from=library`;
  - encabezado desde `counts` (se van los dos pedidos de L1) y línea "Última revisión en Meta";
  - chip "×N anuncios" y resultados como "N creativos (M anuncios)";
  - **filtros en la URL** (`useSearchParams`), para que "Volver" desde el detalle los conserve.
- [ ] **`app/(dashboard)/tracker/[candidateId]/page.tsx`:** con `from=library`, el link de volver (`:412–418`) dice "Volver a la Biblioteca" y usa `router.back()`. Hoy siempre va a `/tracker`.
  - **Ojo:** `fromTracker` (`:277`) trata cualquier `from` distinto de `pool` como tracker. Hay que confirmar que `from=library` no cambie qué se muestra: hoy da igual, porque la Biblioteca es solo Pro.

### Verificación

La lista de L1, más:

- búsqueda con acentos ("lampara" encuentra "Lámpara");
- el link al producto abre el detalle correcto;
- volver conserva los filtros;
- con `groupBy=creative`, la suma de `copies` es igual a `counts.total`.

### Reversión

Revertir el frontend. Los parámetros nuevos del backend son opcionales.

---

## D5 · Cobertura (prueba de 1 día, después decisión)

1. **Prueba:** un script desde GitHub Actions abre `/ads/library/?id=N` para 20 anuncios conocidos (10 activos y 10 terminados, confirmados a mano) y mide:
   - si se puede leer el estado;
   - cuántos bloquea Meta;
   - cuántos segundos tarda cada uno.
2. **Si lee bien ≥ 95 %:** `lib/jobs/verify-ads.ts` con cupo diario.
   - Prioridad: días corriendo desc y última verificación asc.
   - Actualiza `last_seen` y el estado por anuncio.
   - Corre después de `sync-ads` o en su propio workflow.
3. **Si no:** decidir entre partir el job, proxy o VPS (tabla de `02-propuesta.md` §2).
