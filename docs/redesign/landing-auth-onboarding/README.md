# Rediseño de landing, login/registro y onboarding

**Fecha:** 2026-09-29 · **Rama:** `redesign/landing-auth-onboarding` · **Pedido:** Daniel · **Referencia de movimiento:** [info.charm.io](https://info.charm.io/)

**Estado:** fase 2B entregada. Daniel eligió la dirección 1 ("Terminal de inteligencia") con el mock del producto vivo de la 3. Hay un prototipo navegable del recorrido completo y la spec de la fase 3. Todavía no hay cambios en `app/`, `components/` ni `messages/`.

## Fases

| Fase | Qué | Estado |
|---|---|---|
| 0 | Recuperar el repo | Hecha |
| 1 | Diagnóstico sin código: Charm, estado actual y assets | Hecha: [`01-diagnostico.md`](./01-diagnostico.md) |
| 2A | Tres direcciones visuales en HTML | Hecha: [`preview/index.html`](./preview/index.html). Elegida la 1, con el mock de la 3 |
| 2B | Prototipo navegable de la dirección elegida y spec | **Entregada**: [`preview/prototipo-2b.html`](./preview/prototipo-2b.html) y [`02-prototipo-y-spec.md`](./02-prototipo-y-spec.md) |
| 3 | Implementación: landing → login → onboarding, un commit por superficie | Pendiente. Orden, riesgos y decisiones en `02-prototipo-y-spec.md` |

## Archivos

| Archivo | Qué es |
|---|---|
| [`01-diagnostico.md`](./01-diagnostico.md) | Qué hace buena a Charm (movimiento medido, jerarquía y prueba social), auditoría de lo actual con archivo y línea, assets con prompts de Unframed y decisiones pendientes |
| [`capturas/antes/`](./capturas/antes/) | Estado actual a 1440 y 390 px. Las `oscuro-forzado-*` son solo referencia: el oscuro no existe en producción |
| [`preview/index.html`](./preview/index.html) | Las tres direcciones lado a lado, en vivo a 390 px, con idea, fortaleza, riesgo y recomendación. Se abre con doble clic y funciona sin internet |
| [`preview/direccion-1.html`](./preview/direccion-1.html) … [`direccion-3.html`](./preview/direccion-3.html) | Cada dirección: hero, funcionalidades y la primera pantalla del login, con controles de tema y de movimiento reducido |
| [`capturas/direcciones/`](./capturas/direcciones/) | Las tres direcciones a 1440 y 390 px, más el tema alterno de cada una |
| [`02-prototipo-y-spec.md`](./02-prototipo-y-spec.md) | Fase 2B: cómo verlo, cómo quedó cada condición (tema gradual, anti-cripto, mock, móvil, wizard), verificación y spec de la fase 3 |
| [`preview/prototipo-2b.html`](./preview/prototipo-2b.html) | **Prototipo navegable:** landing → registro → wizard de 4 pasos → entrada al dashboard. Doble clic y listo; el botón "Prototipo" salta entre pantallas |
| [`capturas/2b/`](./capturas/2b/) | El recorrido a 390 y 1440 px |
| [`tools/`](./tools/) | `build-prototipo.mjs` regenera el prototipo con los tokens actuales de `globals.css`; `theme-stages.mjs` calcula las etapas de color del wizard y falla si algún texto no llega a AA; `verify-prototipo.mjs` recorre el flujo en Chromium (117 chequeos) |

Las capturas de Charm no están en el repo: el repo es público y son de un tercero.
