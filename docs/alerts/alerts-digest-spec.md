# Sistema de Alertas — Especificación del Email Digest

**Fecha:** 2026-06-12  
**Autor:** Claude (arquitectura propuesta)  
**Estado:** Diseño — pendiente aprobación

---

## Propósito del digest

El digest periódico es el canal de comunicación de bajo ruido. Consolida:
1. Movimientos relevantes desde el último digest
2. Contexto de salud de las tiendas del usuario
3. Eventos que no calificaron para alerta inmediata (por cooldown o por plan)

No es un resumen de marketing. No infla si no hubo movimiento. El usuario confía en el digest porque siempre dice la verdad.

---

## Frecuencia y timing

| Plan | Frecuencia default | Hora de envío | Configurable |
|---|---|---|---|
| Starter | Semanal (lunes) | 8:00 AM hora Colombia | No [DECISIÓN PROPUESTA] |
| Pro | Diario | 8:00 AM hora Colombia | A semanal |
| Agency | Diario | 8:00 AM hora Colombia | A semanal |

**Criterio de envío:** solo si hay al menos 1 evento relevante en el período. Si no hubo ningún movimiento en las tiendas del usuario, no se envía el digest. El silencio también es información, pero no requiere un email vacío.

**Excepción de silencio:** si el usuario lleva 7 días sin recibir ninguna comunicación (sin alertas, sin digest), enviar un digest de "estado tranquilo" mínimo. Este no se enviará más seguido que semanalmente.

---

## Secciones del digest

El digest se compone de secciones opcionales — solo se incluyen las que tienen contenido.

**Orden:**
1. Header con resumen en 1 línea
2. Eventos de señal — si hay candidatos con label cambiado o umbral cruzado
3. Movimientos de rank — top subidas y bajas
4. Candidatos nuevos con señal temprana — si hay candidatos < 7 días con score > 30
5. Estado de tiendas — si alguna tienda tiene inactivity_tier en INACTIVA o ZOMBIE, o sin datos
6. Footer estándar

---

## Sección 1: Header / resumen

**Formato:** 1 línea. Nunca más.

Ejemplos:
```
Esta semana: 2 productos en Rocket, 1 tienda sin datos recientes.
Hoy: 1 nuevo Rocket en [Tienda]. Sin otros movimientos relevantes.
Esta semana: Sin movimientos relevantes en tus tiendas.
```

Si no hubo movimiento: el header dice exactamente eso. No agregar contenido inventado.

---

## Sección 2: Eventos de señal

Agrupa los candidatos que cambiaron de label o cruzaron un umbral desde el último digest.

**Criterio de inclusión:** `performance_label` cambió entre el snapshot anterior al último digest y el snapshot más reciente. O el candidato generó un `alert_event` en el período.

**Formato:**

```
MOVIMIENTOS DE SEÑAL (N productos)

[Tienda A]
  ↑ Blazer Slim Fit Azul    Watching → Rocket    Score 82   #3   +45%   14 días
  → Jeans Straight Negro    Rising (sostenido)    Score 55   #7   +18%    9 días

[Tienda B]
  ↓ Sneakers Cuero Blanco   Rising → Declining    Score 22  #28   -5%    21 días
```

**Íconos de cambio:**
- `↑` — label mejoró (Watching→Rising, Rising→Rocket, etc.)
- `→` — label estable pero con evento relevante (Rising sostenido 2 días, Top 10%, etc.)
- `↓` — label empeoró (Rising→Declining, etc.)

**Datos en la línea:** `label-anterior → label-nuevo`, `score`, `rank`, `growthPct`, `daysElapsed`. Todo en 1 línea — nunca más. Si el título del producto supera 30 caracteres, truncar con `...`.

**Límite de candidatos mostrados:** máximo 10 por sección. Si hay más, mostrar los de mayor score y agregar "y N más — ver en dashboard".

---

## Sección 3: Movimientos de rank

**Criterio de inclusión:** candidatos con mayor mejora o caída de `current_rank` vs. el rank del snapshot del día del último digest.

