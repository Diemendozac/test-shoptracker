# Sistema de Alertas — Catálogo de Reglas

**Fecha:** 2026-06-12  
**Autor:** Claude (arquitectura propuesta)  
**Estado:** Diseño — pendiente aprobación

Cada alerta incluye: condición exacta con campos reales del schema, cooldown, configurabilidad, plan mínimo, copy propuesto.

---

## Convenciones de este documento

- **Campos reales:** se usan los nombres exactos de columnas del schema SQL y entidades Java
- `[DECISIÓN PROPUESTA]` — decisión tomada por Claude que requiere aprobación
- `[REQUIERE CAMBIO]` — requiere modificación al schema o código
- Los copys de email están en español, tono honesto, datos primero

---

## ALERTA-001: Señal Rocket

**Estado:** IMPLEMENTADA (parcialmente — falta gating de plan)

**Condición:**
```sql
SELECT ss.* FROM score_summaries ss
JOIN candidate_products c ON c.candidate_id = ss.candidate_id
JOIN stores st ON st.store_id = ss.store_id
JOIN users u ON u.user_id = st.user_id
WHERE ss.store_id = :storeId
  AND ss.performance_label = 'Rocket'               -- score >= 70
  AND u.plan IN ('starter', 'pro', 'agency')        -- [REQUIERE CAMBIO — no existe hoy]
  AND (ss.alert_sent_at IS NULL
       OR ss.alert_sent_at < NOW() - INTERVAL '7 days')
```

**Equivalencia del threshold:** `performance_label = 'Rocket'` ↔ `performance_score >= 70`.
La fórmula es: `growthPct * 0.50 + rankQuality * 0.30 + weightedMomentum * 0.20`

**Cooldown:** 7 días por candidato (existente — via `alert_sent_at`)  
**Configurable:** No — threshold Rocket (70) es fijo del sistema  
**Plan mínimo:** Starter

**Copy:**

```
Asunto: {{ productTitle }} en despegue — SCOUT

Tienda: {{ storeName }}
Score: {{ performanceScore | round(0) }}   Rank: #{{ currentRank }}
Crecimiento desde piso: {{ growthPct | sign }}%
Días en seguimiento: {{ daysElapsed }}
Fase de ciclo: {{ cyclePhase | default('—') }}

Este producto alcanzó señal Rocket — la posición más alta en nuestra escala.
Lleva {{ daysInBestseller }} días mejorando de posición de forma consistente.

→ Ver en dashboard: [URL]

Próxima alerta para este producto: mínimo 7 días.
```

**Nota sobre el template HTML actual:** el `EmailService.buildHtml()` usa `linear-gradient(135deg,#059669,#10b981)` en el header. El principio de diseño de la marca dice "sin gradientes". [DECISIÓN PROPUESTA] Para las alertas nuevas, usar fondo plano `#059669` sin gradiente. La alerta Rocket puede mantenerse con el template actual para evitar regresión — refactorizar en Fase 2 junto con las nuevas alertas.

---

## ALERTA-002: Señal Rising sostenida

**Estado:** No implementada

**Propósito:** Rising es una señal más débil que Rocket, pero sostenida 2 días consecutivos merece atención. No alertar en el primer día de Rising (demasiado ruido).

**Condición:**
```sql
-- Verificar que HOY Y AYER tuvieron performance_label = 'Rising'
SELECT ss.* FROM score_summaries ss
JOIN candidate_products c ON c.candidate_id = ss.candidate_id
JOIN stores st ON st.store_id = ss.store_id
JOIN users u ON u.user_id = st.user_id
WHERE ss.store_id = :storeId
  AND ss.performance_label = 'Rising'               -- score >= 50
  AND ss.performance_score >= 55                    -- [DECISIÓN PROPUESTA] filtro extra anti-spam
  AND u.plan IN ('pro', 'agency')
  AND EXISTS (
      SELECT 1 FROM daily_tracking dt
      WHERE dt.candidate_id = ss.candidate_id
        AND dt.performance_label = 'Rising'
        AND dt.snapshot_date = :snapshotDate - 1   -- ayer también fue Rising
  )
  AND NOT EXISTS (
      SELECT 1 FROM alert_events ae
      WHERE ae.candidate_id = ss.candidate_id
        AND ae.alert_type = 'RISING'
        AND ae.triggered_at > NOW() - INTERVAL '14 days'
  )
```

