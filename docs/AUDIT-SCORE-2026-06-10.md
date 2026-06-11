# AUDIT-SCORE — Performance Score de Dropspy

**Fecha:** 2026-06-10
**Fuentes auditadas (código real):** `backend-src/service/TrackingService.java` (259 líneas, copiado del repo el 2026-06-10), `backend-src/entity/ScoreSummary.java`, `CandidateProduct.java`, `Snapshot.java`; frontend `lib/score-decay.ts`, `lib/label-utils.ts`, `components/tracker/hero-signal-card.tsx`, `tracker-table.tsx` (commit `3e33537`).
**Regla de la sesión:** solo diagnóstico — ningún fix de scoring implementado.

---

## La fórmula que corre en producción (no es la del wiki)

```java
// TrackingService.computePerformanceScore() — código real
g = clamp(growthPct, 0, 100)        // growth desde floorRank, NUNCA negativo
r = rankQuality                      // 100 − ln(rank)/ln(max(total,2))×100
m = weightedMomentum                 // Σ rankQuality en días con mejora (ventana 10) / windowSize
score = g×0.50 + r×0.30 + m×0.20
```

```java
// toLabel() — el label es una BANDA de score, no una tendencia
≥70 Rocket · ≥50 Rising · ≥30 Steady · ≥15 Declining · <15 Watching
```

Dos consecuencias que atraviesan toda la auditoría:

1. **El wiki documenta otra fórmula.** `scout-score-momentum` dice `effectiveGrowth (g×rq/100)×0.5 + wm×0.3 + rq×0.2` ("v4", 2026-05-20). El código tiene un v5 no documentado: señales independientes, pesos 50/30/20, con comentario explícito *"not dampened by each other"*. El problema que v4 resolvía **regresó**: subir 70% en zona de muertos (rank 150→45 de 200) vuelve a regalar 35 pts de score → ~44-47 pts total (Steady, casi Rising) por moverse en zona irrelevante. Con v4 eso daba ~10 pts de growth efectivo. No hay FIX-NNN que explique el cambio. **¿Fue deliberado? Pregunta #1 para Diego.**
2. **"Declining" no significa "está cayendo"** — significa "score entre 15 y 30". Toda la lógica frontend que "corrige" Declining asume tendencia. Peor: el veto del frontend (`resolveDisplayLabel`: Declining solo sobrevive si `growthPct < 0`) es **matemáticamente imposible** — el backend clampa `growthPct ≥ 0` (línea 102). Resultado: las vistas que usan `resolveDisplayLabel` **jamás muestran Declining**; `pool-winners.tsx` (que no lo usa) sí puede. El mismo producto puede ser Declining en el pool y Watching en el tracker, al mismo tiempo.

Los umbrales reales (70/50/30/15) tampoco coinciden con los que se usaban como canónicos (80/60/40). El `≥70 → Rocket` de `kpi-cards.tsx` que el CLAUDE.md marcaba como divergencia **es el que está alineado con el backend** — el desalineado era el número anterior.

---

## Tabla resumen

