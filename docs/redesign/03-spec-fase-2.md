# 03 · Spec de implementación — Fase 2

**Fecha:** 2026-09-28 · **Autor:** Daniel / Claude · **Formato:** `docs/SPEC-TEMPLATE.md`
**Escrita para:** Dirección A (recomendada). Las diferencias si se elige B están al final de cada spec y en la sección "Si se elige B".

> **Niveles de riesgo** (los del pedido, mapeados a la plantilla): **solo** = frontend puro, ejecutable tras aprobar el plan · **con cuidado** = lógica compartida o cambio visible en toda la app; listar archivos y esperar confirmación, sin auto-accept · **requiere-revisor-técnico** = cambia el significado de una señal o toca algo que Diego debe validar (equivale a "Diego" en la plantilla).

## Estado al 2026-09-28: fase 2 implementada (dirección B)

**Decisiones tomadas por el dueño:** D-0 = **B (Radar)**, en contra de la recomendación (A). D-7 = **claro primero**: B se lanza en su versión clara (sidebar de tinta, violeta, Outfit) y el oscuro queda definido en `.dark` pero sin activar. D-3 = **sí** (R5 incluido). Se agregó el **shell** (sidebar, header, ticker), que no estaba en la spec original.

Con claro primero, R1 queda en "con cuidado" y no en "requiere-revisor-técnico": se puede mergear sin romper las pantallas que no se migraron.

| Commit | Spec | CHANGES |
|---|---|---|
| `ea5644a` | R1 — tokens, fuentes, primitivos, shell | CHANGE-112 |
| `294cd33` | R2b — badges, sparkline, precio, colores del ScoreRing | CHANGE-113 |
| `a2a22c6` | R3 — Resumen (/dashboard) | CHANGE-114 |
| `7dadda6` | R4 — Mis testeos (/tracker) | CHANGE-115 |
| `3abe5ae` | R5 — copy en español | CHANGE-116 |
| `d108fd2` | Ajustes de verificación: texto con degradado AA, contexto en una línea | CHANGE-112/115 |

**No implementado, a propósito:**
- **R2a** (ScoreRing con confianza, CHANGE-004): espera **D-1** de Diego. El anillo sigue coloreando por `score >= 65`, ahora con tokens.
- Textos crudos del backend (Rocket, Declining en "Salud del seguimiento" y en la campana): esperan **D-2**. Sí se sacó el rojo de "Declining".

**Desvíos respecto de la spec (todos solo de presentación):**
- `components/ui/badge.tsx` no se modificó: `Badge` y `Card` de shadcn no se usan en ninguna pantalla, y agregarles variantes sería código muerto. Los tokens semánticos se aplican directo en los componentes.
- R3 sumó dos tokens de elevación (`shadow-card`, `shadow-card-hover`) en `app/globals.css`, para no repetir sombras arbitrarias.
- R4 **sí** tocó los anchos del `grid-cols` de la tabla (la spec decía no hacerlo): en la app real, la columna Producto mostraba "L…" cuando aparecía el chip Spikear. Se redistribuyeron anchos sin quitar ni reordenar columnas, y el chip bajó al renglón de rank (mismo código). La reestructuración de fondo sigue siendo **D-4**.
- R5 también cambió los tiers en `pool-winners.tsx` (solo el texto), para que el mismo concepto se llame igual en Explorar testeos.
- El overline "Señal más fuerte" usa `--grad-text` (violeta → azul, ≥6:1) y no el degradado de marca, que termina en cian y en claro no llega a 4,5:1.

**Verificación hecha:**
- Build de producción OK. `tsc`: los mismos 9 errores previos (CHANGE-111), ninguno nuevo. `pnpm lint` no corre porque eslint no está instalado; ya estaba así antes.
- Capturas de la app real con API simulada (Playwright): `/dashboard`, `/tracker`, `/stores`, `/pool`, `/pendientes` y `/login` en claro, más `/dashboard` y `/tracker` forzando `.dark`. Sin errores de consola ni scroll horizontal.
- `node docs/redesign/tools/contrast-check.mjs`: 46/46 pares AA en `:root` y en `.dark`, incluidos los degradados con texto.
- Checklist `react-agents-review`: hooks, tipos, estado, keys y accesibilidad de `Segmented` OK. Encontró el contraste del overline, que ya está corregido. Queda señalado que `tracker-table.tsx` (~800 líneas) debería partirse, pero eso es otro cambio.

