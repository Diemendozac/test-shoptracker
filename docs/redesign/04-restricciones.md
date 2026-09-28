# 04 · Restricciones de CLAUDE.md: cómo sobreviven al rediseño

Chequeo regla por regla. **Estado hoy** = lo que hace `main`. **En el diseño** = cómo lo resuelven las dos direcciones y la spec de fase 2.

| Regla (CLAUDE.md) | Estado hoy | En el diseño | Dónde se ve |
|---|---|---|---|
| **Estimaciones siempre con `~`** | ✅ por omisión: no hay estimaciones en pantalla desde CHANGE-010. `FormattedPrice` antepone `~` cuando la moneda es desconocida. | Patrón definido: `~` en el **mismo nodo de texto** que el número, **mismo color y peso** (nunca atenuada) para que no se pierda por contraste ni por truncado. La fase 2 no vuelve a mostrar estimaciones. | Preview §05 · spec, invariantes |
| **Rocket → Rising** | ✅ en `PerformanceBadge` (`mapPerformanceLabel`). ❌ se filtra "Rocket" como texto en `kpi-cards.tsx:184` y, posiblemente, en `app-header.tsx:150` (`performanceLabel` crudo). | "Rocket" se muestra como el badge "En alza". Las fugas quedan en **D-2** (es cambio de texto con decisión de producto pendiente). | Preview §04 |
| **Nunca mostrar Declining** | ❌ fugas: `kpi-cards.tsx:184` muestra "Declining" en rojo; `PerformanceBadge` mapea `declining` → "En baja" y lo reciben `winner-card.tsx:85,125` (código muerto) y la tabla diaria de `tracker/[candidateId]/page.tsx:704` (`computeSmartLabel` puede devolver Declining). | **No existe variante visual** para Declining en ninguna dirección: no hay badge rojo "En baja" diseñado. En "Salud del seguimiento" se proponen bandas de score (15–29) sin rojo. La lógica de mapeo **no se toca** sin la decisión de Diego (D-2). | Preview §02 (bandas) y §04 |
| **`signalConfidence` al ScoreRing (alta = verde, baja = amarillo)** | ❌ **no se cumple**: `score-ring.tsx:28` descarta `confidence`, el color sale de `score ≥ 65`, y solo 2 de 10 call sites lo pasan. | Dos arcos (CHANGE-004): verde = `score × conf`, ámbar = el resto. Número neutro. Spec **R2a** (requiere-revisor-técnico) pasa `confidence` en los 6 call sites que tienen el dato. | Preview §03 (incluye "hoy en main" para comparar) |
| **`formatCurrency(amount, currency)`** | ⚠️ **la función no existe** en `lib/utils.ts`. El camino real es `FormattedPrice` (`components/ui/formatted-price.tsx`) + `currencySymbol()` / `convertWithRates()` de `lib/currency.ts`. | El diseño solo cambia el **color** del precio (de acento a texto). Símbolo siempre vía `currencySymbol()`, nunca `$` escrito a mano. Corregir CLAUDE.md = **D-5**. | Preview §05 · spec R2b |
| **Null safety** | ✅ en general (`?? 0`, `'—'`). Los `—` hoy van a 9–10 px y con opacidad del 35–40% (**1,8:1**). | `—` en `--text-3` a ≥12 px (≥4,9:1). La fila 3 del preview tiene casi todo en null: precio, score, tendencia, crecimiento, contexto, ads y "Sin rank". | Preview §02 fila 3 y §05 |
| **Las 3 regresiones vivas no se tocan** | Existen en `main`. | La spec R4 prohíbe editar `hero-signal-card.tsx:13-56` y `:87-89`, e incluye un chequeo de `git diff -U0` para probarlo. `tracker/[candidateId]/page.tsx` solo recibe **una** prop en la línea 485 (R2a); la 589 no se toca. | Spec, invariantes y R4 |
| **Redux solo cross-page** | — | Sin estado global nuevo. `segmented.tsx` es controlado (props). El tema claro/oscuro, si llega (fase 3), va por `next-themes`, no por Redux. | Spec R1 |
| **Server Components por defecto** | — | Ningún componente nuevo necesita estado. `segmented.tsx` necesita `onClick`, así que es client, igual que todos sus consumidores actuales. | Spec R1 |
| **Migraciones de arquitectura → flag, no implementar** | — | Cero dependencias nuevas, cero cambios de routing ni de data fetching. Fuentes: Inter y Outfit **ya** se cargan en `app/layout.tsx`. | — |
| **Skills no pisan reglas de producto** | — | Sin conflictos detectados: ninguna recomendación de estilo contradice labels, `~`, confianza, moneda ni null safety. | — |

## Qué NO toca el rediseño (fuera de alcance, confirmado)

Lógica de scoring y umbrales (`lib/label-utils.ts`, `lib/score-decay.ts`, `lib/top-tier.ts`, `lib/spike-store.ts`), Redux (`store/`), servicios (`app/(dashboard)/services/`), tipos (`app/(dashboard)/types/`, `lib/types.ts`), rutas de API, esquema de datos, backend y `package.json`.

## Fase 1: qué se hizo y qué no

- Solo se **crearon** archivos dentro de `docs/redesign/`. No se modificó ningún archivo existente.
- **No se agregó entrada en `docs/CHANGES.md`**, aunque la regla de CLAUDE.md lo pide para cambios importantes: el pedido de esta fase prohibía modificar archivos existentes, y un documento de diseño no cambia el producto. El borrador para R1 está en `03-spec-fase-2.md`.