**Cooldown:** 14 días [DECISIÓN PROPUESTA — más conservador que Rocket por ser señal menos urgente]  
**Configurable:** [DECISIÓN PROPUESTA] Pro/Agency pueden reducir el threshold de `performance_score` custom (min 50, que es el suelo de Rising)  
**Plan mínimo:** Pro

**Copy:**

```
Asunto: {{ productTitle }} mantiene señal Rising — SCOUT

Tienda: {{ storeName }}
Score: {{ performanceScore | round(0) }}   Rank: #{{ currentRank }}
Crecimiento: {{ growthPct | sign }}%   Días: {{ daysElapsed }}

Este producto lleva 2 días consecutivos con señal Rising.
Aún no alcanza Rocket, pero muestra consistencia de posición.

→ Ver en dashboard: [URL]
```

---

## ALERTA-003: Entra top 10% de su tienda

**Estado:** No implementada

**Propósito:** independiente del score absoluto — un producto en el top 10% de bestsellers de su tienda es relevante para el dropshipper.

**Condición:**
```sql
WITH store_product_count AS (
    SELECT COUNT(DISTINCT product_handle) AS total
    FROM snapshots
    WHERE store_id = :storeId
      AND snapshot_date = :snapshotDate
      AND collection_type = 'bestseller'
)
SELECT ss.* FROM score_summaries ss
JOIN candidate_products c ON c.candidate_id = ss.candidate_id
JOIN stores st ON st.store_id = ss.store_id
JOIN users u ON u.user_id = st.user_id
CROSS JOIN store_product_count spc
WHERE ss.store_id = :storeId
  AND u.plan IN ('pro', 'agency')
  AND ss.current_rank IS NOT NULL
  AND ss.current_rank <= CEIL(spc.total * 0.10)     -- top 10%
  AND NOT EXISTS (                                   -- no estuvo en top 10% ayer
      SELECT 1 FROM daily_tracking dt
      WHERE dt.candidate_id = ss.candidate_id
        AND dt.snapshot_date = :snapshotDate - 1
        AND dt.bestseller_rank <= CEIL(spc.total * 0.10)
  )
  AND NOT EXISTS (
      SELECT 1 FROM alert_events ae
      WHERE ae.candidate_id = ss.candidate_id
        AND ae.alert_type = 'TOP_10_PCT'
        AND ae.triggered_at > NOW() - INTERVAL '7 days'
  )
```

**Nota técnica:** `total` de la tienda se computa en tiempo de evaluación consultando snapshots. No se almacena como campo — calcularlo en el momento es más confiable que un valor cacheado. [REQUIERE CAMBIO — ningún campo en el schema actual guarda totalProducts por tienda por día]

**Cooldown:** 7 días  
**Configurable:** No (el 10% es objetivo)  
**Plan mínimo:** Pro

**Copy:**

```
Asunto: {{ productTitle }} entró al top 10% de {{ storeName }} — SCOUT

Tienda: {{ storeName }}   Rank: #{{ currentRank }} de {{ storeTotal }} productos
Score: {{ performanceScore | round(0) }}   Crecimiento: {{ growthPct | sign }}%

Este producto entró al top 10% del bestseller de su tienda hoy.

→ Ver en dashboard: [URL]
```

---

## ALERTA-004: Declining confirmado

**Estado:** No implementada

**Propósito:** alertar cuando un producto que estaba activo empieza a caer de forma sostenida. Útil para tomar decisiones de descontinuar.

**Condición:**
```sql
SELECT ss.* FROM score_summaries ss
JOIN candidate_products c ON c.candidate_id = ss.candidate_id
JOIN stores st ON st.store_id = ss.store_id
JOIN users u ON u.user_id = st.user_id
WHERE ss.store_id = :storeId
  AND ss.performance_label = 'Declining'            -- score entre 15 y 30
  AND u.plan IN ('pro', 'agency')
  AND ss.previous_rank IS NOT NULL                  -- [DISCREPANCIA — ver nota]
  AND ss.current_rank IS NOT NULL
  AND ss.current_rank > ss.previous_rank            -- rank empeoró (número mayor = peor posición)
  AND NOT EXISTS (
      SELECT 1 FROM alert_events ae
      WHERE ae.candidate_id = ss.candidate_id
        AND ae.alert_type = 'DECLINING'
        AND ae.triggered_at > NOW() - INTERVAL '5 days'
  )
```