| # | Caso | Comportamiento actual (código real) | Veredicto | Riesgo del fix |
|---|------|-------------------------------------|-----------|----------------|
| 1 | Oscilante 5↔8 | Score alterna 46.6 (Steady) y 25.2 (Declining) en días alternos; flapping de label diario | BUG (volatilidad de label) | Diego |
| 2 | Día 1, top 1% | Score máx posible día 1 = 30 (g=0, m=0, solo rq×0.3). Rank 3/300 → 24.2 → label DB "Declining". UI lo tapa con "New" (días ≤2) | BUG semántico (mitigado en UI) | Diego |
| 3 | Tienda 30 vs 3000 | rq 67.7 vs 86.3 (mismo rank 3); topPct 10% vs 1%, ambos tier "Winner". Decisión documentada y aceptada 2026-05-19 | DISCUTIBLE (agravado por v5: rq pesa 30% directo) | Diego solo si se reabre |
| 4 | Catálogo 200→150 | Backend: `totalProducts` se recalcula cada día del count real → sin división stale. Frontend: `consecutiveTop10Days` divide ranks históricos por el count de HOY → racha "Xd en top 10%" se rompe retroactivamente | OK backend / BUG frontend | Con cuidado (frontend) |
| 5 | Spike 80→4→75 | Día spike: 71.1 → Rocket (ScoreRing amarillo por confianza baja — mitigación correcta). Día post: g colapsa a 6.25 → score 10.2 → Watching. NO existe label "Spike" en el código | OK (post-spike) / feature inexistente | — |
| 6 | 45 días en rank 1 | Imposible: rank 1 → exit "winner" el primer día. Estancado en rank 2 → **"expired" en el día 10** por la regla de inactividad. El decay 0.3 nunca llega a actuar | BUG de diseño (expiry ciego a la zona) | Diego |
| 7 | Límites matemáticos | total=1 → base clamp 2, OK. total=0 → tracking omitido, OK. floorRank=0 → guard OK. **rank=0 → ln(0)=−∞ → rq ≈ 9.2×10¹⁶ → score astronómico → label "Rocket"** | BUG (guard faltante) | Diego (1 línea, pero es scoring) |

---

## Detalle por caso

### Caso 1 — Producto oscilante (rank 5↔8, 10 días, tienda de 200)

**Qué hace el código:** `floorRank` ratchetea al peor rank (8). Día en 5: g=(8−5)/8=37.5 → score 46.6 (Steady). Día en 8: g=0 → score 25.2 → banda "Declining". `weightedMomentum` se comporta bien: 5 mejoras × rq(5)≈69.6 / 10 = 34.8 → aporta 7 pts estables, ni infla ni castiga. El decay frontend tampoco castiga (mejora cada 2 días → factor ≈0.97).

**¿Coherente con la intención?** No. Un producto estable en zona alta (top 4%) pierde 21 puntos y dos bandas de label cada vez que toca su piso, y las recupera al día siguiente. El culpable no es el decay ni el momentum — es que **growthPct medido desde el piso vale 50% del score** y se desploma a 0 exactamente en los días pares. Para el usuario: un candidato fuerte que parpadea Steady/Declining día por medio parece roto.

**Fix propuesto:** suavizar g con promedio móvil de 3 días, o medir growth desde el piso de una ventana (no histórico absoluto). Toca la fórmula → **Diego**.

### Caso 2 — Día 1 de monitoreo

**Qué hace el código:** día 1: `floorRank = bestsellerRank` → g=0; `rankImproved=false` (sin prevRank) y `windowSize=1` → m=0. Score = rq×0.3, **techo absoluto de 30 puntos**. Rank 3 de 300 (top 1%) → rq 80.7 → score 24.2 → label "Declining". Incluso rank 2 de 1000 → 27 → "Declining". `signalConfidence = 0/15 = 0`.

**¿Coherente?** A medias. Que el día 1 puntúe bajo es intención legítima (señal sin confirmar). Que el mejor producto posible quede etiquetado **"Declining" en la base de datos** es un accidente de las bandas: la banda 15–30 captura a casi todo producto bueno en día 1. La UI lo tapa (`resolveDisplayLabel` → "New" si días ≤2), pero el dato persistido miente: cualquier consumidor del API que no replique la lógica frontend (alertas por email, pool, futuros clientes API) ve "Declining".

**Fix propuesto:** backend emite "New" para trackingDay ≤2 (o label null) en vez de derivar de banda. **Diego** (toca contrato del API).

### Caso 3 — Tienda de 30 vs tienda de 3000

**Qué hace el código:** rq normalizada por log del total: rank 3/30 → 67.7; rank 3/3000 → 86.3. topPct: 10% vs 1% (con clamp a mínimo 1% en las vistas que clampan). Con growth idéntico, el de la tienda grande saca ~5.6 pts más de score (rq×0.3).

