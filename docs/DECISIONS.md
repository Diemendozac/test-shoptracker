# DECISIONS — Decisiones de arquitectura y configuración

Registro de decisiones no obvias que afectan el proyecto. El "por qué" es más importante que el "qué".

---

## DECISION-001 — Instalación de skills de React y Redux Toolkit

**Fecha:** 2026-06-11
**Quién decidió:** Daniel + Claude (sesión de configuración)
**Revisado por Diego:** pendiente

### Skills instaladas

**redux-toolkit** (vía `npx skills add mindrally/skills`)
- Instalada en `.claude/skills/redux-toolkit/`
- Aplica siempre que se toque estado global: tiendas, productos monitoreados, sesión, plan del usuario.

**22 skills de React** (vía `OpenAEC-Foundation/React-Claude-Skill-Package`)
- Instaladas en `.claude/skills/` (categorías: react-core, react-syntax, react-impl, react-errors, react-agents)
- Cubren: arquitectura, hooks, componentes, formularios, testing, performance, server components, debugging y revisión de código.

### Skills descartadas

| Skill | Razón del descarte |
|---|---|
| `react-impl-project-setup` | Orientada a Vite (CRA + Vite). Nuestro setup es Next.js — genera conflicto en configuración de bundler, rutas y env vars. |
| `react-impl-routing` | Enseña React Router v6. Usamos el router nativo de Next.js App Router. Seguirla generaría código incompatible. |
| `react-impl-data-fetching` | Enseña TanStack Query. El proyecto usa RTK Query (6 APIs integradas). El conflicto TanStack vs RTK no justifica el riesgo. Los patrones que tenía valor (React 19 `use()`, Suspense, loading states) ya los cubren `react-syntax-hooks-advanced` y `react-core-concurrent`. Eliminada definitivamente. |

---

## DECISION-003 — Tienda chica vs tienda grande en el score

**Fecha:** 2026-05-19
**Quién decidió:** Diego
**Estado:** aceptada — re-evaluar bajo fórmula v5 (ver nota)

Rank 3 de 30 productos (top 10%) puntúa menos que rank 3 de 3000 (top 1%) porque `rankQuality` se normaliza por log del total. La decisión original: "el moat es tendencias dentro de cada tienda, no comparar entre tiendas" — aceptable cuando rq solo modulaba el growth (v4).

**Nota post-auditoría (2026-06-10):** en la fórmula v5, rq es 30% directo del score (antes era factor multiplicador de g). El sesgo pro-tienda-grande pesa más que cuando se tomó la decisión. No se cambia de oficio — DISCUTIBLE si Diego confirma que v5 fue intencional.

**Cómo aplica:** no "corregir" la diferencia de score entre tiendas de distinto tamaño sin que Diego lo revise primero.

---

## DECISION-004 — Fórmula v4 vs v5 del performance score

**Fecha:** 2026-06-10
**Quién decide:** Diego
**Estado:** ⚠️ PENDIENTE DIEGO

El código en producción usa `g×0.50 + rq×0.30 + wm×0.20` (señales independientes, "v5"). El wiki del vault documenta `effectiveGrowth×0.5 + wm×0.3 + rq×0.2` (v4, donde `effectiveGrowth = g×rq/100` — growth dampened por posición).

No existe FIX-NNN ni commit que explique el cambio. Dos escenarios posibles:
- **v5 fue deliberada:** hay que documentar el porqué; el problema que motivó v4 (growth en zona muerta vale completo) está de vuelta intencionalmente.
- **v5 es una regresión:** hay que restaurar v4 o definir v5 formal.

**Consecuencia práctica:** con v5, subir 70% en rank 150→45 de 200 productos vale 35 pts de growth, llevando el score a ~44-47 pts (Steady, casi Rising) por moverse en zona donde nadie compra. Con v4 ese mismo movimiento valía ~10 pts.

**Acción requerida:** Diego confirma si v5 es intencional antes de cualquier trabajo sobre scoring.

---

## DECISION-002 — `pnpm build` vs `next build` directo

**Fecha:** 2026-06-11

`pnpm build` falla con `ERR_PNPM_IGNORED_BUILDS` para `esbuild`, `msw` y `sharp` — es una restricción de seguridad de pnpm que bloquea scripts de instalación no aprobados. Este error es preexistente (no introducido por la instalación de skills).

Para verificar builds se usa `npx next build` directamente. Para resolver el problema raíz: `pnpm approve-builds` y aprobar `esbuild`, `msw` y `sharp`.

**Nota para Diego:** este problema puede afectar CI si el pipeline usa `pnpm build`. Evaluar `pnpm approve-builds` en el repo.
