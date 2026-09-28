# Rediseño de las vistas de detalle de producto · Fase 1 (propuesta)

**Fecha:** 2026-09-28 · **Base:** `main` en `3788333` (dirección B "Radar", tema claro) · **Estado:** propuesta, sin implementar.

Las vistas son dos:

- el panel de detalle de **Explorar testeos** (`/pool`, split view);
- la página **`/tracker/[candidateId]`**.

## Cómo revisarlo (10 minutos)

1. **Abrí [`preview-panel.html`](./preview-panel.html) y [`preview-pagina.html`](./preview-pagina.html) con doble clic.** Funcionan sin internet.
   - Arriba hay interruptores de caso, origen, D-1 y G-2. Abajo está el mismo selector "Vista" que usa el admin.
   - Probalos a 1440 px y en móvil (390 px, con las herramientas del navegador).
   - Si los mirás en GitHub, que no renderiza HTML, usá las capturas de [`capturas/`](./capturas/): `antes-*` es la app de hoy y `despues-*` son los previews.
2. **Leé las recomendaciones en [`02-propuesta.md`](./02-propuesta.md)** y las dos decisiones que necesitan a Diego: D-1 y D-2.
3. **Si vas a implementar, leé [`03-spec.md`](./03-spec.md):** son 7 PR chicos, cada uno con su riesgo, su verificación y cómo revertirlo.

## Recomendación

| Vista | Opción recomendada | En una línea |
|---|---|---|
| Panel del pool | **A · Panel de triage** | Veredicto → anuncios → trayectoria → producto, con cabecera fija, tarjetas de anuncio que se adaptan al ancho y `Sheet` por debajo de 1280 px. |
| Página de detalle | **A · Ficha + veredicto** | Galería a la izquierda y veredicto a la derecha en una grilla, un solo h1, las tres métricas como apoyo y el historial plegado. |

## Archivos

| Archivo | Qué es |
|---|---|
| [`01-diagnostico.md`](./01-diagnostico.md) | Causas con archivo y línea: por qué se parten las fechas, se encima "Activo" y se superpone la cabecera. También qué ve cada plan hoy, las inconsistencias de acceso (G-1…G-5) y lo que está desactualizado en CLAUDE.md. |
| [`02-propuesta.md`](./02-propuesta.md) | Dos composiciones por vista, la recomendación y por qué, móvil, D-1, D-2 y control por plan. |
| [`03-spec.md`](./03-spec.md) | Spec de la fase 2: archivos, qué no cambia, riesgo, verificación y reversión (S1–S7, más D-1 y M1 aparte). |
| [`preview-panel.html`](./preview-panel.html), [`preview-pagina.html`](./preview-pagina.html) | Previews autocontenidos de las opciones recomendadas. Usan los tokens de `app/globals.css`. |
| [`tools/contrast-check-detalle.mjs`](./tools/contrast-check-detalle.mjs) | Verifica que los previews usen los tokens reales y que los 37 pares de los componentes nuevos cumplan AA. |
| [`capturas/`](./capturas/) | Antes (la app con API simulada) y después (los previews), a 1440 y 390 px. |

## Decisiones que necesita Diego

- **D-1:** ¿volver a colorear el ScoreRing según la confianza (CHANGE-004)? Riesgo: requiere revisor técnico.
- **D-2:** ¿el backend emite etiquetas de tendencia reales (D-2a) o el frontend trata `performanceLabel` como banda de score (D-2b)? Recomiendo D-2b ahora.
- **G-1 a G-5 y S-1:** inconsistencias de acceso por plan y de score (crudo o con decay) entre el panel y la página. El diseño no las toca; ver `01-diagnostico.md`.
- **Formato de fecha de la API:** si manda `YYYY-MM-DD`, las fechas se ven un día antes en toda Latinoamérica (P10).

## Verificación

```bash
node docs/redesign/tools/contrast-check.mjs                          # tokens de app/globals.css (46/46 AA)
node docs/redesign/detalle-producto/tools/contrast-check-detalle.mjs  # tokens idénticos + 37/37 pares nuevos
```

Los previews se probaron en Chromium (Playwright) a 390, 1100 y 1440 px:

- sin errores de consola;
- sin scroll horizontal de página;
- sin texto de menos de 12 px (sacando la barra de controles del preview);
- **270 estados** (5 planes × cada combinación de interruptores × 3 anchos). En todos, lo que se ve coincide con las reglas de hoy: bloqueo de anuncios solo en la prueba gratis, link a Meta solo para Pro/Agency/Admin, y "Ver producto" desde el pool solo para Pro/Agency/Admin;
- los casos borde: sin anuncios, sin imagen y campos null.

## Qué no se pudo verificar

- **Las capturas que se mencionaron en el pedido no llegaron.** El diagnóstico sale del código y de la app real levantada contra una API simulada. No se probó contra el backend ni contra producción: el proxy de este entorno bloquea `getdropspy.com`.
- **El formato de fecha real de la API** (P10) y si la ventana de seguimiento es de 30 días ("Día N de 30").
- **Si el orden "Impresiones"** de los anuncios corresponde a algo en el backend.
- **Navegadores:** los previews no se probaron en Safari ni en Firefox. Usan container queries (Safari 16+), `color-mix()` (Safari 16.2+) y `text-wrap: balance` (se degrada bien).
- **El shell móvil (M1) no existe.** Los previews a 390 px lo suponen.
