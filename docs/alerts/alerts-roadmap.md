# Sistema de Alertas — Roadmap de Implementación

**Fecha:** 2026-06-12  
**Autor:** Claude (arquitectura propuesta)  
**Estado:** Diseño — pendiente aprobación

---

## Estado de partida (baseline)

**Existe y funciona:**
- `AlertService.checkAndSendAlerts(storeId)` — alerta Rocket por tienda, tras cada sync
- `EmailService.sendRocketAlert()` — HTML template funcional
- `score_summaries.alert_sent_at` — cooldown de 7 días para Rocket
- `ScoreSummaryRepository.findRocketCandidatesNeedingAlert()` — query idempotente

**Pipeline ya tiene el orden correcto:**
scoring → alertas. No hay riesgo de incoherencia si solo ampliamos lo que ya existe.

---

## Fase 0 — Corrección de bugs críticos (sin features nuevas)

**Estimación:** 1-2 días  
**Riesgo:** Bajo — sin cambios de schema, solo lógica

### 0.1 Gating por plan en `AlertService`

**El bug:** `checkAndSendAlerts()` envía alertas a usuarios `free` aunque la página de precios dice que Free no tiene alertas.

**Fix:**
```java
// En AlertService.checkAndSendAlerts():
String plan = store.getUser().getPlan();
if (!isAlertAllowed(plan, "ROCKET")) return;
```

**Impacto:** mínimo — usuarios free no deberían tener candidatos activos en producción aún, pero el principio debe respetarse.

### 0.2 Migración de `previous_rank` y `entry_score`

**El bug:** `ScoreSummary.java` tiene estos campos pero `schema.sql` no tiene las migraciones. Confirmar si la columna existe en la BD de producción (Hibernate puede haberla creado con `ddl-auto=update`).

```sql
-- Agregar si no existen (idempotente):
ALTER TABLE score_summaries ADD COLUMN IF NOT EXISTS previous_rank INTEGER;
ALTER TABLE score_summaries ADD COLUMN IF NOT EXISTS entry_score   NUMERIC(10,4);
```

**Impacto:** ninguno si la columna ya existe. Crítico si no existe — ALERTA-004 (Declining) depende de `previous_rank`.

### 0.3 `syncSucceeded` flag en `AlertService`

Pasar contexto de si el sync fue exitoso para evitar alertas basadas en scores del día anterior:

```java
// StoreSyncService — tras sync fallido:
alertService.checkAndSendAlerts(storeId, false);  // no evaluar señal, sí evaluar salud
// tras sync exitoso:
alertService.checkAndSendAlerts(storeId, true);
```

---

## Fase 1 — Infraestructura y alertas de salud

**Estimación:** 3-5 días  
**Riesgo:** Medio — requiere cambios de schema (migraciones nuevas) y un nuevo servicio

### 1.1 Nuevas tablas de schema

Migraciones idempotentes (agregar al final de `schema.sql`):

```sql
-- SISTEMA DE ALERTAS (2026-06-XX)
CREATE TABLE IF NOT EXISTS alert_subscriptions (
    subscription_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(user_id) ON DELETE CASCADE,
    alert_type        TEXT NOT NULL,
    enabled           BOOLEAN DEFAULT true,
    channel           TEXT DEFAULT 'EMAIL',
    threshold_override NUMERIC(5,2),
    frequency         TEXT,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, alert_type, channel)
);

CREATE TABLE IF NOT EXISTS alert_events (
    event_id       BIGSERIAL PRIMARY KEY,
    user_id        UUID REFERENCES users(user_id) ON DELETE CASCADE,
    candidate_id   UUID REFERENCES candidate_products(candidate_id) ON DELETE SET NULL,
    store_id       UUID REFERENCES stores(store_id) ON DELETE SET NULL,
    alert_type     TEXT NOT NULL,
    triggered_at   TIMESTAMPTZ DEFAULT now(),
    snapshot_date  DATE NOT NULL,
    payload        JSONB,
    sent_at        TIMESTAMPTZ,
    channel        TEXT,
    digest_included BOOLEAN DEFAULT false,
    error_message  TEXT
);

CREATE INDEX IF NOT EXISTS idx_ae_user_type ON alert_events(user_id, alert_type, triggered_at);
CREATE INDEX IF NOT EXISTS idx_ae_candidate ON alert_events(candidate_id, alert_type, triggered_at);
```

**Dependencia:** la Fase 2 y Fase 3 requieren que estas tablas existan. Sin Fase 1, no implementar las demás.

### 1.2 `AlertService` — refactor + alertas de salud

- Agregar `isAlertAllowed(plan, alertType)` — tabla de permisos por plan
- Agregar `checkHealthAlerts(storeId)` — evalúa SALUD-U-001, SALUD-U-002, SALUD-U-003
- Migrar cooldown de Rocket a consultar `alert_events` (además de `alert_sent_at` por retrocompat)
- Logear cada evento en `alert_events` con `payload` JSONB