**Qué falta para activar el oscuro por defecto:** migrar los colores escritos a mano de ~21 archivos (pool, stores, detalle de candidato, home, settings, pendientes, admin, share, pricing, `product-ads`, `shooting-stars`, `spike-overlay`, `rank-chart`, `pool-detail-panel`…). Después: montar `ThemeProvider` (next-themes ya es dependencia) con `defaultTheme="dark"` y, si se quiere, un selector de tema. Quedan 348 usos de paleta a mano (eran 447) y 134 textos < 12 px (eran 186), todos fuera de las pantallas rediseñadas. Riesgo conocido del oscuro: las fotos de producto con fondo blanco resaltan mucho (se ve en "Top productos").

## Orden y empaquetado

Un PR por spec, en este orden. Cada PR se revierte solo, sin arrastrar a los demás.

| PR | Spec | Riesgo | Depende de |
|---|---|---|---|
| 1 | **R1** Sistema de diseño: tokens, fuentes, primitivos | con cuidado | D-0 |
| 2 | **R2a** ScoreRing con confianza | **requiere-revisor-técnico** | R1, D-1 |
| 3 | **R2b** Badges, sparkline, precio | con cuidado | R1, D-2 (parcial) |
| 4 | **R3** Pantalla Dashboard | solo | R1, R2b |
| 5 | **R4** Pantalla Tracker | con cuidado | R1, R2a, R2b, D-2 |
| (6) | **R5** Copy e idioma | solo, con OK del dueño | D-3 |

**Fuera de la fase 2:** modo oscuro (se vuelve fase 3 si se elige A: necesita montar `ThemeProvider` y migrar todos los colores a mano), pool, stores, pendientes, login, detalle de candidato, marketing. Estas pantallas **heredan** los tokens nuevos de R1 automáticamente (por eso R1 es "con cuidado"), pero sus clases a mano no se tocan.

## Invariantes para todas las specs

Aplican a cada PR y se revisan en cada diff:

- Estimaciones siempre con `~` (patrón en `04-restricciones.md`). Hoy no se muestra ninguna (CHANGE-010); **ningún PR de la fase 2 las vuelve a mostrar**.
- `Rocket` → "En alza". El usuario nunca ve "Rocket" ni "Declining". No se diseña ninguna variante visual para Declining.
- `signalConfidence` llega al `ScoreRing` en todo call site que tenga el dato.
- Moneda: `FormattedPrice` / `currencySymbol()` de `lib/currency.ts` (ver D-5: `formatCurrency` no existe). Ningún `$` escrito a mano.
- Null safety: cada campo numérico nuevo en pantalla usa `?? 0` o `?? '—'`. Los `—` ya existentes se conservan.
- **No se tocan** las 3 regresiones vivas: `app/(dashboard)/tracker/[candidateId]/page.tsx:589` (`peakGrowthPct` con `%`), `components/tracker/hero-signal-card.tsx:88` (sin clamp de `topPct`) y `consecutiveTop10Days()` en `hero-signal-card.tsx:13-25`.
- **No se tocan:** `lib/label-utils.ts` (`resolveDisplayLabel`, `isScalable`), `lib/score-decay.ts`, `lib/spike-store.ts`, `lib/top-tier.ts`, `store/`, `app/(dashboard)/services/`, `app/(dashboard)/types/`, `lib/types.ts`, API routes ni `package.json` (**cero dependencias nuevas**).

---

## SPEC-R1 — Sistema de diseño: tokens, fuentes y primitivos shadcn

**Nivel de riesgo:** con cuidado

### Objetivo
Reemplazar los tokens de `app/globals.css` por los de la dirección elegida y arreglar los dos defectos de base que contaminan toda la app: `--accent` igual a `--primary` (C1) y la fuente sin conectar a `next/font` (T1).

