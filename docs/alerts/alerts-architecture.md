# Sistema de Alertas — Arquitectura Técnica

**Fecha:** 2026-06-12  
**Autor:** Claude (arquitectura propuesta)  
**Estado:** Diseño — pendiente aprobación

---

## Integración con el pipeline de snapshot existente

### Pipeline actual (a 2026-06-12)

```
SyncScheduler (cron 08:00 UTC = 03:00 AM Colombia)
  └── StoreSyncService.syncStore(storeId) [por cada tienda activa]
        ├── ScrapingService.scrapeCollection()     — descarga productos
        ├── saveSnapshots()                        — persiste en snapshots
        ├── upsertCandidates()                     — detecta nuevos candidatos
        ├── classifyUnlabeledCandidates()          — clasifica nichos (LLM)
        ├── TrackingService.updateTracking()       — calcula scores ← AQUÍ CIERRAN LOS DATOS
        ├── refreshActiveCandidatePrices()         — actualiza precios
        └── AlertService.checkAndSendAlerts()      — dispara alertas ← YA EXISTE (solo Rocket)
```

**El orden es correcto.** Las alertas se evalúan después del scoring, por lo que siempre leen datos del mismo día ya commitados. No hay riesgo de incoherencia con la UI.

### Cambios propuestos al pipeline

```
SyncScheduler (cron 08:00 UTC)
  └── StoreSyncService.syncStore(storeId)
        ├── ... [pipeline existente, sin cambios]
        ├── TrackingService.updateTracking()
        ├── refreshActiveCandidatePrices()
        └── AlertService.checkAndSendAlerts(storeId)   — AMPLIAR (ver abajo)

DigestScheduler (cron NUEVO — configurable por plan)         [REQUIERE CAMBIO]
  └── DigestService.sendDigests()
        ├── Consultar usuarios con digest pendiente
        ├── Agregar eventos de las últimas N horas por usuario
        └── EmailService.sendDigest(userId, events)
```

**Separación de responsabilidades:**
- `AlertService.checkAndSendAlerts()` → alertas inmediatas de señal y salud (per-store, tras sync)
- `DigestService.sendDigests()` → digest periódico agregado (una vez por día/semana, todos los usuarios)

No mezclar estos dos flujos. El digest no depende del sync de una tienda específica — consolida eventos de todas las tiendas del usuario.

---

## Modelo de datos nuevo

### Tablas existentes relevantes

```sql
-- score_summaries ya tiene:
alert_sent_at  TIMESTAMPTZ   -- cooldown actual (solo para Rocket)
cycle_phase    TEXT          -- Despegue / Caída / Rebote / Meseta
performance_label TEXT       -- Rocket / Rising / Steady / Declining / Watching
performance_score NUMERIC(10,4)
signal_confidence NUMERIC(5,4)
current_rank   INTEGER
previous_rank  INTEGER       -- [DISCREPANCIA] existe en ScoreSummary.java pero NO en schema.sql
growth_pct     NUMERIC(10,4)
```

**Discrepancia encontrada:** `score_summaries.previous_rank` y `score_summaries.entry_score` existen en la entidad Java `ScoreSummary.java` pero no en las migraciones de `schema.sql`. Están siendo manejados por Hibernate DDL automático (si `spring.jpa.hibernate.ddl-auto = update`) o ya existen en la BD de producción sin estar documentados en el schema. [REQUIERE CAMBIO — agregar migración idempotente]

### Tablas nuevas requeridas

#### `alert_subscriptions` — preferencias de alerta por usuario [REQUIERE CAMBIO]

```sql
CREATE TABLE IF NOT EXISTS alert_subscriptions (
    subscription_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(user_id) ON DELETE CASCADE,
    alert_type        TEXT NOT NULL,        -- 'ROCKET' | 'RISING' | 'TOP_10_PCT' | 'DECLINING'
                                            -- | 'DESPEGUE' | 'DESPEGUE_ADS' | 'SALUD_SNAPSHOT'
                                            -- | 'SALUD_CATALOGO' | 'DIGEST'
    enabled           BOOLEAN DEFAULT true,
    channel           TEXT DEFAULT 'EMAIL', -- 'EMAIL' | 'SLACK' | 'WEBHOOK' (futuros)
    threshold_override NUMERIC(5,2),        -- NULL = usar default del sistema
    frequency         TEXT,                 -- NULL (inmediato) | 'DAILY' | 'WEEKLY'
                                            -- Solo aplica a DIGEST
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, alert_type, channel)
);
```

**Nota de diseño:** los defaults de `alert_subscriptions` se crean automáticamente al registrar un usuario, según su plan. El usuario puede modificarlos desde Settings. Si no existe una fila para un tipo de alerta, se aplica el default del plan.

#### `alert_events` — registro de todos los eventos de alerta [REQUIERE CAMBIO]