**Nota sobre `previous_rank`:** este campo existe en `ScoreSummary.java` pero no está en las migraciones de `schema.sql`. [DISCREPANCIA — ver `alerts-architecture.md`]. Antes de implementar ALERTA-004, confirmar que la columna existe en producción y agregar la migración.

**Cooldown:** 5 días [DECISIÓN PROPUESTA — más urgente, el usuario quiere saberlo rápido]  
**Configurable:** No  
**Plan mínimo:** Pro

**Copy:**

```
Asunto: {{ productTitle }} está perdiendo posición — SCOUT

Tienda: {{ storeName }}
Rank actual: #{{ currentRank }}   Rank ayer: #{{ previousRank }}
Score: {{ performanceScore | round(0) }}   Señal: Declining

Este producto empeoró su posición en el bestseller hoy.
El score de desempeño está por debajo del umbral de actividad.

→ Ver historial completo: [URL]
```

---

## ALERTA-005: Despegue detectado

**Estado:** No implementada

**Propósito:** el `cycle_phase = 'Despegue'` es el patrón más fuerte de la plataforma — indica que el score creció de forma acelerada en la fase más reciente del ciclo de 30 días. Combinado con `growth_pct` alto, es la señal más accionable.

**Condición:**
```sql
SELECT ss.* FROM score_summaries ss
JOIN candidate_products c ON c.candidate_id = ss.candidate_id
JOIN stores st ON st.store_id = ss.store_id
JOIN users u ON u.user_id = st.user_id
WHERE ss.store_id = :storeId
  AND ss.cycle_phase = 'Despegue'
  AND ss.growth_pct > 25                            -- [DECISIÓN PROPUESTA] filtro de ruido
  AND c.days_elapsed >= 10                          -- cycle_phase requiere >= 10 días
  AND u.plan IN ('pro', 'agency')
  AND NOT EXISTS (
      SELECT 1 FROM alert_events ae
      WHERE ae.candidate_id = ss.candidate_id
        AND ae.alert_type = 'DESPEGUE'
        AND ae.triggered_at > NOW() - INTERVAL '10 days'
  )
```

**Lógica de `cycle_phase`:** se calcula en `TrackingService` comparando promedios de score entre bloques de 10 días. 'Despegue' = bloque B o C tiene promedio significativamente mayor que el anterior (umbral: +8 puntos de score).

**Cooldown:** 10 días [DECISIÓN PROPUESTA — un despegue no dura indefinidamente; si sigue subiendo, lo verá en el digest]  
**Configurable:** No  
**Plan mínimo:** Pro

**Copy:**

```
Asunto: {{ productTitle }} en fase de despegue — SCOUT

Tienda: {{ storeName }}
Score: {{ performanceScore | round(0) }}   Rank: #{{ currentRank }}
Crecimiento desde piso: {{ growthPct | sign }}%   Día {{ daysElapsed }} de seguimiento

Este producto muestra una aceleración de score en su fase más reciente de actividad.
El patrón 'Despegue' indica mejora sostenida en los últimos 10 días.

→ Ver en dashboard: [URL]
```

---

## ALERTA-006: Despegue con anuncios activos

**Estado:** No implementada

**Propósito:** proxy honesto de "hay una campaña publicitaria funcionando detrás de este producto". Combina la señal de `cycle_phase = 'Despegue'` con la existencia de anuncios activos en `product_ads`.

### Evaluación de la hipótesis "video/creativo vendiendo"

El campo `product_ads.video_url_r2` y `product_ads.status` existen en el schema. Tenemos datos de anuncios de Meta para candidatos que tienen `product_ads` asociados.

**Lo que podemos afirmar:** el candidato tiene anuncios de Meta activos (`product_ads.status = 'active'`) Y el producto está subiendo de posición en el bestseller.

**Lo que NO podemos afirmar:** que los anuncios son la causa de la mejora. No tenemos datos de ventas, atribución ni velocidad de conversión.

