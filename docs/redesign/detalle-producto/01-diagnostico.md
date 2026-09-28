# 01 · Diagnóstico de las vistas de detalle de producto

**Fecha:** 2026-09-28 · **Base:** `main` en `3788333` (dirección B "Radar", tema claro) · **Alcance:** panel de detalle de `/pool` (split view) y página `/tracker/[candidateId]`.

## Cómo se hizo

- Leí el código. Cada hallazgo cita archivo y línea de `main`.
- Levanté la app real (`next build` + `next start`, el mismo código de `main`) contra una API simulada y medí el DOM con Playwright en 390, 1000, 1024, 1100, 1280, 1366, 1440, 1600 y 1920 px. El producto del mock tiene score 72 con confianza 20 %, 10 días de historia y 9 anuncios (6 activos, 3 terminados, 3 anunciantes).
- **Las capturas que mencionaste no llegaron a esta sesión.** Trabajé con el código y con mis capturas de la app real. Se reprodujeron todos los síntomas que describiste.
- Hay capturas de la app en [`capturas/`](./capturas/): `antes-panel-1440.jpg`, `antes-pagina-1440.jpg` y `antes-pagina-390.jpg`. Los datos son de la API simulada.

---

## 0. CLAUDE.md está desactualizado (lo reporto, no lo corrijo)

| CLAUDE.md dice | Lo que hay en el código |
|---|---|
| Next.js 15 | Next **16.1.6** (`package.json:52`) |
| Usar `formatCurrency(amount, currency)` de `lib/utils.ts` | **No existe** (0 resultados en todo el repo). La utilidad real es `<FormattedPrice>` (`components/ui/formatted-price.tsx`), montada sobre `currencySymbol` y `convertWithRates` de `lib/currency.ts`. Pone `~` cuando no se conoce la moneda de origen (línea 51). |
| `lib/api.ts`: cliente axios que inyecta el JWT | No existe y no hay axios. El JWT se inyecta en `lib/baseQuery.ts:11` (RTK Query). |
| Redux: solo `currencySlice` | Hay 5 slices: `authSlice`, `onboardingSlice`, `dashboardSlice`, `storesSlice` y `currencySlice`. |
| Regresión viva en `tracker/[candidateId]/page.tsx:589` | Ahora está en la **línea 625** (el archivo cambió en CHANGE-102/103). Es el mismo bug: "Pico: {peakGrowthPct}%". |
| Regresión en `hero-signal-card.tsx:88` | Sigue ahí (87–89). |
| "`pool-winners.tsx` sí puede [mostrar Declining]" | Ya no: `pool-winners.tsx` no renderiza `PerformanceBadge` ni `performanceLabel`. En estas vistas, "En baja" sale en otro lado: la tabla diaria de la página de detalle (`page.tsx:689` y `:704`, ver Q7). |
| `winner-card`, `winner-podium` y `race-track` como componentes del tracker | Existen, pero ninguna página los renderiza. |
| `tracker-table.tsx` "con estimaciones" | Las estimaciones se sacaron en CHANGE-010. |
| El clon vive en `/tmp/scout-frontend` | En esta sesión está en `/home/user/scout-frontend`. Depende del entorno. |

---

## Vista 1 · Panel de detalle en `/pool`

Componente: `components/tracker/pool-detail-panel.tsx`. Lo monta `app/(dashboard)/pool/page.tsx:175` con `lg:grid-cols-[minmax(0,1fr)_400px]`.

### P1. Las fechas de los anuncios se parten en varias líneas y pisan "Activo"

**Causa raíz:** la grilla de anuncios siempre tiene 6 columnas, sin importar el ancho disponible: `product-ads.tsx:443` → `grid grid-cols-6 gap-3 px-4`.

Dentro del panel quedan unos 332 px útiles:

- el panel mide 400 px;
- se restan 16 × 2 de padding del panel (`pool-detail-panel.tsx:150`), el borde de la tarjeta de anuncios y 16 × 2 de `px-4`.

Con 5 huecos de 12 px, **cada columna mide ~45 px**. En ese ancho:

- La fecha (`product-ads.tsx:246–248`, `<p>Desde {formatDate(...)}</p>`) no tiene `truncate` ni `whitespace-nowrap`, así que se parte palabra por palabra. Además `formatDate` (`:679–681`) siempre agrega el año (`{day, month:'short', year}`), y queda "Desde / 25 de / ago / de / 2026" en 5 líneas.
- El estado (`:250` y `:255`) es `flex shrink-0`: no puede achicarse. Su ancho mínimo ("● Activo" ≈ 45 px) supera lo que le queda al lado de la fecha, así que **desborda la columna y se dibuja encima de la tarjeta vecina**. "Terminó · corrió 7d" (`:252`) mide ~100 px.

### P2. "Ver en Meta →" ocupa 4 líneas

Es la misma causa. El link (`:262–270`) tiene `w-full px-2 py-1.5 text-[11px]`: 45 px menos padding y borde dejan ~27 px de texto, así que queda una palabra por línea. Cuando está deshabilitado (`:272`, `text-muted-foreground/30`) el contraste es **1,65:1**. Se lee como un error, no como algo bloqueado.

### P3. Las miniaturas quedan diminutas y apretadas

Cada creativo mide 45 × 80 px (9:16):

- **Chips:** `×N` (`:217`) y `{días}d` (`:221–226`) compiten por ~29 px. Están en 9–10 px, por debajo del mínimo de 12 px de Radar. El blanco sobre `amber-500` da **2,13:1** y sobre `emerald-500/80` **2,11:1**.
- **Overlay inferior** (`:229–240`): "FACEBOOK" en 9 px más el nombre del anunciante truncado a "c…".
- **Cabecera de la sección** (`:395–437`): usa `justify-between` sin wrap. El grupo de la derecha (select + "actualizado hace 5h") aplasta al de la izquierda, y los badges de anunciante quedan apilados de a uno.

### P4. Los encabezados "Producto" y "Precio" se superponen

**Causa raíz:** con el panel abierto, la cabecera y las filas de la tabla usan grillas distintas.

- **Cabecera:** siempre usa la plantilla de 10 columnas (`pool-winners.tsx:635`: `grid-cols-[32px_64px_minmax(0,1fr)_60px_48px_72px_110px_90px_140px_60px]`).
- **Filas:** con el panel abierto pasan a 6 columnas (`:956–959`, `isCompact`).

Las pistas fijas de la cabecera suman 816 px (676 de columnas, 108 de huecos y 32 de padding), pero la lista mide 712 px en 1440. La pista "Producto" (`minmax(0,1fr)`) **se resuelve en 0 px** (medido) y su texto se desborda sobre "Precio".

| Viewport | Ancho de la lista | Pista "Producto" de la cabecera | Columna de título de la fila |
|---|---|---|---|
| 1024 | 351 px | 0 px | **17 px** |
| 1100 | 372 px | 0 px | **38 px** |
| 1280 | 552 px | 0 px | 218 px |
| 1440 | 712 px | 0 px | 378 px |
| 1600 | 872 px | 54 px | 538 px |

La desalineación es mayor que la superposición: la cabecera describe 10 columnas y la fila tiene 6. "Score", "Tendencia", "Crecimiento", "Contexto" y "Ads" quedan sobre columnas que no les corresponden.

### P5. El split view se rompe entre 1024 y ~1280 px

El split se activa en `lg` (1024, `pool/page.tsx:175`), pero la fila compacta necesita 332 px fijos más el título. Por debajo de ~1200 px el título del producto mide 17–38 px, es decir, es ilegible (tabla de P4).

### P6. El panel no es sticky: su cabecera y el botón de cerrar desaparecen al hacer scroll

`pool-detail-panel.tsx:50` usa `sticky top-4`, pero **nunca se activa**:

- El ancestro con scroll más cercano es el `div.flex-1.overflow-y-auto.overflow-x-hidden` del shell (`app/(dashboard)/layout.tsx:46`).
- Ese div no tiene alto acotado, así que nunca scrollea. El que scrollea es `window`.
- Resultado: el sticky queda atado a un contenedor que no se mueve.