### Qué cambia
- [ ] `app/globals.css` `:root`: valores de la tabla de `02-direcciones.md` en OKLCH (salen de `node docs/redesign/tools/contrast-check.mjs --oklch`).
  - `--accent` → `--surface-3` (hover neutro). **Este es el cambio más visible de todo el PR.**
  - `--input` → `--border-input`; `--muted-foreground` → `--text-2`.
  - Nuevos: `--subtle-foreground`, `--primary-hover`, `--primary-subtle`, `--primary-text`, `--primary-border`, `--success|warning|danger|info` con `-foreground`, `-subtle` y `-border`, `--score-track`, `--sidebar-muted-foreground`.
  - Registrar todos en `@theme inline` como `--color-*`, para que existan `bg-success-subtle`, `text-warning-foreground`, etc.
  - `--rising`, `--watching`, `--stable` y `--declining` se re-apuntan (`var(--success-foreground)`, `var(--muted-foreground)`, `var(--info-foreground)`, `var(--danger-foreground)`) para que los usos actuales hereden sin tocar componentes.
  - `--chart-1..5` → acento, success, warning, info, subtle.
  - `--radius: 0.625rem` (10 px) y la escala `--radius-sm/md/lg/xl` en 5/7/10/12 px **con valores explícitos**. Hoy son `calc(var(--radius) ± n)`, que con 10 px daría 6/8/10/14.
- [ ] `app/globals.css` `@theme inline`: `--font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif`; `--font-mono: var(--font-geist-mono), ui-monospace, monospace`; nuevo `--font-display: var(--font-sans)` (en B: `var(--font-outfit), var(--font-sans)`).
- [ ] `app/layout.tsx`: `themeColor` → valor de `--bg` (`#F6F7F9`). Nada más en ese archivo (fuentes, providers y metadata quedan igual).
- [ ] `components/ui/button.tsx`: `default` → `hover:bg-primary-hover`; `outline` → `border-input`.
- [ ] `components/ui/badge.tsx`: variantes `success | warning | danger | info | neutral | brand` con fondo `-subtle`, texto `-foreground` y borde `-border`, radio `rounded-[5px]`.
- [ ] Nuevo `components/ui/segmented.tsx` (≈40 líneas, sin estado propio: recibe `value` y `onChange`), para unificar las 5 implementaciones (J5). **Solo se crea en R1**; las pantallas lo adoptan en R3 y R4.
- [ ] `docs/redesign/tools/contrast-check.mjs`: agregar lectura de `app/globals.css` para que la verificación corra sobre el código real y no solo sobre los previews.

### Qué NO debe cambiar
- Nombres de tokens shadcn existentes (se cambian valores, no nombres).
- Ningún componente fuera de `components/ui/button.tsx` y `badge.tsx`.
- `styles/globals.css` queda (es código muerto, pero borrarlo es otro cambio: se reporta, no se hace).
- Sin bloque `.dark` en la fase 2 (dirección A).

### Archivos
`app/globals.css`, `app/layout.tsx` (1 línea), `components/ui/button.tsx`, `components/ui/badge.tsx`, `components/ui/segmented.tsx` (nuevo), `docs/redesign/tools/contrast-check.mjs`.

### Por qué es "con cuidado"
Cambia el color de **todas** las pantallas, incluidas las que no se rediseñan. El hover neutro y el cambio de fuente mueven cosas en lugares que nadie revisó: si hoy el cuerpo se renderiza con una fuente de sistema, pasar a Inter cambia anchos y puede truncar textos en celdas de ancho fijo.

### Cómo verifico que funcionó
1. `pnpm lint` y `pnpm build` sin errores nuevos. Ojo: `next.config.mjs` tiene `ignoreBuildErrors: true`, así que además correr `npx tsc --noEmit` y comparar contra los 9 errores que ya existen (CHANGE-111).
2. `node docs/redesign/tools/contrast-check.mjs` → exit 0, ahora también sobre `app/globals.css`.
3. En el Preview Deployment de Vercel del PR, con cuenta de prueba: DevTools → `<body>` → Computed → `font-family` resuelve a Inter (cierra T1).
4. Hover sobre items del menú de usuario y sobre Buscar/Campana del header: gris neutro, no azul.
5. Checklist de la skill `react-agents-review` sobre `components/ui/segmented.tsx` (componente nuevo, regla 2 de CLAUDE.md), con el resultado en la descripción del PR.
6. Screenshots antes/después (Playwright contra el preview, sesión iniciada) de `/dashboard`, `/tracker`, `/pool`, `/stores`, `/pendientes`, `/settings`, `/login` y `/tracker/[id]`. Revisar a ojo que no haya textos invisibles ni truncados nuevos.