**Solo incluir si la mejora/caída es >= 3 posiciones** para evitar ruido de fluctuaciones mínimas.

**Formato:**

```
MAYORES MOVIMIENTOS (por rank)

Subidas
  Camisa Oxford Rayas    #8 → #3    +5 posiciones    [Tienda A]
  Bolsa Tote Canvas      #15 → #9   +6 posiciones    [Tienda B]

Caídas
  Sneakers Cuero Blanco  #12 → #28  -16 posiciones   [Tienda A]
```

**Límite:** top 3 subidas y top 3 caídas. Si no hay ninguna variación >= 3 posiciones, omitir la sección completa.

---

## Sección 4: Candidatos nuevos con señal temprana

**Criterio de inclusión:** candidatos con `days_elapsed < 7` Y `performance_score > 30` en el período del digest.

La señal temprana es relevante porque indica productos que están entrando fuerte.

**Formato:**

```
NUEVOS CON SEÑAL TEMPRANA

  Blazer Lino Beige    Día 3    Score 38    #11    [Tienda A]
  Falda Midi Satén     Día 5    Score 31    #18    [Tienda B]
```

**Límite:** máximo 5. Si no hay ninguno con score > 30, omitir la sección.

---

## Sección 5: Estado de tiendas

**Criterio de inclusión:** solo si alguna tienda tiene problemas.

**Incluir:**
- Tiendas con `inactivity_tier = 'INACTIVA'` o `'ZOMBIE'`
- Tiendas sin snapshot exitoso en los últimos 3 días
- Tiendas donde se detectó caída de catálogo en el período

**Formato:**

```
ESTADO DE TIENDAS

  ⚠ Nike MX          Sin datos desde hace 4 días. Última actualización: 2026-06-08
  ○ Adidas MX         Inactividad alta — pocas señales nuevas en los últimos 30 días
```

**Íconos:**
- `⚠` — problema operativo (sin datos)
- `○` — señal débil (INACTIVA o ZOMBIE pero con datos recientes)

**Si todas las tiendas están bien:** omitir la sección. No incluir mensaje "todas tus tiendas están activas" — el silencio en esta sección implica que todo está bien.

---

## Diseño del email HTML

### Principios de diseño

- **Sin gradientes** — fondos planos únicamente
- **Color solo semántico:** verde (`#10b981`) para mejoras/positivo, rojo/ámbar (`#ef4444`/`#f59e0b`) para caídas/avisos, gris (`#6b7280`) para neutro
- **Datos truncados a 1 línea** — nunca bloques de texto descriptivo para datos de producto
- **Ancho máximo:** 540px — legible en móvil sin scroll horizontal
- **Fondo del email:** `#0a0a0a` (existente en la marca)
- **Fondo del contenedor:** `#111` con borde `#222`

**Contraste intencional con las alertas de señal:** las alertas individuales (Rocket, etc.) tienen un header colorido para llamar la atención. El digest tiene un header sobrio — no compite con las alertas. El digest es información, no urgencia.

### Layout propuesto

```
┌─────────────────────────────────┐
│  SCOUT                          │  ← Texto simple, sin color
│  Resumen semanal · 9 jun 2026   │
├─────────────────────────────────┤
│                                 │
│  Esta semana: 2 Rocket,         │  ← Header: 1 línea, gris claro
│  1 tienda sin datos.            │
│                                 │
├─────────────────────────────────┤
│  MOVIMIENTOS DE SEÑAL (3)       │  ← Sección header: mayúsculas, gris
│                                 │
│  [Tienda A]                     │  ← Tienda: gris
│  ↑ Blazer Slim Fit...  Rocket   │  ← Verde para ↑, rojo para ↓
│    Score 82  #3  +45%  14 días  │  ← Datos en gris claro
│                                 │
│  [Tienda B]                     │
│  ↓ Sneakers Cuero...   Declin.  │
│    Score 22  #28  -5%  21 días  │
│                                 │
├─────────────────────────────────┤
│  MAYORES MOVIMIENTOS            │
│  ...                            │
├─────────────────────────────────┤
│  ESTADO DE TIENDAS              │
│  ⚠ Nike MX — sin datos 4 días   │  ← Ámbar para aviso
├─────────────────────────────────┤
│  Ver dashboard →                │  ← CTA único, al final
│                                 │
│  Próximo resumen: lun 16 jun    │  ← Footer: cuándo será el próximo
│  Desuscribirse del resumen      │
└─────────────────────────────────┘
```