**Medido:** al bajar 700 px, el panel sube exactamente 700 px (top 139 → −561) y el botón de cerrar sale de la pantalla.

Aunque funcionara, `top-4` (16 px) lo dejaría debajo del topbar sticky de 64 px (`components/layout/app-header.tsx:243`, `sticky top-0 z-40 h-16`).

Hay dos efectos colaterales:

- `max-h-[calc(100vh-2rem)] overflow-y-auto` crea un segundo scroll dentro del panel. No sirve de nada si el panel se va con la página.
- `layout.tsx:31` (`scrollRef.current.scrollTop = 0` al cambiar de ruta) no hace nada, por la misma razón.

### P7. Por debajo de 1024 px, el panel se abre debajo de la tabla, fuera de la vista

Sin `lg:`, la grilla es de una columna y el panel se renderiza después de toda la tabla.

**Medido a 1000 px:** la fila clickeada está en y = 500 y el panel aparece en y = 1117 (con 7 filas; con 20 filas reales serían más de 2000 px). Nada hace scroll hacia el panel, así que el usuario hace clic y "no pasa nada".

### P8. Jerarquía plana: los gráficos van primero y los anuncios quedan fuera de la vista

**Orden actual:**

1. Cabecera (`:69`).
2. 4 stats (`:110`).
3. Anillo, días y link (`:122`).
4. **Dos gráficos de 256 px cada uno** (`:136–146`; `h-64` en `rank-chart.tsx:26` y `score-chart.tsx:26`).
5. Anuncios (`:150`).
6. Descripción (`:155`).

**Medido en 1440 × 900:** la sección de anuncios arranca a 923 px del borde superior del panel y el primer creativo a 1144 px, pero el panel solo muestra 761 px sin scroll. Los anuncios quedan fuera de la vista, dentro de un panel que además no se queda fijo.

**Otros problemas del panel:**

- **Score duplicado:** el stat "Score 72" (`:112`) y el anillo con 72 (`:124`).
- **Color sin significado:**
  - Score y Crecim. siempre van en verde (`tone="good"`, `:112` y `:116`), aunque el crecimiento fuera negativo.
  - Confianza va en violeta de marca (`:118`), un color que no significa nada ahí.
  - Con 20 % de confianza el panel muestra dos verdes.
- **Tarjetas anidadas:** `ProductAdsSection` trae su propia tarjeta (`product-ads.tsx:391`) y `ProductDescriptionModal` otra (`product-description.tsx:54`), dentro de la tarjeta del panel. Resultado: doble borde y doble padding.
- **Tamaño de texto:** las etiquetas de los stats miden 10 px (`:30`).
- **Botón de cerrar:** se pone rojo al pasar el mouse (`:103`). En Radar el rojo es caída o error, y cerrar no es destructivo.
- **Imagen del producto:** usa la URL cruda (`:73`). La tabla usa el proxy (`HoverImagePreview proxy`, `pool-winners.tsx:979–983`), que existe para saltar el bloqueo de hotlink (`app/api/image-proxy/route.ts` envía el `Referer` del origen). Si una tienda bloquea hotlink, la tabla muestra la foto y el panel no. *No lo verifiqué con tiendas reales.*

### P9. Gráficos en inglés, con colores fuera del sistema y rojo para "score bajo"

Afecta al panel y a la página, que son los únicos que usan estos dos componentes.

- **Idioma:** las fechas salen en inglés, `toLocaleDateString('en-US')` en `rank-chart.tsx:17` y `score-chart.tsx:21` ("Sep 20"). El tooltip dice "Growth:" (`score-chart.tsx:53`).
- **Colores en oklch fijo:** `rank-chart.tsx:31–32, 79, 91` y `score-chart.tsx:10–13`. Los ticks de los ejes van en `oklch(0.6 0 0)` = #808080, **3,95:1**: no pasa AA para texto de 11 px.
- **Rojo para score bajo:** `barColor` pinta de rojo cualquier score < 40 (`score-chart.tsx:13`). Un producto en su día 1 tiene score bajo por construcción, porque la fórmula crece con los días. El rojo dice "caída" cuando en realidad es "temprano".
- **Tres escalas para el mismo número en la misma vista:** el gráfico usa 60/40, el anillo 65 y las bandas de label 70/50/30/15.