### Rollback
Vercel → Deployments → *Instant Rollback* al deployment anterior (inmediato, sin código). Después `git revert <merge-commit>` y push a `main`.

### Si se elige B
Se suma el bloque `.dark` como tema **por defecto** (`<html class="dark">` + montar `ThemeProvider` de `next-themes`, que ya es dependencia) y `--font-display` apunta a Outfit. Pasa a **requiere-revisor-técnico**: el modo oscuro deja en mal estado toda pantalla que no se migre, así que R1 no se puede lanzar sola.

---

## SPEC-R2a — ScoreRing: el color lo decide la confianza

**Nivel de riesgo:** requiere-revisor-técnico

### Objetivo
Restaurar la regla documentada en CHANGE-004 y exigida por CLAUDE.md. Hoy el anillo ignora `confidence` y colorea por `score >= 65` (diagnóstico S1–S4).

### Qué cambia
- [ ] `components/dashboard/score-ring.tsx`: dos arcos consecutivos con la misma geometría actual (r = 40, trazo 8, tamaños sm/md/lg de 48/72/96):
  - verde `stroke-success` = `score × confidence`
  - ámbar `stroke-warning` = `score × (1 − confidence)`, empieza donde termina el verde, con un corte de 1,5 unidades si ambos existen
  - `confidence ?? 0` y clamp a [0, 1]
  - número en `text-foreground` (neutro); pista en `stroke-score-track`
  - `role="img"` + `aria-label="Score {n}, confianza {c}%"`
  - `linecap` recto para que la frontera entre arcos sea exacta
- [ ] Pasar `confidence` en los call sites que tienen el dato:
  - `components/tracker/tracker-table.tsx:670` → `candidate.signalConfidence`
  - `app/(dashboard)/stores/[storeId]/page.tsx:275`, `:345` → `c.signalConfidence` (`TrackerCandidate`)
  - `app/(dashboard)/tracker/[candidateId]/page.tsx:485` → `summary?.signalConfidence` (**solo esa línea** de ese archivo; la :589 no se toca)
  - `app/(dashboard)/home/page.tsx:132` → `product.signalConfidence` (`PoolWinnerProduct`)
  - `components/tracker/pool-archive-hint.tsx:60` → `winner.signalConfidence`
- [ ] Sin cambios: `pool-detail-panel.tsx:124` y `pool-winners.tsx:1038` (ya lo pasan).

### Qué NO debe cambiar
- El score que se muestra (el número), `applyScoreDecay` y cualquier umbral de `label-utils`.
- La firma del componente (`confidence?: number` sigue siendo opcional).
- `winner-podium.tsx` tiene su propio `ScoreRing` local, pero es código muerto y no se toca.

### Pendiente de decisión (D-1)
- `app/share/[candidateId]/page.tsx:201`: el tipo local de la página pública **no trae** `signalConfidence`. Con `?? 0` el anillo sale todo ámbar en los links compartidos. Opciones: (a) aceptar ámbar, que es conservador; (b) agregar el campo a la respuesta de share, que es tocar la API → fuera de alcance. **Recomiendo (a)** para la fase 2.
- `pool-winners.tsx:786` y `:829`: anillos de relleno con scores fijos (42/38/35/31) detrás del bloqueo de prueba gratis. Sin `confidence` salen ámbar. No es dato real, así que se aceptan.

### Por qué requiere revisor técnico
Cambia lo que el usuario **interpreta** de la señal principal: productos que hoy se ven verdes pasan a ámbar (score alto con poca historia) y al revés. La regla está en CLAUDE.md y en CHANGE-004, pero alguien la quitó sin dejar registro. Diego tiene que confirmar que no hubo una razón (por ejemplo, un `signalConfidence` poco fiable en el backend) antes de volverla a poner.

### Cómo verifico que funcionó
1. En `/tracker`, un candidato con `daysElapsed ≤ 3` y score ≥ 65 → anillo mayormente ámbar. Uno con `signalConfidence ≥ 0.8` → mayormente verde.
2. Confirmarlo contra la API con 3 candidatos reales: el largo de cada arco es proporcional a `score × conf` (inspeccionar `stroke-dasharray`).
3. `grep -n "<ScoreRing" -r app components` → todos los call sites con dato llevan `confidence=`.
4. Lint, build y `tsc` como en R1.

