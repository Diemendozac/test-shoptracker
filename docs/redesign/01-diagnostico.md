# 01 · Diagnóstico de la UI actual

**Fecha:** 2026-09-28 · **Base:** `main` @ `058a539` · **Alcance:** `app/globals.css`, tokens de shadcn/ui, `components/ui/*` y las pantallas dashboard, tracker, pool, stores, pendientes y login.

> **Resumen en una línea:** la UI no se ve amateur por falta de "estilo". Se ve amateur porque **no hay sistema**. Hay un set de tokens, pero la mayoría de los componentes lo ignoran y escriben colores, tamaños y radios a mano, con criterios distintos en cada archivo. Encima, varios de los colores más usados no llegan al contraste mínimo.

## Cifras del código (medidas con `grep` sobre `app/` y `components/`)

| Métrica | Valor | Por qué importa |
|---|---|---|
| Colores de la paleta Tailwind escritos a mano (`text-emerald-600`, `bg-amber-500`…) | **447** usos | Los tokens (`--rising`, `--watching`…) existen pero casi no se usan. Cambiar la paleta hoy exige tocar 447 sitios. |
| Colores hex sueltos en `.tsx` | 26 usos, 16 valores distintos | `kpi-cards.tsx` tiene su propia paleta (`#085041`, `#1D9E75`, `#BA7517`, `#E24B4A`…). |
| Textos de menos de 12 px | **186** (`text-[10px]` ×124, `[11px]` ×46, `[9px]` ×11, `[8px]` ×1, `[6px]` ×1) | Letra diminuta y gris = aspecto de prototipo. Además se lee mal. |
| Radios distintos en uso | 7 (`rounded`, `-sm`, `-md`, `-lg`, `-xl`, `-2xl`, `-full`) | Cada tarjeta redondea distinto: `rounded-xl` en StoreCard, `rounded-2xl` en tracker y pool. |
| Pesos de fuente | 5 (medium, semibold, bold, normal, **black**) | `font-black` en los KPI del tracker (`kpi-cards.tsx:215`, `:228`, `:244`) grita más que el resto de la pantalla. |
| Modo oscuro | **no existe** | `app/globals.css` no tiene bloque `.dark` y `ThemeProvider` (`components/theme-provider.tsx`) no se monta en ningún layout. Las 76 clases `dark:` de `app/share/[candidateId]/page.tsx` no hacen nada. |

## Hallazgos por categoría

Cada hallazgo trae archivo, línea y ejemplo. Los contrastes están calculados con la fórmula WCAG 2.1 sobre los colores de Tailwind v4 convertidos a sRGB. En pantallas P3 se ven algo más saturados, pero la luminancia prácticamente no cambia.

### 1. Color: sin semántica y con contraste insuficiente