### P10. Las fechas pueden salir un día antes y un null se ve como 1969

Afecta al panel y a la página: son las fechas de los anuncios, "Primera vez visto" y la tabla diaria.

Las tres funciones de fecha (`product-ads.tsx:679`, `page.tsx:314`, y el mismo patrón en los gráficos) hacen `new Date(iso).toLocaleDateString(...)`. Cuando el string es solo fecha (`"2026-09-19"`), JavaScript lo interpreta como **medianoche UTC**.

**Medido con Playwright en `America/Bogota`**, con la API mandando `firstSeenDate: "2026-09-19"`:

- "Primera vez visto" muestra **18 de sept**;
- el Día 1 de la tabla muestra **18 de sept**;
- un anuncio con `first_seen: "2026-08-25"` muestra "Desde **24** de ago".

Pasa en cualquier huso horario al oeste de UTC, es decir, en toda Latinoamérica. Solo ocurre **si el backend manda fechas sin hora** (lo típico de un `LocalDate` de Spring Boot). *No lo pude verificar contra la API real.*

**Con `first_seen: null`** el anuncio dice "Desde 31 de dic de 1969" (medido). Incumple la regla de null safety.

---

## Vista 2 · Página `/tracker/[candidateId]`

Archivo: `app/(dashboard)/tracker/[candidateId]/page.tsx` (718 líneas).

### Q1. Espacio vacío grande a la derecha del título

La cabecera (`:426`) es `flex lg:flex-row lg:justify-between` con tres bloques: galería + info, anillo y botones. La info no tiene `flex-1` ni ancho máximo, así que mide lo que mide su contenido. El resto del ancho no se asigna a nada: es lo que sobra del `justify-between`.

| Viewport | Título largo (65 caracteres) | Título típico (30 caracteres) |
|---|---|---|
| 1440 | hueco de 24 px | 70 px |
| 1920 | 174 px | **550 px** |

Además, el bloque anillo + botones (~100 px de alto) flota arriba a la derecha de una cabecera de 244 px, lejos de los datos que califica. El velo `bg-gradient-to-r from-primary/10` (`:425`) tiñe la cabecera sin significar nada. Radar prohíbe degradados en cabeceras de página.

### Q2. Dos h1 y un título que no dice nada

`PageLayout title="Detalle del producto"` (`:413`) renderiza un h1 (`page-layout.tsx:14`) con la descripción "Análisis profundo del rendimiento del candidato". El título del producto es otro h1 (`:444`). En total son dos h1 y ~90 px de cabecera que no le dicen nada nuevo al usuario (medido: `h1Count: 2`).

### Q3. "Volver al Tracker" aunque vengas del pool

El `href="/tracker"` es fijo (`:415–421`). Si llegaste desde "Explorar testeos" (`from=pool`), te lleva a Mis testeos. Volver al pool por el navegador pierde los filtros, porque viven en estado local de `pool/page.tsx`.

### Q4. Los 4 KPI no tienen jerarquía

Son 4 celdas iguales (`:534–582`): mismo tamaño, mismo peso, ícono + overline + `text-2xl`, todo centrado. Lo primero que necesita el usuario (¿la señal es buena? ¿qué tan confiable es?) está partido en dos: el anillo arriba en el borde derecho y "Confianza" en la cuarta celda, en violeta.

Además, varios colores no significan nada:

- "Mejor rank" en verde sin motivo (`text-rising`, `:549`).
- "Confianza" en violeta de marca (`text-primary`, `:579`).
- **Crecimiento con `null`:** `summary.growthPct >= 0` (`:560`) da `true` cuando el valor es `null` (en JS, `null >= 0` es `true`). Si la API manda null, se ve **"+0 %" en verde** en lugar de "—". Lo mismo pasa en cada fila de la tabla diaria (`:697`). Esto incumple la regla de null safety.
- "Superó al X % del catálogo" usa 4 colores de la paleta de Tailwind fuera de los tokens (`:389–393`: `rose-500`, 3,75:1, `amber-600`, `green-700`, `emerald-600`, 3,65:1).
- "Día N de 30" tiene el 30 fijo (`:475`). Si la ventana de seguimiento no es de 30 días, o cambia, el texto miente. *No lo verifiqué contra el backend.*

### Q5. Score verde con 20 % de confianza (D-1)

- La página no pasa `confidence` al anillo: `:485` → `<ScoreRing score={adjustedScore} … />`.
- Aunque lo pasara, `score-ring.tsx:28` lo ignora (`confidence: _confidence`) y colorea por `score >= 65` (`:37`).
- El panel sí lo pasa (`pool-detail-panel.tsx:124`), con el mismo resultado.

Es la decisión **D-1**, pendiente de Diego (SPEC-R2a en `../03-spec-fase-2.md`). **Acá no se resuelve.**

### Q6. Anuncios: 6 columnas con 4 ocupadas, y se rompe por debajo de ~1100 px

Es el mismo componente del panel (`product-ads.tsx:443`, `grid-cols-6`). En la página cada columna mide ~165 px:

- **Columnas vacías:** con menos de 6 creativos únicos, la derecha queda vacía. En el mock hay 4 de 6.
- **Anchos menores:** en 1024 cada columna mide ~105 px y reaparecen P1 y P2. En 390 px pasa lo mismo que en el panel.
- **Azul de Facebook:** los badges de anunciante van con estilo inline `background:'#1877F2'` (`:632`). El color más fuerte de la página es el de Facebook, fuera del sistema de tokens.
- **Copy del bloqueo desactualizado:** dice "requieren plan Starter o superior" y "Upgrade →" (`:475` y `:482`). El plan se llama "Básico" desde CHANGE-074 y "Upgrade" está en inglés.
- **Foto de relleno:** `ad.thumbnail_url || 'https://picsum.photos/…'` (`:198` y `:526`). Si un anuncio no tiene miniatura, se muestra **una foto de stock al azar como si fuera el creativo**. En una herramienta de inteligencia eso es un dato falso.
- **El orden "Impresiones" no ordena nada:** `return 0` (`:367`) deja el orden que manda el backend. Si el backend no ordena por impresiones, la etiqueta promete algo que no pasa. *No se puede verificar sin el backend.*

### Q7. Las secciones de abajo se ven planas

- **Ritmo vertical inconsistente:**
  - cabecera con `mb-6` (`:424`);
  - anuncios con `mt-6` (`product-ads.tsx:391`);
  - descripción **sin margen** (`product-description.tsx:54`), pegada a los anuncios;
  - gráficos **sin margen** (`:592`), pegados a la descripción;
  - narrativa con `mt-6 mb-2` y estilo inline (`:654`);
  - historial con `mt-2` (`:662`).
- **El insight más útil está escondido.** La frase "Subió 48 posiciones en 10 días (+80 %). Aún en zona alta del catálogo (top 3 %)." (`:634–657`) es una línea gris de 13 px entre los gráficos y la tabla.
- **La tabla diaria repite los gráficos.** Son 10 filas siempre abiertas (`:662–712`) con lo mismo que ya muestran los gráficos.
- **La columna "Estado" puede decir "En baja" en rojo** (`:689` y `:704`, vía `computeSmartLabel`, `:37–66`). Es el único lugar de estas vistas donde Declining llega al usuario (D-2).
  - El badge sale cuando el backend dice Declining y ese día bajaron el score y el rank (`:58–62`).
  - Como Declining es una **banda** (score 15–29), una caída con score 45 se ve "Estable" y la misma caída con score 18 se ve "En baja".