### Rollback
`git revert` del PR (1 componente + 6 props). Vercel Instant Rollback si ya está en producción.

---

## SPEC-R2b — Badges, sparkline y precio sobre tokens

**Nivel de riesgo:** con cuidado

### Qué cambia
- [ ] `components/dashboard/performance-badge.tsx`: colores a variantes de `Badge`. Rising → success, Watching → neutral (antes ámbar), Stable → info, New → brand. **No se toca** `mapPerformanceLabel` ni `labelText` (ver D-2).
- [ ] `components/tracker/phase-badge.tsx`: Despegue → success, Meseta → neutral (antes ámbar), Caída → danger, Rebote → info. Hoy no se ve en ninguna pantalla (solo `WinnerCard`, que no se renderiza), así que el cambio es inocuo.
- [ ] `components/tracker/sparkline.tsx`: trazo `var(--success)` / `var(--danger)` (hoy `#34d399` a 1,92:1), relleno con degradado vertical del 22% al 0%, grosor 1,75. El "—" pasa de 9 px a 12 px `text-subtle-foreground`.
- [ ] `components/ui/formatted-price.tsx:51`: `text-primary` → `text-foreground` (el precio deja de parecer un link). **No se toca** la lógica del `~` ni la conversión.

### Qué NO debe cambiar
Textos visibles de los badges, lógica de mapeo, `~` del precio, `useExchangeRates`.

### Por qué es "con cuidado"
"En observación" pasa de ámbar a gris en todas las pantallas. Es un cambio de lectura (deja de parecer alerta) que el dueño tiene que aprobar a sabiendas.

### Verificación
Recorrer `/dashboard`, `/tracker`, `/stores/[id]` y `/tracker/[id]`: badges legibles, precios en color de texto, sparklines visibles en claro. `contrast-check` en verde.

### Rollback
`git revert` del PR.

---

## SPEC-R3 — Pantalla Dashboard (`/dashboard`)

**Nivel de riesgo:** solo

### Objetivo
Llevar la vista Resumen al estilo de la sección 01 del preview.

### Qué cambia
- [ ] `components/layout/page-layout.tsx`: `h1` a 22/28 semibold con tracking −0.02em, descripción `text-muted-foreground`, padding de página 24.
- [ ] `components/dashboard/stats-card.tsx`: quitar el glow borroso (`:28-33`) y los `variant` de color del ícono (el ícono va en contenedor con borde neutro), número a 28/31 semibold con `tabular-nums`. **La prop `variant` se conserva** para no tocar el call site; solo deja de pintar.
- [ ] `components/dashboard/store-card.tsx`:
  - quitar el velo degradado (`:82`)
  - chips de estado: ZOMBIE → `Badge danger`, INACTIVA → `Badge warning`, "Pago anticipado" → `Badge neutral` con ícono de tarjeta (hoy verde)
  - crecimiento `text-success-foreground` / `text-danger-foreground` (hoy `text-rising` / `text-declining`)
  - CTA → `Button variant="secondary"` de ancho completo
  - imágenes `rounded-[7px]` con borde
  - **no se toca** `getDashboardStoreStatus`, ni el cálculo `+500%`, ni `resolveDisplayLabel(...)`
- [ ] `app/(dashboard)/dashboard/page.tsx`: skeleton `rounded-[10px]`, botón "Ver más" → `Button variant="ghost"`. Sin cambios de lógica (`sortByScore`, `isTestProduct`).

### Qué NO debe cambiar
Orden de tiendas, filtro de productos de prueba, textos de i18n (`messages/es.json`), `useDashboard`.

### Archivos
Los 4 listados. Ninguno tiene lógica de scoring.

### Verificación
1. Comparar contra `preview-a.html` §01 con los mismos 3 estados: tienda con candidato, INACTIVA + pago anticipado, sin candidatos (forzar el último filtrando una tienda nueva).
2. `grep -nE "(text|bg|border)-(emerald|amber|rose|red|orange|green|yellow)-[0-9]" components/dashboard/store-card.tsx components/dashboard/stats-card.tsx` → 0 resultados.
3. `grep -nE "text-\[(6|7|8|9|10|11)px\]"` en los 4 archivos → 0 resultados.
4. Lint, build y `tsc`.