**¿Señales coherentes en la misma fila?** Dentro de una fila no se contradicen: top 10% → tier "Winner", barra 90% llena, rq 67.7 — todo consistente. La fricción es **entre filas**: el usuario ve dos "rank #3" con scores distintos y el de la tienda chica (donde ser #3 de 30 es arguably más señal de venta concentrada) puntúa menos. Esto es la decisión documentada del 2026-05-19 ("el moat es tendencias dentro de cada tienda, no comparar entre tiendas") — pero ojo: esa decisión se tomó cuando rq modulaba el growth (v4). En v5, rq es 30% directo del score, así que **el sesgo pro-tienda-grande pesa más que cuando se decidió aceptarlo**. DISCUTIBLE: vale re-evaluar la decisión bajo la fórmula nueva, no "corregirla" de oficio.

### Caso 4 — Catálogo que cambia de tamaño (200 → 150, rank 20)

**Qué hace el código (backend):** `totalProducts = count de snapshots bestseller de HOY` (TrackingService:32) — se recalcula cada día, y si es 0 el tracking se omite explícitamente para evitar decay falso (línea 35-39). **No hay división stale en backend.** El producto en rank 20: rq 43.5 → 40.2 (−3.3 pts de rq, ~−1 pt de score) sin haberse movido. Tolerable.

**Dónde sí se rompe:**
- topPct pasa de 10% a 13.3% → sale del tier "Winner" sin moverse. Cosmético pero visible.
- **Frontend, `hero-signal-card.tsx` → `consecutiveTop10Days()`:** divide TODO el `rankHistory` histórico por el `storeProductCount` de hoy. Con 150, los días históricos a rank 20 (que eran 10% de 200) ahora computan 13.3% → **la racha "Xd en top 10%" se rompe retroactivamente**. Esta es exactamente la regresión "nunca usar el total de hoy contra ranks de otro día" — viva en `main`.
- Riesgo adicional detectado: si un sync es **parcial** (scrapeó 80 de 200 productos), `totalProducts=80` distorsiona rq de todos los candidatos ese día. El guard solo cubre `totalProducts == 0`.

**Fix propuesto:** frontend — exponer `totalProducts` por día en el history del API (ya existe por snapshot en DB) y usar el del día correspondiente; **con cuidado** (frontend + 1 campo API). Guard de sync parcial: umbral mínimo razonable (p. ej. total de hoy < 50% del de ayer → omitir como el caso 0) — **Diego**.

### Caso 5 — Spike de un día (80 → 4 → 75)

**Qué hace el código:** día del spike: g=(80−4)/80=95 → score 71.1 → "Rocket". Días posteriores en 75: g=(80−75)/80=6.25 → score 10.2 → "Watching". El growth desde floor **no** infla los días posteriores — al volver cerca del piso, g colapsa solo. El momentum arrastra apenas ~7 pts durante ≤10 días. La mitigación de UI del día spike es correcta: confianza baja → ScoreRing mayormente amarillo.

**Pero:** (a) **no existe ningún label "Spike"** en backend ni frontend — la pregunta asume una feature que no está implementada; la detección de anomalías del wiki (`scout-pipeline` §anomalías) sigue siendo diseño, no código. (b) El floor ratchet nunca expira: si meses después el producto sube de 75 a 40, g=(80−40)/80=50 → 25 pts de score "regalados" contra un piso antiguo de la era del spike. DISCUTIBLE: floor con ventana (p. ej. peor rank de los últimos 30 días) — **Diego**.

### Caso 6 — Estancado en la cima (45 días en rank 1)

**Qué hace el código:** el escenario **no puede ocurrir**. Primero: `resolveExitStatus` devuelve `"winner"` el primer día que `bestsellerRank == 1` — el producto sale del tracking activo (es el hito de `scout-top1-hito`). Segundo: un producto clavado en rank 2 sin mejora estricta acumula `improvements == 0` y al llegar `trackingDay >= 10` → **"expired"**. El sistema da de baja al segundo mejor producto de la tienda con el mismo criterio que a un producto muerto en rank 180. El decayFactor 0.3 del frontend (que motivaba la pregunta) es irrelevante en la práctica: el backend mata el tracking en el día 10, mucho antes de los 45.

**¿Es correcto castigar al mejor por no poder mejorar?** No, y el problema es peor que el decay: es la **expiración ciega a la zona**. La intención del decay/expiry es limpiar productos muertos; un rank 2 sostenido es lo contrario de muerto.

**Fix propuesto (sin romper la intención):** en `resolveExitStatus`, eximir del expiry por inactividad a productos cuya rq promedio de la ventana sea alta (p. ej. ≥70, o top 10% del catálogo) — el expiry queda para estancados en zona irrelevante, que era su propósito. Coherentemente, el decay frontend puede escalar su piso por rq (estancado en rank 2 → piso 0.8; estancado en rank 150 → piso 0.3). Toca ciclo de vida + scoring → **Diego**.

### Caso 7 — Límites matemáticos

| Límite | Código | Estado |
|---|---|---|
| rank 1, tienda de 1 producto | `base = Math.max(total, 2)` → ln(1)/ln(2) = 0 → rq=100 | ✅ Protegido (además saldría "winner" al instante) |
| totalProducts = 0 | early return con warning, tracking omitido | ✅ Protegido |
| floorRank = 0 | guard `floorRank > 0` antes de dividir | ✅ Protegido |
| **rank = 0** (globalRank=0 del scraper) | `computeRankQuality` solo chequea `null`: `Math.log(0) = −∞` → `Math.round(+∞)` = `Long.MAX_VALUE` → rq ≈ **9.2×10¹⁶** → score astronómico persistido → label **"Rocket"** | ❌ Sin guard |

Con rank=0, además `g = (floor−0)/floor = 100`. Un glitch del scraper produce el peor resultado posible: score infinito persistido en DB con el mejor label. La regla frontend "rank nunca #0" sugiere que ya pasó alguna vez.

**Fix:** en `computeRankQuality` y en el cálculo de growth, tratar `rank <= 0` como `null`. Una línea, pero es scoring → **Diego**.

---

## Para Diego

Solo lo que requiere su revisión, en orden de impacto:

1. **¿La fórmula v5 fue deliberada?** El código usa `g×0.50 + rq×0.30 + wm×0.20` con señales independientes; el wiki documenta `effectiveGrowth×0.5 + wm×0.3 + rq×0.2` (v4). Si v5 es intencional, el problema que motivó v4 (growth en zona muerta vale completo) está de vuelta y hay que documentar el porqué; si no, hay una regresión de fórmula en producción. No existe FIX-NNN del cambio.
2. **Expiración ciega a la zona (caso 6):** `resolveExitStatus` expira por inactividad a productos estancados en la cima (rank 2 sostenido → expired día 10). Propuesta: eximir si rq ventana ≥70 o top 10%.
3. **rank=0 sin guard (caso 7):** `computeRankQuality(0, …)` → score Infinity → "Rocket" persistido. Fix de una línea: `rank <= 0 → null`.
4. **Labels por banda + veto imposible (casos 1 y 2):** "Declining" = banda 15–30, y el frontend lo vetea con `growthPct < 0` que el backend hace imposible (clamp ≥0). Decidir: o el backend emite labels de tendencia reales (y "New" para días ≤2), o el frontend deja de fingir que Declining es tendencia. Hoy el mismo producto puede mostrar labels distintos en pool vs tracker.
5. **Flapping del oscilante (caso 1):** growth desde floor al 50% hace alternar Steady/Declining día por medio en productos estables de zona alta. Propuesta: promedio móvil 3 días sobre g, o floor por ventana.
6. **Sync parcial distorsiona rq (caso 4):** `totalProducts` del día cubre solo `== 0`; un scrape a medias (80 de 200) recalcula mal la rq de todos los candidatos ese día. Propuesta: umbral de plausibilidad vs día anterior.

**No requieren a Diego** (frontend, "con cuidado", cada uno con su spec): racha top-10% con denominador del día correcto (caso 4), y las regresiones ya reportadas en CHANGE-029 (Peak con %, clamps de topPct).