**Conclusión:** la alerta es viable si el copy es honesto. No decir "hay un creativo viral" — decir "este producto tiene anuncios activos y está en fase de despegue". Son dos hechos verificables que juntos son una señal accionable para el dropshipper.

**Condición:**
```sql
SELECT ss.* FROM score_summaries ss
JOIN candidate_products c ON c.candidate_id = ss.candidate_id
JOIN stores st ON st.store_id = ss.store_id
JOIN users u ON u.user_id = st.user_id
WHERE ss.store_id = :storeId
  AND ss.cycle_phase = 'Despegue'
  AND ss.growth_pct > 25
  AND c.days_elapsed >= 10
  AND u.plan IN ('pro', 'agency')
  AND EXISTS (
      SELECT 1 FROM product_ads pa
      WHERE pa.candidate_id = ss.candidate_id
        AND pa.status = 'active'
  )
  AND NOT EXISTS (
      SELECT 1 FROM alert_events ae
      WHERE ae.candidate_id = ss.candidate_id
        AND ae.alert_type IN ('DESPEGUE', 'DESPEGUE_ADS')
        AND ae.triggered_at > NOW() - INTERVAL '10 days'
  )
```

**Nota:** si un candidato califica para tanto ALERTA-005 como ALERTA-006 en el mismo día, solo enviar ALERTA-006 (más específica). El cooldown de ambas se evalúa en conjunto (el `IN ('DESPEGUE', 'DESPEGUE_ADS')` en la condición).

**Cooldown:** 10 días  
**Configurable:** No  
**Plan mínimo:** Pro

**Copy propuesto:**

```
Asunto: {{ productTitle }} tiene anuncios activos y está en despegue — SCOUT

Tienda: {{ storeName }}
Score: {{ performanceScore | round(0) }}   Rank: #{{ currentRank }}
Crecimiento desde piso: {{ growthPct | sign }}%
Anuncios de Meta activos: {{ activeAdsCount }}

Detectamos dos señales simultáneas en este producto:
1. Está en fase de despegue (aceleración de score en los últimos 10 días)
2. Tiene {{ activeAdsCount }} anuncio(s) de Meta activo(s)

Estos dos datos juntos sugieren actividad publicitaria coordinada con buen desempeño en el ranking.
No podemos confirmar causalidad, pero la combinación es inusual y merece atención.

→ Ver anuncios: [URL]/tracker/{{ candidateId }}
→ Ver dashboard: [URL]
```

---

## ALERTA-SALUD-U-001: Tienda sin datos — aviso (usuario)

**Estado:** No implementada

**Condición:**
```sql
SELECT s.* FROM stores s
JOIN users u ON u.user_id = s.user_id
WHERE s.user_id = :userId
  AND s.is_active = true
  AND u.plan IN ('starter', 'pro', 'agency')
  AND (
      s.last_scraped_at IS NULL
      OR s.last_scraped_at < NOW() - INTERVAL '3 days'
      OR s.scrape_error_count >= 3
  )
  AND NOT EXISTS (
      SELECT 1 FROM alert_events ae
      WHERE ae.store_id = s.store_id
        AND ae.alert_type = 'SALUD_SNAPSHOT_AVISO'
        AND ae.triggered_at > NOW() - INTERVAL '3 days'
  )
```

**Cooldown:** 3 días (no spamear con el mismo aviso antes de que haya cambio)  
**Configurable:** No  
**Plan mínimo:** Starter

**Copy:**

```
Asunto: Sin datos recientes de {{ storeName }} — SCOUT

Tu tienda "{{ storeName }}" no tiene snapshots nuevos desde hace {{ daysSinceLastSync }} días.

Esto significa que los scores de los productos de esta tienda no se están actualizando.
Puedes verificar si la tienda sigue accesible visitando: {{ storeBaseUrl }}

Si el problema persiste, escríbenos a soporte.

→ Ver tienda: [URL]
```

---

## ALERTA-SALUD-U-002: Tienda sin datos — crítico (usuario)

**Estado:** No implementada

**Condición:** igual que SALUD-U-001 pero `last_scraped_at < NOW() - INTERVAL '7 days'`  
**Cooldown:** 7 días  
**Plan mínimo:** Starter

**Copy:**