### Rollback
`git revert` del PR.

---

## SPEC-R4 — Pantalla Tracker (`/tracker`)

**Nivel de riesgo:** con cuidado

### Objetivo
Llevar Mis testeos al estilo de la sección 02 del preview sin tocar ni una línea de lógica.

### Qué cambia
- [ ] `app/(dashboard)/tracker/page.tsx`: los 2 segmented a mano (`:124-139`, `:185-219`) → `components/ui/segmented.tsx`; estados vacíos con `rounded-[10px]`. **No se toca**: `windowAsTracker`, favoritos en `localStorage`, `usePlanTier`.
- [ ] `components/tracker/tracker-table.tsx`, **solo `className`**:
  - cabecera de 10 px mayúsculas → 12 px sentence-case `text-muted-foreground`
  - `contextTier()` (`:204-210`): se conservan los umbrales y los labels, pero los 5 colores pasan a 2 (success si top ≤ 25%, neutro si no). La función devuelve las mismas claves.
  - `subColor` (`:530-534`) → `text-muted-foreground` fijo
  - `emerald/rose/amber-*` → tokens semánticos
  - chip "Spikear" → `brand-subtle`
  - filas `py-2.5` e imagen 48 (hoy 64): filas de ~68 px
  - toolbar: inputs y selects con `border-input`, toggles activos en `brand-subtle`
  - paginación: página actual con `bg-foreground text-background`
  - **no se toca** `processed`, sort, filtros, `spike/unspike`, `applyScoreDecay`, `removeCandidate`, ni el `grid-cols-[…]` (J3 queda como D-4)
- [ ] `components/tracker/kpi-cards.tsx`: `font-black` → `font-semibold`; `BUCKET_COLORS` en hex → rampa del token de marca + gris; overlines a 12 px. **El texto de las etiquetas (Rocket/Declining…) depende de D-2**: sin decisión, este PR no cambia el texto y solo cambia colores (el rojo de "Declining" desaparece igual).
- [ ] `components/tracker/hero-signal-card.tsx`, **solo JSX de presentación** (`:105-155`): borde izquierdo success de 3 px, título 17/24, CTA "Ver análisis" como `Button size="sm"`. **Prohibido editar las líneas 13-56 y 87-89** (`consecutiveTop10Days`, `selectHero` y el cálculo de `topPct`, regresiones vivas). El diff de este archivo tiene que empezar después de la línea 104.

### Qué NO debe cambiar
- Columnas, orden y datos de la tabla. Paginación de 20.
- `ShootingStars` (animación decorativa: fuera de alcance; solo hereda tokens).
- Toda la lógica de los 4 archivos.

### Por qué es "con cuidado"
`tracker-table.tsx` tiene 799 líneas con lógica y presentación mezcladas en el mismo JSX: un diff de clases grande y fácil de equivocar. `hero-signal-card.tsx` contiene 2 de las 3 regresiones vivas, y un formateo automático o un "de paso arreglo esto" las tocaría.

### Verificación
1. **Diff de lógica = 0:** `git diff main -- components/tracker/tracker-table.tsx | grep -E "^[+-]" | grep -vE "className|^\+\+\+|^---"` → revisar a mano que lo que queda sean solo strings de clases. Mismo chequeo en `hero-signal-card.tsx`, más `git diff -U0 main -- components/tracker/hero-signal-card.tsx | grep "^@@"` para confirmar que ningún hunk empieza antes de la línea 105.
2. En el preview de Vercel: mismos N candidatos que en producción con los mismos filtros; orden por score idéntico; "Spikear" y "Solo activos" filtran igual; favoritos persisten.
3. Visual contra `preview-a.html` §02, incluida una fila con nulos (producto sin rank ni precio).
4. `grep` de colores de paleta y tamaños < 12 px en los 4 archivos → 0.
5. Checklist de `react-agents-review` (cambio grande, regla 2 de CLAUDE.md).
6. Lint, build y `tsc`.

### Rollback
`git revert` del PR. Si solo falla la tabla, se puede revertir ese archivo con `git checkout <commit-anterior> -- components/tracker/tracker-table.tsx`, porque R4 no depende de cambios de API.