| # | Dónde | Qué pasa | Evidencia |
|---|---|---|---|
| C1 | `app/globals.css:21` | `--accent` es **idéntico** a `--primary` (azul saturado). En shadcn, `accent` es el fondo de hover de botones ghost/outline, items de menú y selects. | Todo hover de `DropdownMenuItem` (`components/ui/dropdown-menu.tsx:77`) y de los botones ghost del header (Buscar, Campana) se pinta azul sólido con texto blanco. Es el tic visual más "plantilla" de toda la app. |
| C2 | `components/tracker/tracker-table.tsx:204-210`, `pool-winners.tsx:940-944` | La barra "Contexto" usa un arcoíris de 5 colores (emerald-500, emerald-400, yellow-400, orange-400, rose-500) para una medida secuencial (top X% del catálogo). | Estar abajo del catálogo sale en **rojo**, como si fuera un error. `text-yellow-400` ("Mid") tiene contraste **1,57:1** sobre blanco. |
| C3 | `tracker-table.tsx:530-534` | El subtexto "superó al X%" cambia entre 4 colores (rose-500, amber-600, green-700, emerald-600). | Cuatro verdes distintos conviven en la misma fila (`emerald-600`, `green-700`, `emerald-500` y el `#34d399` de la sparkline). |
| C4 | `components/tracker/kpi-cards.tsx:57-63` | Paleta propia en hex para "Salud del seguimiento". La banda **Declining** va en rojo `#E24B4A`. | CLAUDE.md: "Declining" es una **banda de score (15–29)**, no una caída. Pintarla de rojo transmite un significado falso. La barra "Watching" `#D3D1C7` tiene contraste 1,25:1 contra su pista. |
| C5 | `components/layout/topbar-ticker.tsx:19-28` | El ticker rota entre 8 colores de texto (orange, amber, violet, rose, blue, emerald, primary, amber-600). | Un mensaje informativo cambia de color cada 5 s sin que el color signifique nada. |
| C6 | Colores más usados | `text-emerald-600` (39 usos): **3,65:1** · `text-rose-500` (23): **3,75:1** · `text-emerald-500` (11): **2,47:1** · `text-amber-500` (11): **2,13:1**. | Ninguno llega a 4,5:1 para texto normal. La mayoría de los textos de crecimiento, rank y estado **no cumplen WCAG AA**. |
| C7 | `components/ui/formatted-price.tsx:51` | Todos los precios van en `text-primary` (azul de acento). | El azul significa "clicable". Un precio azul parece un link y compite con los CTA. |
| C8 | `components/tracker/sparkline.tsx:43-44` | Trazo `#34d399` sobre tarjeta blanca: **1,92:1** (mínimo para gráficos: 3:1). Relleno al 8% casi invisible. | La tendencia, que es un dato clave, apenas se ve en modo claro. |
| C9 | `components/layout/app-sidebar.tsx:201`, `product-ads.tsx:217` | Badge de conteo blanco sobre `bg-amber-500`: **2,13:1**, a 9 px y en negrita. | El contador de Pendientes es casi ilegible. |
| C10 | `app/globals.css:37-40` vs uso real | Los tokens `--rising/--watching/--declining/--stable` existen, pero solo los usan `performance-badge.tsx`, `stats-card.tsx` y algunas celdas. El badge "En observación" (`text-watching` sobre su tinte al 10%) da **3,83:1**. | Hay dos sistemas de color en paralelo: el de tokens y el de clases a mano. |

### 2. ScoreRing: la regla de confianza no está implementada

| # | Dónde | Qué pasa |
|---|---|---|
| S1 | `components/dashboard/score-ring.tsx:28` y `:36` | El prop `confidence` se recibe como `_confidence` y **se descarta**. El color sale de `score >= 65` (verde) o no (ámbar). |
| S2 | `docs/CHANGES.md` CHANGE-004 (2026-05-18) | La regla documentada son **dos arcos**: verde = `score × signalConfidence`, amarillo = el resto. No hay ninguna entrada de CHANGES que explique por qué se volvió a un solo color. La historia de git anterior al 2026-06-17 está aplanada en un solo commit (`f8b6dcf`), así que no se puede rastrear. |
| S3 | 10 call sites de `<ScoreRing>` | Solo 2 pasan `confidence` (`pool-detail-panel.tsx:124`, `pool-winners.tsx:1038`). `tracker-table.tsx:670` no lo pasa, aunque CHANGE-004 dice que lo hacía. |
| S4 | Colores del anillo | Arco `stroke-amber-400`: **1,72:1** sobre blanco. Número en `text-emerald-400`: **1,94:1**. El dato más importante de la fila es el de menor contraste. |

**Consecuencia:** hoy un producto con score 78 en su día 2 (confianza 28%) se ve **verde**, "confirmado", que es justo lo que CLAUDE.md prohíbe ("un score alto con baja confianza debe verse mayormente amarillo").

### 3. Tipografía

| # | Dónde | Qué pasa |
|---|---|---|
| T1 | `app/globals.css:54` | **Verificado en fase 2 — no es un bug visible.** Con Turbopack (bundler por defecto de Next 16), `next/font` declara la familia con su nombre real (`"Inter"`), así que `--font-sans: 'Inter', …` sí la encuentra. Lo que falla es menor: no hay fallback genérico (`sans-serif`) y no se usa la fuente de respaldo con métricas ajustadas (`Inter Fallback`), lo que puede causar un salto de layout mientras carga. Se corrige en R1 apuntando a `var(--font-inter)`. |
| T2 | 186 usos de 6–11 px | Jerarquía por tamaño diminuto en lugar de peso y color. Cabeceras de tabla en 10 px mayúsculas (`tracker-table.tsx:471`), subtextos en 9–10 px. |
| T3 | Outfit | Se carga en `app/layout.tsx:19-23` pero solo se usa en el wordmark, por `style={{ fontFamily }}` inline en 5 archivos, sin token. |
| T4 | `kpi-cards.tsx` | `font-black` + `text-2xl` en los KPI chicos, mientras el KPI principal del dashboard usa `font-bold`. Dos escalas de "número grande" que no se hablan. |

### 4. Jerarquía y layout

