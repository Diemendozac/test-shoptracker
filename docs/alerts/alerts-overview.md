# Sistema de Alertas — Visión General

**Fecha:** 2026-06-12  
**Autor:** Claude (arquitectura propuesta)  
**Estado:** Diseño — pendiente aprobación de implementación

---

## Estado actual del sistema (baseline)

El sistema tiene una implementación **parcial** que ya funciona en producción:

| Componente | Estado |
|---|---|
| `AlertService.checkAndSendAlerts(storeId)` | ✅ Existe — dispara tras cada sync |
| Alerta Rocket (`performance_label = 'Rocket'`) | ✅ Implementada |
| Cooldown 7 días por candidato (`alert_sent_at`) | ✅ Implementado |
| `EmailService.sendRocketAlert()` con HTML | ✅ Implementado |
| Gating por plan del usuario | ❌ No existe — alerta se envía sin verificar plan |
| Digest periódico | ❌ No existe |
| Alertas más allá de Rocket | ❌ No existe |
| Alertas de salud (tienda sin datos) | ❌ No existe |
| Historial de envíos (`alert_events`) | ❌ No existe — solo `alert_sent_at` en `score_summaries` |
| Preferencias del usuario | ❌ No existe |
| Abstracción de canal | ❌ Solo email hardcodeado |
| Anti-spam / agrupación | ❌ No existe |

**Discrepancia crítica encontrada:** `AlertService` no verifica `user.plan` antes de enviar. Un usuario `free` (que no debería recibir alertas según la página de precios) recibe la misma alerta Rocket que un usuario `starter`. Esto debe corregirse en Fase 1. [REQUIERE CAMBIO]

---

## Los 3 tipos de alerta

### Tipo 1: Digest periódico

Resumen del estado del pool personal del usuario — sus tiendas monitoreadas.

**Propósito:** mantener al usuario informado sin requerir que abra el dashboard. El digest reemplaza el chequeo manual diario para usuarios con muchas tiendas.

**Contenido:**
- Cambios de label desde el último digest (ej. Watching → Rising → Rocket)
- Productos nuevos con señal temprana (primera semana + momentum)
- Top movimientos: mayores subidas y caídas de rank en tiendas del usuario
- Resumen por tienda: cuántos activos, cuántos en movimiento, inactivity_tier
- Si no hubo movimiento: mensaje honesto corto — no inflar con datos irrelevantes

**Frecuencia:** [DECISIÓN PROPUESTA] configurable por el usuario, con default por plan:
- Starter: semanal (lunes 8:00 AM hora Colombia)
- Pro / Agency: diario (8:00 AM hora Colombia), configurable a semanal

**Audiencia:** el usuario directamente. Este email va a la cuenta del usuario en Dropspy.

---

### Tipo 2: Alertas de señal

Disparadas por eventos en el modelo de score. Son inmediatas (se evalúan tras cada sync nocturno).

**Eventos cubiertos (ver catálogo completo en `alerts-rules.md`):**

| ID | Nombre | Trigger | Plan mínimo |
|---|---|---|---|
| ALERTA-001 | Señal Rocket | `performance_label = 'Rocket'` | Starter |
| ALERTA-002 | Señal Rising sostenida | `performance_label = 'Rising'` + score >= 55 por 2 días | Pro |
| ALERTA-003 | Entra top 10% de tienda | `current_rank <= total_productos_store * 0.10` | Pro |
| ALERTA-004 | Declining confirmado | label = Declining + rank empeoró vs ayer | Pro |
| ALERTA-005 | Despegue detectado | `cycle_phase = 'Despegue'` + `growth_pct > 25` | Pro |
| ALERTA-006 | Despegue + anuncios activos | ALERTA-005 + ads activos en `product_ads` | Pro |

**Principio de coherencia:** las alertas consumen exactamente los mismos campos que la UI muestra ese día (`score_summaries`, `daily_tracking`, `product_ads`). Una alerta nunca puede contradecir lo que el dashboard muestra. Se garantiza porque las alertas se evalúan **después** del cálculo de score en el mismo pipeline (ver Arquitectura).

---

### Tipo 3: Alertas de salud

Operativas. Tienen **doble audiencia**: el usuario (su tienda dejó de dar datos) y el equipo interno (salud del crawler).

#### Vista usuario
El usuario necesita saber que una tienda que monitoreaba dejó de tener datos nuevos, porque eso afecta la confiabilidad de los scores.