### Nota para CLAUDE.md
R4 va a correr los números de línea de las regresiones citadas en CLAUDE.md (`hero-signal-card.tsx:88`). Actualizar esa referencia es parte de D-6.

---

## SPEC-R5 (opcional) — Copy e idioma

**Nivel de riesgo:** solo · **Requiere:** OK explícito del dueño (D-3)

Unificar en español lo que hoy está en inglés dentro de las pantallas rediseñadas: sidebar `Overview` → "Resumen", `Stores` → "Tiendas"; StoreCard `View Details` → "Ver detalle" y `growth` → "crecimiento"; tabla `Clear` → "Limpiar", `N of M results` → "N de M resultados"; tiers `Winner/Strong/Mid/Low/Weak` → "Élite/Fuerte/Medio/Bajo/Débil". Sin cambios de lógica. Por qué va separado: es cambio de producto (copy), no de diseño, y el preview ya lo muestra traducido.

---

## Decisiones pendientes (antes de empezar la fase 2)

| ID | Decisión | Quién | Recomendación |
|---|---|---|---|
| **D-0** | Dirección A o B | Dueño | **A** (ver `02-direcciones.md`) |
| **D-1** | Restaurar el ScoreRing de dos arcos (CHANGE-004) y cómo tratar `confidence` null | Diego | Restaurar; null → ámbar (`?? 0`) |
| **D-2** | Textos crudos del backend visibles hoy: "Rocket/Rising/Steady/Watching/Declining" en `kpi-cards.tsx:184`, `performanceLabel` crudo en `app-header.tsx:150`, y "En baja" posible vía `PerformanceBadge` en `winner-card.tsx:85,125` (código muerto) y en la tabla diaria de `tracker/[candidateId]/page.tsx:704` | Diego (es la decisión ya pendiente en CLAUDE.md) | Bandas de score ("70 o más", "50–69"…) en KPI; en el badge, que `declining` caiga visualmente en "En observación" |
| **D-3** | Normalizar copy al español (R5) | Dueño | Sí, en PR separado |
| **D-4** | Presupuesto de columnas del tracker (J3: "Producto" ≈ 106 px a 1440) | Dueño + Diego | Fase 3: mover "Tienda" debajo del título libera ~120 px. No entra en la fase 2 porque cambia la estructura de la tabla |
| **D-5** | CLAUDE.md exige `formatCurrency()` de `lib/utils.ts`, que **no existe**. El camino real es `FormattedPrice` + `currencySymbol()` | Diego | Actualizar CLAUDE.md para que apunte a `FormattedPrice`, sin crear una función nueva |
| **D-6** | CLAUDE.md desactualizado: dice Next 15 (es 16.1.6); dice que `tracker-table` muestra estimaciones (se quitaron en CHANGE-010); el clon vive en `/tmp/scout-frontend`; y las líneas de regresiones se van a correr con R4 | Daniel | Actualizarlo en un PR de docs aparte, **no** dentro de los PR de diseño |
| **D-7** | Modo oscuro | Dueño | Con A: fase 3, después de R1–R4 y de migrar el resto de pantallas |

## Borrador de entrada para `docs/CHANGES.md` (usar al mergear R1)

```
### CHANGE-NNN — Sistema de diseño v2: tokens, fuente y hover neutro
**Fecha:** YYYY-MM-DD
**Tipo:** ui

**Qué cambió:** Nuevos tokens de color (dirección "Precisión", docs/redesign/) con contraste WCAG AA verificado. `--accent` deja de ser igual a `--primary`: los hovers de menús y botones ghost pasan de azul sólido a gris neutro. `--font-sans` pasa a apuntar a la variable de next/font (antes apuntaba a un nombre literal sin fallback). Nuevos tokens semánticos success/warning/danger/info.
**Por qué:** la UI tenía 447 colores escritos a mano, 186 textos de menos de 12 px y varios colores por debajo de 4,5:1. Ver docs/redesign/01-diagnostico.md.
**Archivos modificados:**
- `app/globals.css` — tokens nuevos y mapeo shadcn
- `app/layout.tsx` — themeColor
- `components/ui/button.tsx`, `components/ui/badge.tsx` — variantes sobre tokens
- `components/ui/segmented.tsx` — nuevo, unifica 5 segmented controls
**Relacionado con backend:** No aplica
**Wiki actualizado:** No aplica
```