```sql
CREATE TABLE IF NOT EXISTS alert_events (
    event_id          BIGSERIAL PRIMARY KEY,
    user_id           UUID REFERENCES users(user_id) ON DELETE CASCADE,
    candidate_id      UUID REFERENCES candidate_products(candidate_id) ON DELETE SET NULL,
    store_id          UUID REFERENCES stores(store_id) ON DELETE SET NULL,
    alert_type        TEXT NOT NULL,        -- mismo enum que alert_subscriptions.alert_type
    triggered_at      TIMESTAMPTZ DEFAULT now(),
    snapshot_date     DATE NOT NULL,        -- fecha del snapshot que disparó el evento
    payload           JSONB,               -- datos de contexto: score, rank, growth_pct, etc.
    sent_at           TIMESTAMPTZ,         -- NULL si pendiente (en cola para digest)
    channel           TEXT,               -- canal por el que se envió
    digest_included   BOOLEAN DEFAULT false, -- true si se incluyó en un digest en lugar de alerta inmediata
    error_message     TEXT                 -- si el envío falló
);

CREATE INDEX IF NOT EXISTS idx_ae_user_type      ON alert_events(user_id, alert_type, triggered_at);
CREATE INDEX IF NOT EXISTS idx_ae_candidate      ON alert_events(candidate_id, alert_type, triggered_at);
CREATE INDEX IF NOT EXISTS idx_ae_pending_digest ON alert_events(user_id, sent_at) WHERE sent_at IS NULL;
```

**Por qué `alert_events` reemplaza `alert_sent_at` en `score_summaries`:**
- `alert_sent_at` es un único timestamp por candidato — no distingue tipos de alerta
- Con múltiples tipos de alerta (Rocket, Rising, Declining, Top10%) necesitamos cooldown independiente por tipo
- El historial de eventos es valioso para el usuario (próxima feature: "mis alertas recientes")
- La idempotencia pasa a garantizarse con `alert_events` — ver sección de idempotencia

**Migración de `alert_sent_at`:** conservar el campo en `score_summaries` para retrocompatibilidad. Las nuevas consultas de cooldown leerán `alert_events`. [DECISIÓN PROPUESTA — puede migrarse a solo `alert_events` en Fase 2]

---

## Abstracción de canales

### Diseño actual (Fase 1)

Solo email. No construir la abstracción todavía — YAGNI hasta que Agency lo requiera.

```java
// Solo en Fase 1:
emailService.sendAlert(userEmail, alertEvent);
emailService.sendDigest(userEmail, digestPayload);
```

### Diseño para Fase 3 (Agency — Slack, webhook)

Cuando Agency lo requiera, extraer una interfaz `NotificationChannel`:

```java
interface NotificationChannel {
    boolean supports(String channelType);
    void send(String destination, AlertPayload payload);
}

@Service class EmailChannel implements NotificationChannel { ... }
@Service class SlackChannel  implements NotificationChannel { ... }  // Fase 3
@Service class WebhookChannel implements NotificationChannel { ... } // Fase 3 (Agency)
```

`AlertService` usaría `List<NotificationChannel>` por inyección y consultaría `alert_subscriptions.channel` para saber qué canal usar.

**Lo que no debe cambiar entre fases:** la lógica de evaluación de condiciones y cooldowns. El canal es solo el transporte — la detección del evento es independiente.

### Por qué no construir la abstracción en Fase 1

1. Un solo canal no necesita abstracción — sobreingeniería prematura
2. Los contratos de Slack y webhook cambian los requisitos de payload
3. Agency no está en el horizonte inmediato
4. El refactor cuando llegue Agency es pequeño (2-3 días) si los canales están bien aislados

---

## Idempotencia

### Problema

El cron corre una vez al día, pero `StoreSyncService` puede ser llamado también manualmente (via API `POST /api/stores/sync`). No podemos enviar la misma alerta dos veces el mismo día.

### Solución por tipo de alerta

**Alertas de señal (Rocket, Rising, Top10%, Declining, Despegue):**
Antes de crear un `alert_event` y enviar, verificar:
```sql
SELECT COUNT(*) FROM alert_events
WHERE candidate_id = :candidateId
  AND alert_type = :alertType
  AND triggered_at >= :snapshotDate::timestamptz
```
Si existe un evento para ese candidato + tipo en la fecha del snapshot → no reenviar.

**Digest:**
Generar el digest una sola vez por período. Usar un flag en la BD o simplemente consultar si ya se envió en la ventana del período (hoy para diario, esta semana para semanal):
```sql
SELECT COUNT(*) FROM alert_events
WHERE user_id = :userId
  AND alert_type = 'DIGEST'
  AND triggered_at >= :periodStart
```

**Alertas de salud:**
Idempotencia por `(store_id, alert_type, DATE(triggered_at))` — una sola alerta de salud por tienda por día.

### Conservar `alert_sent_at` en `score_summaries`

La query actual `findRocketCandidatesNeedingAlert()` usa `alert_sent_at`. Mientras `AlertService` siga usando esta lógica para Rocket, el campo debe mantenerse actualizado. En Fase 2, migrar a consultar `alert_events` para el cooldown de Rocket también, y deprecar `alert_sent_at`. [DECISIÓN PROPUESTA]

---

## Comportamiento cuando un snapshot falla