### 1.3 Nuevo email para alertas de salud

`EmailService.sendHealthAlert(userEmail, store, alertType, payload)` — template plano, sin color de acento (no es una señal positiva).

### 1.4 Detectar caída de catálogo y notificar

En `StoreSyncService`, cuando se detecta el partial scrape:
```java
// En lugar de solo log.warn:
alertService.createHealthAlertEvent(storeId, "SALUD_CATALOGO", prevCount, todayCount);
```

**Verificación de Fase 1:**
- Usuario Free NO recibe alerta Rocket
- Usuario Starter SÍ recibe alerta Rocket
- Tienda sin datos 3+ días genera email de aviso para usuario Starter/Pro
- Caída de catálogo genera email para usuario Starter/Pro
- Todos los eventos quedan en `alert_events`

---

## Fase 2 — Alertas de señal completas

**Estimación:** 3-4 días  
**Riesgo:** Medio — nueva lógica de evaluación, más condiciones, más queries

**Prerequisito:** Fase 1 completada (tablas existen, gating por plan funciona, `alert_events` activo)

### 2.1 Nuevas alertas a implementar

| Alerta | Complejidad | Dependencia de schema |
|---|---|---|
| ALERTA-002 Rising sostenida | Baja — query similar a Rocket | Ninguna nueva |
| ALERTA-003 Top 10% | Media — necesita count de snapshots del día | Ninguna nueva (count en tiempo real) |
| ALERTA-004 Declining | Media — necesita `previous_rank` (Fase 0.2) | `previous_rank` en `score_summaries` |
| ALERTA-005 Despegue | Baja — solo leer `cycle_phase` | Ninguna nueva |
| ALERTA-006 Despegue + ads | Baja — join con `product_ads` | Ninguna nueva |

### 2.2 Anti-spam y agrupación

- Implementar límite diario por usuario (máximo 2/5 alertas inmediatas según plan)
- Implementar jerarquía de prioridad cuando un candidato dispara múltiples alertas
- Implementar `payload` combinado cuando hay múltiples eventos del mismo candidato

### 2.3 Refactor del email HTML (templates)

- Migrar todos los templates a diseño sin gradientes (fondo plano)
- Crear template genérico `AlertEmailTemplate` parametrizable por tipo
- Mantener retrocompatibilidad con el template Rocket existente durante 1 ciclo de deploy

**Verificación de Fase 2:**
- ALERTA-004 solo dispara si `previous_rank` existe y el rank empeoró
- ALERTA-006 solo dispara si hay al menos 1 ad activo en `product_ads`
- Un candidato con Rocket + Top10% el mismo día genera 1 solo email, no 2
- El límite diario de alertas se respeta para usuarios Starter

---

## Fase 3 — Digest periódico

**Estimación:** 4-6 días  
**Riesgo:** Medio-alto — scheduler nuevo, aggregation logic, email más complejo

**Prerequisito:** Fase 2 completada (todos los `alert_events` están siendo generados correctamente para poder agregar en el digest)

### 3.1 `DigestService`

Nuevo service que:
1. Consulta usuarios con digest pendiente (según `alert_subscriptions.frequency`)
2. Agrega `alert_events` del período por usuario
3. Consulta `score_summaries` y `daily_tracking` para los datos del digest
4. Construye `DigestPayload` con las secciones definidas en `alerts-digest-spec.md`
5. Llama `EmailService.sendDigest()`

### 3.2 `DigestScheduler`

```java
@Scheduled(cron = "0 0 13 * * MON")   // Lunes 8 AM Colombia
public void sendWeeklyDigests() { ... }

@Scheduled(cron = "0 0 13 * * *")    // Diario 8 AM Colombia
public void sendDailyDigests() { ... }
```

El scheduler diario también corre el lunes — pero `DigestService` verifica qué usuarios tienen `WEEKLY` vs `DAILY` y solo incluye a los correspondientes en cada run.

### 3.3 Template HTML del digest

Diseño plano según spec (ver `alerts-digest-spec.md`):
- Sin gradientes
- Secciones separadas por bordes sutiles
- Colores solo semánticos
- Texto truncado a 1 línea por candidato

### 3.4 Endpoint de preferencias

`POST /api/users/preferences/alerts` — permite al usuario Pro/Agency cambiar frecuencia del digest.

**Verificación de Fase 3:**
- Usuario Starter recibe digest semanal si hubo eventos
- Usuario Pro recibe digest diario
- Si no hubo eventos, no se envía el digest (verificar en staging con un usuario sin candidatos activos)
- El digest incluye eventos de `alert_events` del período, no los recalcula

---

## Fase 4 — Canales adicionales (Agency)

