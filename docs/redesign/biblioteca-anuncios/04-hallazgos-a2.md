# 04 · A2 confirmada: la causa 1 domina, con una pregunta abierta

**Fecha:** 2026-09-29 · **Fuente:** las 3 consultas de [`01-diagnostico.md`](./01-diagnostico.md) A2, corridas por Daniel contra `product_ads` en producción.

## Objetivo

Cerrar la pregunta que dejó abierta [D3](./03-spec.md#d3--link-y-miniatura-del-mismo-anuncio) — "¿cuál de las tres causas pesa?" — con datos reales, antes de escribir una sola línea de código. Sin esto, D3 se hubiera implementado a ciegas, probablemente arreglando el regex del link (causa 2/3) sin tocar la causa que de verdad importa.

## Qué cambia (en el diagnóstico, no en código)

| Consulta | Resultado | % de 25.652 anuncios |
|---|---|---|
| (a) links malformados sin `id=` (causa 3) | 1 | 0,004% |
| (b) links a la biblioteca del anunciante (causa 2) | 0 | 0% |
| (c) anuncios cuya miniatura la comparte otro link distinto | 10.910, en 3.109 grupos | **42,5%** |

- **Causas 2 y 3 quedan descartadas** como explicación principal. Los links en `product_ads` están, casi sin excepción, bien formados y apuntan a un anuncio concreto.
- **La causa 1 domina**, y con una magnitud alta: el armado de tarjeta del scraper (`lib/scrapers/meta-ads.ts:342–352`, y su copia en el probe, `:220–231`) sube niveles del DOM buscando el contenedor de cada anuncio; cuando sube de más, junta una fila completa de Meta en una sola tarjeta. El link sigue siendo válido (por eso (a) y (b) no lo detectan), pero la miniatura queda mal asignada — la más grande de la fila, compartida entre varios anuncios distintos.
- Esto **reordena la prioridad de implementación de D3**: empezar por el armado de tarjeta, no por el regex del link (`:361`, `:365–368`) ni por el fallback de `extractAdId` (`:169–173`) — ambos de baja prioridad hasta ver si la causa 1 explica el 42,5% completo.

## Qué NO cambia

- Ningún código todavía. Este documento es diagnóstico con datos reales, no implementación.
- D3 sigue **requiere-revisor-técnico** — cambia qué se guarda y con qué archivo, y agrega `creative_hash` en el backend. No se implementa sin el OK de Diego.
- El contrato con Meta, el resto del scraper, R2.

## Pregunta abierta antes de escribir código

**42,5% es una cifra alta para ser solo un bug de armado de tarjeta.** Hay una explicación alternativa benigna: un mismo anunciante corriendo el mismo creativo en varios anuncios (variantes de audiencia o texto) — normal en Meta Ads, no un bug. Si una parte no despreciable del 42,5% es esto, "arreglarlo" rompería duplicados legítimos que no estaban rotos.

**Antes de tocar `meta-ads.ts`:** correr `test-scraper.ts` contra 3 tiendas afectadas y comparar a mano 5 anuncios por tienda contra la Meta Ad Library real (paso 1 de "Verificación" en D3). Esto separa cuánto del 42,5% es tarjeta mal armada y cuánto es creativo repetido legítimo.

## Archivos que tocaría la implementación futura (nada tocado hoy)

- `lib/scrapers/meta-ads.ts` (armado de tarjeta: `:342–352`, `:220–231`)
- Backend: columna `creative_hash` (si se llega a esa parte del contrato de D3)

## Riesgo

**requiere-revisor-técnico**, heredado de D3. Este documento no lo cambia; solo re-prioriza qué parte de D3 atacar primero.

## Verificación de este documento

Los 5 números de la tabla se tomaron directo de `product_ads` en la base de producción (Easypanel → `shoptracker-db` → `psql`), corridos por Daniel el 2026-09-29. Tabla y columnas confirmadas contra el esquema real (`\d product_ads`): `ad_snapshot_url` y `thumbnail_url` coinciden con lo que asumía el diagnóstico original.

## Rollback

No aplica — es un documento, no un cambio de comportamiento.

## Links relacionados

- [`01-diagnostico.md`](./01-diagnostico.md) — sección A2, de donde salen las 3 consultas
- [`03-spec.md`](./03-spec.md) — D3, la implementación que este documento re-prioriza
