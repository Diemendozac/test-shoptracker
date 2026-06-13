# DECISIONS — Decisiones de arquitectura y configuración

Registro de decisiones no obvias que afectan el proyecto. El "por qué" es más importante que el "qué".

---

## DECISION-006 — Framework multi-proyecto adoptado; wiki subordinada al código; lint periódico formal

**Fecha:** 2026-06-11
**Quién decidió:** Daniel
**Revisado por Diego:** pendiente (afecta convención de documentación)

### Decisión

Se adoptó un framework escalable a múltiples proyectos futuros con tres pilares:

1. **Wiki subordinada al código:** toda página wiki con afirmaciones técnicas se considera derivada. Si hay discrepancia con el código real, la página se marca `[STALE]` y se reporta — nunca se corrige en silencio. El código real manda.

2. **Lint periódico como operación formal:** cada ~10 ingestas se ejecuta una auditoría de salud del wiki (STALE, huérfanas, contradicciones, archivos no-wiki). El entregable es una página `wiki/lint-YYYY-MM-DD.md`. La primera auditoría (lint-2026-06-11) identificó: fórmula v4/v5 STALE en scout-score-momentum, 2 páginas huérfanas, artefactos de código en el vault root.

3. **SecondBrain como repositorio transversal:** el conocimiento que valga aunque el proyecto muera se promueve a SecondBrain (3 categorías: dominio reutilizable, lección de operador, referencia de patrón/herramienta). Protocolo de promoción requiere aprobación explícita del usuario.

### Por qué

Dropspy creció orgánicamente con buenas prácticas locales. Formalizarlas evita redescubrirlas en cada proyecto nuevo. La subordinación del documento al código previene el riesgo de operar sobre documentación stale (como pasó con v4 vs v5 del score).

### Qué descarta

- Reorganización del vault en subcarpetas por proyecto: descartada. Cada proyecto tiene su propio vault.
- Reconstrucción histórica de raw/: descartada. Las fuentes previas al 2026-06-11 se ingirieron sin copia inmutable — se anota en el schema pero no se reconstruye.

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
**Quién decidió:** Daniel
**Estado:** ✅ Confirmado: v5 intencional — 2026-06-12

El código en producción usa `g×0.50 + rq×0.30 + wm×0.20` (señales independientes). v5 se adopta como fórmula vigente.

**Trade-off aceptado:** growth en zona baja recibe el 50% completo, sin dampening por posición. La compensación parcial es que `rankQuality` (30%) y `weightedMomentum` (20%) penalizan la posición baja en el resto del score.

**Por qué no se revierte a v4:** v4 double-penalizaba productos legítimamente subiendo desde base baja. El dampening era correcto en filosofía pero creaba falsos negativos en transiciones reales.

**Cuándo revisar:** con 100+ predicciones verificables. Si aparecen falsos positivos (Steady/Rising en zona muerta sin ventas reales), evaluar v4.5: `effectiveGrowth = growthPct × max(rankQuality/100, 0.3)` — piso del 30% para no castigar subidas legítimas desde base baja.

---

## DECISION-005 — Orquestación de agentes: evaluada y diferida

**Fecha:** 2026-06-11
**Quién decidió:** Daniel
**Revisado por Diego:** pendiente (afecta settings del entorno en Fase B)

Los agent teams de Claude Code y los subagents fueron evaluados como mecanismo de aceleración del desarrollo. Decisión: **diferido** hasta contar con un plan de Claude con límites de tokens holgados (Max o superior) y hasta que la feature salga de fase experimental.

La **Fase A (subagents)** queda permitida desde ya: uso de subagents dentro de sesiones normales para verificaciones enfocadas que solo reportan resultados (build checks, investigación de librerías, validación de fixes). No requiere activar ningún flag.

Las Fases B y C (agent teams) requieren las precondiciones listadas en [ROADMAP-001](ROADMAP.md#roadmap-001--orquestación-de-agentes-subagents-y-agent-teams).

Motivo principal del diferimiento: costo de tokens del plan actual + feature experimental con limitaciones conocidas + riesgo de permisos en auto-accept.

---

## DECISION-002 — `pnpm build` vs `next build` directo

**Fecha:** 2026-06-11

`pnpm build` falla con `ERR_PNPM_IGNORED_BUILDS` para `esbuild`, `msw` y `sharp` — es una restricción de seguridad de pnpm que bloquea scripts de instalación no aprobados. Este error es preexistente (no introducido por la instalación de skills).

Para verificar builds se usa `npx next build` directamente. Para resolver el problema raíz: `pnpm approve-builds` y aprobar `esbuild`, `msw` y `sharp`.

**Nota para Diego:** este problema puede afectar CI si el pipeline usa `pnpm build`. Evaluar `pnpm approve-builds` en el repo.