| # | Dónde | Qué pasa |
|---|---|---|
| J1 | `app/(dashboard)/tracker/page.tsx:117` | `/tracker` no tiene título de página (`<PageLayout>` sin `title`), `/dashboard` y `/stores` sí, y `/pool` usa su propia barra de tabs sin `PageLayout`. Cada pantalla arranca distinto. |
| J2 | `components/layout/app-header.tsx` | El header es una grilla de 3 columnas con la izquierda **vacía**. El botón Buscar (`:249`) no tiene `onClick`: es un affordance muerto. |
| J3 | `tracker-table.tsx:471` y `:554` | 11 columnas de ancho fijo (≈1.028 px + `1fr`). A 1440 px, con el sidebar de 256 px y el padding, a la columna **Producto** le quedan ≈106 px. El dato más importante recibe lo que sobra. |
| J4 | Filtros del tracker (`tracker-table.tsx:357-466`) | 8 controles con el mismo peso visual en una sola fila (búsqueda, 4 selects nativos, 2 toggles, orden, "Clear"). |
| J5 | Segmented controls y tabs | Hay 5 implementaciones a mano: ventana del tracker (activo = azul sólido, `tracker/page.tsx:132`), presets (`:191`) y vista de stores (`stores/page.tsx:191`) con un estilo; el login (`login/page.tsx:319`) con otro (activo = blanco con sombra); y el pool con tabs subrayados (`pool/page.tsx:~147`). Es el mismo patrón hablado en tres lenguajes distintos. |
| J6 | `components/dashboard/store-card.tsx:82`, `stats-card.tsx:28-33` | Hovers con velo degradado al 5% y un "glow" borroso que aparece al pasar el mouse. Efectos que no aportan información. |

### 5. Degradados

Hay 15 usos, cada uno con su criterio: `from-primary/5` (store-card, stores/[storeId]), `/10` (tracker/[candidateId]:425), `/20` (settings:203), direcciones `to-r` y `to-br` mezcladas, podio oro/plata/bronce (`winner-podium.tsx:22-34`) y blobs con `blur-[120px]` en el login (`login/page.tsx:288-289`). Los del 5% casi no se ven: ensucian sin aportar nada. **No hay ninguna regla de dónde usarlos.**

### 6. Espaciado y radios

- Tarjetas con `p-4`, `p-5`, `p-6`, `px-4 py-4` y `px-6 py-5` en la misma pantalla (tracker: hero `px-6 py-5`, KPI `px-4 py-4`).
- Filas del tracker de ~88 px (imagen de 64 + `py-3`): pocas filas visibles para una herramienta de análisis.
- `rounded-xl` y `rounded-2xl` se alternan entre tarjetas equivalentes (`tracker/page.tsx:95` usa 2xl, `:225` usa xl).

### 7. Copy e idioma (afecta la percepción de "producto terminado")

Mezcla de inglés y español en la misma vista: sidebar `Overview` / `Stores` junto a `Mis testeos` (`app-sidebar.tsx:31`, `:35`); `View Details` y `+X% growth` en StoreCard (`store-card.tsx:133`, `:147`); `Clear`, `N of M results` (`tracker-table.tsx:459`, `:464`); tiers `Winner/Strong/Mid/Low/Weak` (`:205-209`); **nombres crudos del backend** `Rocket`/`Declining` en "Salud del seguimiento" (`kpi-cards.tsx:184`) y `performanceLabel` crudo en la campana (`app-header.tsx:150`).

### 8. Deuda que complica la fase 2

- `styles/globals.css` es una copia muerta de los tokens por defecto de shadcn (no se importa en ningún lado). Confunde a quien busca "el" archivo de tokens.
- `WinnerCard`, `WinnerPodium` y `RaceTrack` no se renderizan en ninguna pantalla. `PhaseBadge` solo se usa dentro de `WinnerCard`, así que **hoy los badges de fase no aparecen en ninguna parte**.
- `app/layout.tsx:28` declara `generator: 'v0.app'` y `:32` usa `themeColor: '#f5f7ff'`, que no coincide con `--background`.

## Nota sobre T1 (fuentes)

En la fase 1 marqué T1 como "no verificado" porque dependía de cómo nombra la familia `next/font` en Next 16. En la fase 2 compilé la app: el CSS generado declara `@font-face { font-family: Inter }` y `--font-inter: "Inter","Inter Fallback"`. La fuente **sí** se aplica. T1 queda como mejora menor, no como defecto visible.