| ID | Nombre | Condición | Severidad |
|---|---|---|---|
| SALUD-U-001 | Tienda sin datos — aviso | `last_scraped_at < NOW() - 3 días` | Aviso |
| SALUD-U-002 | Tienda sin datos — crítico | `last_scraped_at < NOW() - 7 días` | Crítico |
| SALUD-U-003 | Caída abrupta de catálogo | Productos hoy < 50% de ayer | Aviso |

**Causa posible a comunicar (honestamente):** "no pudimos obtener datos de esta tienda". No especular si cerró o bloqueó. El usuario puede verificar visitando la URL directamente.

#### Vista interna (ops)
El equipo necesita saber cuándo el crawler falla sistemáticamente para distinguir: tienda bloqueó scraping, tienda cerró, error nuestro.

| Señal disponible en el código | Interpretación |
|---|---|
| `scrape_error_count >= 3` | Error repetido — revisar |
| `scrape_error_count >= 5` → `is_active = false` | Store desactivada automáticamente |
| `last_scraped_at IS NULL` tras 24h del cron | Sync nunca completó |

Los logs ya registran `[Sync] Store deactivated after N consecutive errors`. [DECISIÓN PROPUESTA] La alerta interna de ops puede ser un email a una dirección de soporte (ej. `ops@dropspy.io`) o un log estructurado que pueda consultarse. No bloquear la Fase 1 con infraestructura de ops — el log existente puede ser suficiente inicialmente.

**Nota sobre `inactivity_tier`:** este campo (ACTIVA/MODERADA/INACTIVA/ZOMBIE) mide la riqueza de señal del catálogo de la tienda, **no** si el scraping funcionó. Son métricas distintas y no deben confundirse en las alertas.

---

## Principios de diseño del sistema de alertas

### 1. Anti-spam / Fatiga de alertas (crítico)

Un usuario con 40 tiendas y 500 candidatos no puede recibir 80 emails al día. Reglas:

- **Agrupación:** múltiples eventos del mismo día → un solo email agrupado. Preferible siempre sobre emails individuales en el mismo run.
- **Cooldown por producto:** mismo candidato no re-alerta el mismo tipo de evento en X días (ver catálogo).
- **Jerarquía de prioridad** (para agrupación cuando hay múltiples tipos el mismo día): Rocket > Declining > Rising > Top10% > Despegue > Salud
- **Si un candidato marca Rocket Y entra al Top 10% el mismo día:** una sola alerta con ambos datos.
- **Límite duro diario por usuario:** [DECISIÓN PROPUESTA] máximo 3 emails de alerta inmediata por día. Lo que supere ese límite se acumula para el próximo digest.
- **El digest como red de seguridad:** todo evento que no califica para alerta inmediata (por cooldown, por plan, por límite diario) aparece en el próximo digest si es relevante.

### 2. Coherencia con el modelo de score

Las alertas nunca contradicen la UI del mismo día. Esto se garantiza así:
- Las alertas se evalúan **después** de que `TrackingService.updateTracking()` commitea los scores del día.
- El pipeline actual ya tiene este orden: `trackingService.updateTracking()` → `alertService.checkAndSendAlerts()`.
- Ninguna alerta puede leer datos de un snapshot más reciente que el que procesó el scoring ese día.

### 3. Doble audiencia de alertas de salud

Las alertas de salud tienen dos destinatarios distintos con necesidades distintas:
- **Usuario:** quiere saber que su inversión (tienda monitoreada) no está generando datos.
- **Ops (equipo Dropspy):** quiere saber si el crawler tiene un problema sistémico.

Estas notificaciones deben diseñarse por separado y no mezclarse. El usuario no necesita saber detalles técnicos del crawler.

### 4. Honestidad ante todo

Dropspy no especula sobre causas que no puede conocer. Ejemplos:
- No decir "este producto está siendo impulsado por anuncios" → decir "este producto tiene anuncios activos y está subiendo de posición"
- No decir "la tienda cerró" → decir "no pudimos obtener datos desde hace X días"
- No decir "hay un creativo viral" → decir "detectamos un despegue abrupto consistente con una campaña escalando"

---

## Lo que las alertas NO hacen

- **No detectan videos o creativos virales directamente.** El campo `product_ads.video_url_r2` existe, pero no hay atribución causal entre un video y ventas. Ver `alerts-rules.md` (ALERTA-006) para el proxy honesto.
- **No predicen el futuro.** Las alertas reportan lo que ya ocurrió en el snapshot más reciente.
- **No reemplazan el dashboard.** Son complemento, no sustituto.