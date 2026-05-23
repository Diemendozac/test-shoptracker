# CHANGES — SCOUT Frontend

Registro de cambios importantes. Cada entrada incluye fecha, qué cambió, por qué, y archivos afectados.

> **La fecha es el campo más importante.** Permite saber cuándo se hizo el cambio y correlacionarlo con lo que los usuarios ven en producción.

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