```
Asunto: ⚠ {{ storeName }} lleva 7 días sin datos — SCOUT

Tu tienda "{{ storeName }}" no tiene snapshots exitosos desde hace {{ daysSinceLastSync }} días.

Los scores de esta tienda están desactualizados y no reflejan la situación actual.
La tienda sigue activa en el sistema, pero no podemos obtener su catálogo.

Si la tienda sigue operando, escríbenos para investigar el problema.

→ Ver tienda: [URL]
```

---

## ALERTA-SALUD-U-003: Caída abrupta de catálogo

**Estado:** Parcialmente detectada en código (log warning), sin alerta al usuario

**El código ya detecta esto en `StoreSyncService.syncStore()`:**
```java
if (prevCount != null && prevCount > 0 && products.size() < prevCount * 0.30) {
    log.warn("[Sync] Partial scrape detected...");
    // skips save — pero NO notifica al usuario
}
```

**Lo que falta:** cuando se detecta el partial scrape, además de saltarse el guardado, crear un `alert_event` tipo `SALUD_CATALOGO` y enviar email al usuario.

**Condición de negocio (ya existe en código):** `productos hoy < 30% de productos ayer`

**Cooldown:** 1 alerta por store por evento (no repetir mientras el catálogo siga reducido — solo alertar en la primera detección)  
**Configurable:** No  
**Plan mínimo:** Starter

**Copy:**

```
Asunto: Cambio abrupto en catálogo de {{ storeName }} — SCOUT

El número de productos en el bestseller de "{{ storeName }}" cayó abruptamente:
  Ayer: {{ prevCount }} productos   Hoy: {{ todayCount }} productos

Esto puede indicar un cambio en la estructura de la tienda o un error en la obtención de datos.
Por precaución, no actualizamos los scores hasta confirmar qué ocurrió.

→ Ver tienda: [URL]
```

---

## Resumen de alertas por plan

| Alerta | Free | Starter | Pro | Agency |
|---|:---:|:---:|:---:|:---:|
| Rocket (ALERTA-001) | ❌ | ✅ | ✅ | ✅ |
| Rising sostenida (ALERTA-002) | ❌ | ❌ | ✅ | ✅ |
| Top 10% (ALERTA-003) | ❌ | ❌ | ✅ | ✅ |
| Declining (ALERTA-004) | ❌ | ❌ | ✅ | ✅ |
| Despegue (ALERTA-005) | ❌ | ❌ | ✅ | ✅ |
| Despegue + ads (ALERTA-006) | ❌ | ❌ | ✅ | ✅ |
| Sin datos — aviso (SALUD-U-001) | ❌ | ✅ | ✅ | ✅ |
| Sin datos — crítico (SALUD-U-002) | ❌ | ✅ | ✅ | ✅ |
| Caída catálogo (SALUD-U-003) | ❌ | ✅ | ✅ | ✅ |
| Digest semanal | ❌ | ✅ | ✅ | ✅ |
| Digest diario | ❌ | ❌ | ✅ | ✅ |
| Slack / webhook (futuro) | ❌ | ❌ | ❌ | ✅ |

---

## Nota sobre patrones "Hot", "Scaled", "Spike"

El prompt de diseño mencionó estos patrones. No existen en el código actual.

**Mapeo a lo que sí existe:**
- **"Hot"** → aproximación: `performance_label = 'Rocket'` (ALERTA-001). No existe label "Hot" en el código.
- **"Scaled"** → aproximación: `cycle_phase = 'Despegue'` + `growth_pct` alto (ALERTA-005/006). El patrón Scaled (subida abrupta 1-2 días típica de ads escalados) es mejor capturado por ALERTA-006 cuando hay ads activos.
- **"Spike"** → no modelado. Un spike de 1 día no es confiable — puede ser un artifact del scraping. El sistema requiere al menos 2 días de datos para emitir señal. No proponer alerta de spike en las fases iniciales.

Si se quiere agregar "Spike" en el futuro, requeriría: detectar cuando `daily_tracking.rank_quality` hoy > `rank_quality` ayer por un margen significativo (ej. delta > 20 puntos) en un solo día. Esto es un [REQUIERE CAMBIO] al modelo de tracking — dejarlo para evaluación futura.