### Situación
`StoreSyncService.syncStore()` puede fallar en el paso de scraping. En ese caso:
1. No hay snapshots nuevos para esa tienda
2. `TrackingService.updateTracking()` detecta `totalProducts == 0` y hace early-return sin actualizar scores
3. `AlertService.checkAndSendAlerts()` se llama igualmente (en el finally del try/catch — ver código actual)

### Implicación actual
`AlertService.checkAndSendAlerts()` en caso de fallo de sync leerá los **scores del día anterior** en `score_summaries` (porque no se actualizaron). Esto puede generar una alerta Rocket basada en datos del día anterior, lo cual es técnicamente correcto pero potencialmente engañoso.

### Solución propuesta [DECISIÓN PROPUESTA]
Pasar un boolean `syncSucceeded` a `AlertService.checkAndSendAlerts()`. Si `syncSucceeded = false`:
- No evaluar alertas de señal (los scores son del día anterior)
- Sí evaluar alertas de salud (especialmente SALUD-U-001 si `scrape_error_count >= 3`)

```java
// En StoreSyncService:
boolean syncOk = (bsCount > 0);
alertService.checkAndSendAlerts(storeId, syncOk);
```

---

## Gating por plan

**Regla:** antes de enviar cualquier alerta, verificar `store.user.plan` y el tipo de alerta.

[DECISIÓN PROPUESTA] Tabla de permisos por plan:

| Tipo de alerta | Free | Starter | Pro | Agency |
|---|:---:|:---:|:---:|:---:|
| ROCKET | ❌ | ✅ | ✅ | ✅ |
| RISING | ❌ | ❌ | ✅ | ✅ |
| TOP_10_PCT | ❌ | ❌ | ✅ | ✅ |
| DECLINING | ❌ | ❌ | ✅ | ✅ |
| DESPEGUE | ❌ | ❌ | ✅ | ✅ |
| DESPEGUE_ADS | ❌ | ❌ | ✅ | ✅ |
| SALUD_SNAPSHOT | ❌ | ✅ | ✅ | ✅ |
| SALUD_CATALOGO | ❌ | ✅ | ✅ | ✅ |
| DIGEST_SEMANAL | ❌ | ✅ | ✅ | ✅ |
| DIGEST_DIARIO | ❌ | ❌ | ✅ | ✅ |

**Por qué Starter tiene alertas de salud:** la incapacidad de scraping afecta directamente el valor de la suscripción. No darle esta información al usuario Starter sería injusto y generaría churn.

**Por qué Free no tiene alertas:** las alertas son un diferenciador de upgrade. Un usuario Free que ve en la UI que tiene un Rocket pero no recibe el email tiene un incentivo claro de subir de plan.

**Implementación:** agregar método `AlertService.isAlertAllowed(String plan, String alertType)` que encapsule esta tabla. No hardcodear en múltiples lugares.

---

## Anti-spam — implementación

### Cooldowns (ver catálogo completo en `alerts-rules.md`)

Verificar cooldown consultando `alert_events`:
```sql
SELECT triggered_at FROM alert_events
WHERE candidate_id = :candidateId
  AND alert_type   = :alertType
ORDER BY triggered_at DESC
LIMIT 1
```
Si `triggered_at > NOW() - INTERVAL ':cooldown days'` → no re-alertar.

### Agrupación por usuario / run

Un "run" de alertas para un usuario = todos los eventos generados en el mismo sync nocturno.

Si en un run un usuario tiene eventos de múltiples candidatos:
1. Agrupar por prioridad: Rocket primero, luego Declining, luego Rising, etc.
2. Si el total de alertas inmediatas del día <= límite del plan → enviar individualmente o agrupadas (ver spec digest para formato agrupado)
3. Si supera el límite → las de menor prioridad van al próximo digest

[DECISIÓN PROPUESTA] Límite de alertas inmediatas por día por usuario:
- Starter: 2 alertas/día
- Pro: 5 alertas/día
- Agency: sin límite

### Jerarquía dentro de un mismo candidato

Si un candidato dispara múltiples tipos el mismo día (ej. Rocket + Top10% + Despegue):
- Crear un único `alert_event` con `alert_type = 'ROCKET'` (la de mayor prioridad)
- Incluir en `payload` los demás hechos del día para ese candidato
- El email muestra todos los datos relevantes en una sola notificación

---

## Scheduler del digest

[REQUIERE CAMBIO] Nuevo `@Scheduled` en el backend:

```java
@Component
@RequiredArgsConstructor
public class DigestScheduler {

    private final DigestService digestService;

    // Lunes 1:00 PM UTC = 8:00 AM Colombia
    @Scheduled(cron = "0 0 13 * * MON")
    public void sendWeeklyDigests() {
        digestService.sendPendingDigests("WEEKLY");
    }

    // Todos los días 1:00 PM UTC = 8:00 AM Colombia
    @Scheduled(cron = "0 0 13 * * *")
    public void sendDailyDigests() {
        digestService.sendPendingDigests("DAILY");
    }
}
```

**Nota:** el digest corre a las 08:00 AM Colombia, DESPUÉS de que el sync nocturno (03:00 AM) ya terminó. El digest incluye los eventos del sync de esa madrugada.