**Estimación:** 3-5 días cuando se requiera  
**Riesgo:** Bajo — si la abstracción de canal se diseñó bien, es agregar implementaciones

**Prerequisito:** Fase 3 + demanda real de usuarios Agency

### 4.1 Abstracción `NotificationChannel`

Refactorizar `EmailService` para que implemente `NotificationChannel`. Agregar `SlackChannel` y `WebhookChannel`.

### 4.2 Configuración de canal en `alert_subscriptions`

Ya está en el schema (`channel TEXT`). Implementar la lógica de dispatch por canal en `AlertService`.

### 4.3 Slack (Agency)

Webhook de Slack. El usuario pega el webhook URL en Settings.

### 4.4 Webhook genérico (Agency)

POST con JSON payload a un endpoint del usuario. Útil para integraciones custom (Zapier, Make, etc.).

---

## Riesgos identificados

### Riesgo 1: Volumen de emails en usuarios con muchas tiendas
**Descripción:** un usuario Agency con 100 tiendas y 10+ candidatos activos por tienda puede generar centenares de eventos por noche. El anti-spam de Fase 2 debe estar implementado antes de abrir Agency.  
**Mitigación:** límite duro de alertas inmediatas (sin límite en Agency → revisar antes de lanzar Agency). El digest es el safety net.

### Riesgo 2: `previous_rank` no existe en producción
**Descripción:** si la columna no existe en la BD de producción, ALERTA-004 fallará en runtime con error de SQL.  
**Mitigación:** Fase 0.2 debe ejecutarse y verificarse antes de implementar ALERTA-004.

### Riesgo 3: Cycle phase requiere 10+ días de datos
**Descripción:** ALERTA-005 y ALERTA-006 solo aplican a candidatos con `days_elapsed >= 10`. Candidatos nuevos no pueden disparar estas alertas.  
**Mitigación:** documentado en el catálogo. No es un bug — es el comportamiento esperado. Asegurarse de que el email no prometa esta alerta para candidatos recientes.

### Riesgo 4: Coherencia del digest con datos "en vivo"
**Descripción:** el digest corre a las 8 AM, 5 horas después del sync (3 AM). Si el usuario ve el dashboard a las 9 AM y el digest a las 8 AM, ambos deben mostrar los mismos datos del mismo día.  
**Mitigación:** el digest usa los datos de `score_summaries` (ya actualizados por el sync de esa madrugada). No hay lag si el orden pipeline → digest se respeta.

### Riesgo 5: Déjà vu en alertas agrupadas
**Descripción:** si el usuario recibe la alerta Rocket el martes y el jueves está en el digest semanal, el mismo candidato puede aparecer dos veces esa semana.  
**Mitigación:** el digest debe excluir candidatos que ya recibieron una alerta inmediata en el período del digest. Usar `alert_events.digest_included = false AND sent_at IS NOT NULL` para filtrar.

### Riesgo 6: Costo de emails
**Descripción:** si el sistema crece a miles de usuarios con digest diario, el costo de JavaMail o proveedor externo puede ser significativo.  
**Mitigación:** no relevante en la fase actual (< 100 usuarios). Documentar para cuando escale. La abstracción de canal (Fase 4) facilita cambiar de proveedor.

---

## Dependencias técnicas reales

```
Fase 0  ─── ninguna dependencia externa
    │
    ▼
Fase 1  ─── Fase 0 (gating por plan primero)
    │        schema.sql con nuevas tablas
    │
    ▼
Fase 2  ─── Fase 1 (alert_events operativo)
    │        Fase 0.2 (previous_rank en BD)
    │
    ▼
Fase 3  ─── Fase 2 (todos los alert_events generados)
    │        nuevo @Scheduled bean
    │
    ▼
Fase 4  ─── Fase 3 (demanda real de Agency)
             refactor NotificationChannel
```

---

## Qué existe hoy vs. qué falta (resumen para Diego)

| Componente | Existe | Falta |
|---|---|---|
| Alerta Rocket básica | ✅ | Gating por plan |
| Email HTML | ✅ | Templates sin gradiente para nuevas alertas |
| Cooldown Rocket | ✅ (`alert_sent_at`) | Cooldown por tipo en `alert_events` |
| Pipeline correcto | ✅ scoring → alertas | `syncSucceeded` flag |
| Alertas Rising/Top10%/Declining | ❌ | Todo |
| Alertas Despegue / Despegue+ads | ❌ | Todo |
| Alertas de salud | ❌ | Todo |
| Tabla `alert_events` | ❌ | Migración + service |
| Tabla `alert_subscriptions` | ❌ | Migración + UI en Settings |
| Digest periódico | ❌ | `DigestService` + `DigestScheduler` + template |
| Anti-spam / agrupación | ❌ | Todo |
| Canal Slack / webhook | ❌ | Fase 4 (cuando Agency lo requiera) |