### Colores semánticos (hex)

| Uso | Color | Hex |
|---|---|---|
| Mejora / positivo | Verde | `#10b981` |
| Neutro / datos | Gris claro | `#d1d5db` |
| Caída / negativo | Rojo | `#ef4444` |
| Aviso / atención | Ámbar | `#f59e0b` |
| Label / categoría | Gris apagado | `#6b7280` |
| Fondo sección header | Neutro oscuro | `#1a1a1a` |

---

## Caso "sin novedades"

Si en el período no hubo ningún evento relevante (ningún cambio de label, ningún rank significativo, ningún candidato nuevo con señal, ninguna tienda con problema):

**No enviar el digest** — el silencio es honesto.

**Excepción — digest de "estado tranquilo" semanal:**
Si el usuario lleva > 7 días sin comunicación, enviar un digest mínimo:

```
Asunto: Estado de tus tiendas esta semana — SCOUT

Nada relevante que reportar esta semana en tus N tiendas.

Tus candidatos siguen en seguimiento. Sin movimientos significativos de score o rank.

→ Ver dashboard: [URL]

Próximo resumen: lunes N de [mes]
```

**Diseño:** texto plano sobre fondo oscuro. Sin secciones, sin tablas. Un párrafo.

---

## Manejo de usuarios con muchas tiendas

Un usuario Pro con 40 tiendas puede tener decenas de candidatos. El digest no puede mostrar todos.

**Reglas de truncamiento:**
- Sección "Movimientos de señal": máximo 10 candidatos (ordenados por score desc)
- Sección "Mayores movimientos de rank": máximo 6 (3 subidas + 3 caídas)
- Sección "Nuevos con señal temprana": máximo 5
- Si se truncó: mostrar "y N más — ver en dashboard →"

**Priorización cuando se trunca:**
1. Candidatos con Rocket (siempre incluir si los hay, hasta el límite)
2. Candidatos con cambio de label vs. digest anterior
3. Candidatos con mayor score

---

## Unsubscribe

Cada digest incluye un link de desuscripción del digest (no de todas las alertas).

La desuscripción del digest elimina la `alert_subscription` de tipo `DIGEST` del usuario pero conserva las alertas de señal inmediatas si el plan las permite.

[REQUIERE CAMBIO] Implementar endpoint `POST /api/users/preferences/alerts` que gestione `alert_subscriptions`.

---

## Datos necesarios para generar el digest

El `DigestService` necesita:

```sql
-- Candidatos del usuario con su snapshot actual y el del último digest
SELECT 
    ss.candidate_id,
    ss.performance_label,      -- label actual
    ss.performance_score,
    ss.current_rank,
    ss.growth_pct,
    ss.signal_confidence,
    c.product_title,
    c.days_elapsed,
    st.store_name,
    st.inactivity_tier,
    st.last_scraped_at,
    dt_prev.performance_label AS prev_label,   -- label en el snapshot anterior al último digest
    dt_prev.bestseller_rank   AS prev_rank
FROM score_summaries ss
JOIN candidate_products c ON c.candidate_id = ss.candidate_id
JOIN stores st ON st.store_id = ss.store_id
LEFT JOIN daily_tracking dt_prev ON dt_prev.candidate_id = ss.candidate_id
    AND dt_prev.snapshot_date = :lastDigestDate
WHERE st.user_id = :userId
  AND c.tracking_status = 'active'
ORDER BY ss.performance_score DESC
```

`lastDigestDate` = fecha del último `alert_event` de tipo `DIGEST` para este usuario. Para usuarios sin digest previo = fecha de registro del usuario.