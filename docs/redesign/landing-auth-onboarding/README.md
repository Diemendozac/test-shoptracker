# Rediseño de landing, login/registro y onboarding

**Fecha:** 2026-09-29 · **Rama:** `redesign/landing-auth-onboarding` · **Pedido:** Daniel · **Referencia de movimiento:** [info.charm.io](https://info.charm.io/)

**Estado:** fase 2A entregada. Hay tres direcciones y el dueño tiene que elegir una. Todavía no hay cambios en `app/`, `components/` ni `messages/`.

## Fases

| Fase | Qué | Estado |
|---|---|---|
| 0 | Recuperar el repo | Hecha |
| 1 | Diagnóstico sin código: Charm, estado actual y assets | Hecha: [`01-diagnostico.md`](./01-diagnostico.md) |
| 2A | Tres direcciones visuales en HTML | **Entregada**: [`preview/index.html`](./preview/index.html). Falta que el dueño elija |
| 2B | Prototipo navegable de la dirección elegida y spec | Pendiente |
| 3 | Implementación: landing → login → onboarding, un commit por superficie | Pendiente |

## Archivos

| Archivo | Qué es |
|---|---|
| [`01-diagnostico.md`](./01-diagnostico.md) | Qué hace buena a Charm (movimiento medido, jerarquía y prueba social), auditoría de lo actual con archivo y línea, assets con prompts de Unframed y decisiones pendientes |
| [`capturas/antes/`](./capturas/antes/) | Estado actual a 1440 y 390 px. Las `oscuro-forzado-*` son solo referencia: el oscuro no existe en producción |
| [`preview/index.html`](./preview/index.html) | Las tres direcciones lado a lado, en vivo a 390 px, con idea, fortaleza, riesgo y recomendación. Se abre con doble clic y funciona sin internet |
| [`preview/direccion-1.html`](./preview/direccion-1.html) … [`direccion-3.html`](./preview/direccion-3.html) | Cada dirección: hero, funcionalidades y la primera pantalla del login, con controles de tema y de movimiento reducido |
| [`capturas/direcciones/`](./capturas/direcciones/) | Las tres direcciones a 1440 y 390 px, más el tema alterno de cada una |

Las capturas de Charm no están en el repo: el repo es público y son de un tercero.
