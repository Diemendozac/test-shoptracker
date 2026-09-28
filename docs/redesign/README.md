# Rediseño Dropspy — Fase 1 (solo diseño)

**Fecha:** 2026-09-28 · **Estado:** propuesta para decidir. **No se implementó nada:** esta carpeta solo tiene documentos y previews.

## Cómo revisarlo (5 minutos)

1. Abrir **[`preview-a.html`](./preview-a.html)** y **[`preview-b.html`](./preview-b.html)** con doble clic. Funcionan sin internet: fuentes e íconos van incluidos. Arriba a la derecha hay un selector **Claro/Oscuro** y un link para saltar a la otra dirección.
2. Mirar en cada uno las secciones 01 (Resumen) y 02 (Mis testeos): son las pantallas reales con datos ficticios.
3. Leer la recomendación al final de [`02-direcciones.md`](./02-direcciones.md) y las decisiones pendientes en [`03-spec-fase-2.md`](./03-spec-fase-2.md#decisiones-pendientes-antes-de-empezar-la-fase-2).

## Las dos direcciones

- **A · Precisión.** Clara, sobria y densa, estilo Kalodata o Linear: neutros fríos, un solo acento índigo, color solo cuando significa algo, sin degradados en la UI.
- **B · Radar.** Oscura por defecto y con marca fuerte, estilo Foreplay o Raycast: tinta azul-noche sacada del logo, acento violeta y un degradado de firma reservado para la marca, un CTA por vista y la señal #1.

**Recomendación: A.** Se puede lanzar por partes sin romper las pantallas que todavía no se migraron, las fotos de producto (fondo blanco) se ven bien en claro, y el "premium" de las referencias sale de la disciplina, no del modo oscuro. Detalle y contraargumentos en `02-direcciones.md`.

## Archivos

| Archivo | Qué es |
|---|---|
| [`01-diagnostico.md`](./01-diagnostico.md) | Qué hace ver amateur la UI actual, con archivo, línea y contraste medido |
| [`02-direcciones.md`](./02-direcciones.md) | Paletas completas (claro y oscuro), degradados, tipografía, radios, sombras, espaciado, contraste AA y recomendación |
| [`03-spec-fase-2.md`](./03-spec-fase-2.md) | Specs R1–R5 (sistema de diseño, ScoreRing, badges, Dashboard, Tracker, copy) con archivos, riesgo, verificación y rollback. Incluye decisiones pendientes D-0…D-7 |
| [`04-restricciones.md`](./04-restricciones.md) | Cómo sobrevive cada regla de CLAUDE.md, y dónde `main` ya las incumple hoy |
| [`preview-a.html`](./preview-a.html), [`preview-b.html`](./preview-b.html) | Previews estáticos autocontenidos |
| [`tools/contrast-check.mjs`](./tools/contrast-check.mjs) | Verificador WCAG AA que lee los tokens de los previews. `node docs/redesign/tools/contrast-check.mjs` |

## Hallazgos que conviene leer aunque no se haga el rediseño

1. **El ScoreRing ignora `signalConfidence`** (`components/dashboard/score-ring.tsx:28`). CLAUDE.md y CHANGE-004 dicen lo contrario. Hoy un score alto en su día 2 se ve verde, "confirmado".
2. **"Declining" y "Rocket" se ven en pantalla** en "Salud del seguimiento" (`components/tracker/kpi-cards.tsx:184`), y "Declining" va en rojo.
3. **Los colores de texto más usados no llegan a WCAG AA:** `text-emerald-600` 3,65:1, `text-rose-500` 3,75:1. El número ámbar del ScoreRing tiene 1,72:1.
4. **CLAUDE.md está desactualizado:** `formatCurrency()` no existe, la versión es Next 16 y no 15, y el tracker ya no muestra estimaciones.

## Qué no se pudo verificar

- **Si la fuente Inter se aplica de verdad** en producción (diagnóstico T1): depende de cómo nombra la familia `next/font` en el bundler de Next 16, y no compilé la app. Se verifica en 30 segundos con DevTools.
- **Las pantallas reales no se ejecutaron:** sin backend ni sesión no se puede levantar `/dashboard` ni `/tracker`. El diagnóstico sale de leer el código. Los previews replican columnas, textos y estados, pero no son capturas.
- **Contraste:** verificado para todos los pares de tokens (4 temas, 41–42 pares cada uno), no para cada combinación posible de la app actual.
- **Previews:** probados en Chromium (Playwright) a 1440 px y 390 px, en claro y oscuro, sin errores de consola ni scroll horizontal de página. No los probé en Safari ni en Firefox. Usan `color-mix()`, soportado desde Safari 16.2 y Firefox 113.