- **La fecha ocupa 4 líneas en móvil** ("19 / de sept / de / 2026"): usa `{month:'short', day, year}` (`:314–319`).
- **"Pico: {peakGrowthPct}%"** (`:625`): es la regresión viva #1. **No se toca.**

### Q8. Datos que desaparecen cuando llegas desde el pool

La tienda sale de `useGetStoresQuery()` (`:279–282`), que solo trae **tus** tiendas. Si el producto es de otra tienda, `store` queda `undefined` y:

- no se muestra el nombre de la tienda (`:445`);
- **no hay galería:** `/api/product-images` nunca se llama (`:305` sale temprano), así que solo se ve la portada;
- `totalProducts = 0` (`:385`), así que no aparece "superó al X %" ni la zona en la narrativa.

Sin embargo, `candidate.storeBaseUrl` sí viene en el payload: el panel lo usa (`pool-detail-panel.tsx:88`). Es un hueco de cableado de datos, no de diseño, pero el diseño tiene que degradar bien. Usarlo como respaldo es una decisión de negocio (G-5).

### Q9. Móvil

A 390 px el `scrollWidth` es 808 (página) y 1079 (pool): el shell no tiene layout móvil (`layout.tsx:43–44`: `<AppSidebar pinned={true} />` con `w-64` fijo y `<main className="… pl-64">`). El contenido recibe 134 px.

**Ningún diseño de estas vistas se va a ver bien en móvil hasta que cambie el shell.** Eso es una spec aparte (M1 en `03-spec.md`) y toca todas las páginas.

---

## Control de acceso por plan: qué ve cada plan hoy

Fuente: `lib/view-as.tsx:95–109` (`usePlanTier`). El selector "Vista" (`components/admin/ViewAsBar.tsx`) cambia `effectivePlan` solo para el admin. Todo el gating es **del frontend**.

| Qué | Prueba gratis (`free`) | Básico (`starter`) | Pro | Agency | Admin (Real) |
|---|---|---|---|---|---|
| Páginas del pool (`maxPoolPage`) | solo la 1 | 500 | 1000 | todas | todas |
| Panel: rank, score, crecimiento, confianza, gráficos | sí | sí | sí | sí | sí |
| Anuncios en la **tabla** del pool (`AdsCell`) | sí, sin blur (CHANGE-082) | sí | sí | sí | sí |
| Anuncios en **panel y página** (`canViewAds`) | **borrosos + candado** | sí | sí | sí | sí |
| Nombre del anunciante en los badges de la cabecera | borroso | **borroso** | sí, con link a Meta | sí | sí |
| Nombre del anunciante en cada tarjeta de anuncio | (grilla borrosa) | **visible** | sí | sí | sí |
| "Ver en Meta" en cada anuncio (`allowMetaLink`) | — | deshabilitado | link | link | link |
| "Ver producto" en la página desde el pool (`page.tsx:517`) | no | no | sí | sí | sí |
| "Ver producto" en la página desde Mis testeos | sí | sí | sí | sí | sí |
| Métricas de la página (score, crecimiento, gráficos, historial) | **sí, sin blur** | sí | sí | sí | sí |
| Spikear, Compartir, Página completa | sí | sí | sí | sí | sí |

### Inconsistencias que el diseño **no** resuelve por su cuenta (necesitan decisión)

- **G-1. La prueba gratis ve los anuncios en la tabla del pool pero no en el panel del pool.**
  - La tabla fuerza `canViewAds = true` (CHANGE-082).
  - El panel reutiliza `ProductAdsSection`, que usa `canViewAds = !isTrial`.
  - El comentario de `view-as.tsx:101–103` dice que el pool "SIEMPRE los muestra", y el panel está dentro del pool.
  - ¿Cuál es la intención?
- **G-2. La prueba gratis se salta el bloqueo de métricas de Mis testeos.**
  - En Mis testeos ve borrosos el score, la tendencia y el crecimiento (`LockedMetric`, `tracker-table.tsx:246`; CHANGE-079 y CHANGE-083).
  - Pero el título y el botón "Ver" (`tracker-table.tsx:590` y `:725`) la llevan a la página de detalle, que muestra score, crecimiento, confianza, gráficos e historial sin blur. La página no mira `canViewTrackerMetrics`.
- **G-3. El nombre del anunciante está bloqueado en un lugar y visible en otro.**
  - Los badges de la cabecera lo difuminan para quien no es Pro (`product-ads.tsx:644`).
  - Cada tarjeta lo muestra en claro en el overlay (`label = advertiser_name`, `:164`, renderizado en `:239`).
  - Básico lo ve igual.
- **G-4. "Ver producto" desde el pool depende de un parámetro de la URL** (`from=pool`, `page.tsx:276` y `:517`). Si se borra `&from=pool` de la URL, el botón aparece para cualquier plan, y la URL del producto ya viene en el payload. No es un hueco nuevo, pero el diseño no debe apoyarse más en ese parámetro.
- **G-5. La identidad de la tienda está a la vista en el pool.**
  - Las filas (`pool-winners.tsx:930`, "superó al X % de {storeName}") y el panel (`pool-detail-panel.tsx:88`) muestran la tienda a todos los planes.
  - Si saber la tienda es parte del valor pago, esos dos lugares la filtran hoy.
  - Si no lo es, la página podría mostrarla también (hoy no la muestra, por Q8).

### Otra inconsistencia (de scoring, no se toca)

- **S-1. El mismo producto muestra un score distinto en el panel y en "Página completa".**
  - El panel y la lista del pool usan el score crudo (`summary.performanceScore` / `winner.performanceScore`).
  - La página aplica `applyScoreDecay` (`page.tsx:371`), igual que Mis testeos (`tracker-table.tsx:541`).
  - Un producto estancado puede verse 72 en el panel y 50 en la página.
  - Es lógica de scoring, así que queda para Diego.

---

## Resumen de causas

| # | Síntoma | Causa raíz | Dónde |
|---|---|---|---|
| P1–P3, Q6 | Fechas partidas, "Activo" encimado, "Ver en Meta" en 4 líneas, miniaturas mínimas | Grilla fija de 6 columnas; metadatos que no pueden encogerse (`shrink-0`) ni truncarse; fecha con año; textos de 9–11 px | `product-ads.tsx:443`, `:246–256`, `:262–273`, `:679` |
| P4–P5 | "Producto" y "Precio" superpuestos; títulos de 17 px | La cabecera usa la plantilla de 10 columnas y la fila compacta la de 6; el split se activa en `lg` sin espacio | `pool-winners.tsx:635`, `:956–959`; `pool/page.tsx:175` |
| P6 | El panel se va con el scroll | El sticky queda atado a un div con `overflow` que no scrollea; además `top-4` < topbar de 64 px | `layout.tsx:46`; `pool-detail-panel.tsx:50`; `app-header.tsx:243` |
| P7 | Por debajo de lg el panel queda fuera de la vista | Se renderiza después de la tabla y nada hace scroll hacia él | `pool/page.tsx:175`, `:206` |
| P8, Q7 | Jerarquía plana | Orden por componente, no por decisión: dos gráficos de 256 px primero, tarjetas anidadas, márgenes sueltos | `pool-detail-panel.tsx:136–157`; `page.tsx:586–712` |
| Q1–Q4 | Hueco junto al título, KPI sin jerarquía | `justify-between` sin grilla; 4 celdas iguales; color sin significado; dos h1 | `page.tsx:413`, `:426`, `:534–582` |
| Q5 | Verde con 20 % de confianza | El anillo ignora `confidence` (D-1) | `score-ring.tsx:28`, `:37`; `page.tsx:485` |
| P9 | Gráficos en inglés y en rojo | `en-US`, colores oklch fijos, umbrales propios | `rank-chart.tsx`, `score-chart.tsx` |
| P10 | Fechas un día antes; null → 1969 | `new Date('YYYY-MM-DD')` es UTC; no se chequea null | `product-ads.tsx:679`, `page.tsx:314` |
| Q9 | Móvil inutilizable | El shell no tiene layout móvil | `layout.tsx:43–44` |
