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

## DECISION-002 — `pnpm build` vs `next build` directo

**Fecha:** 2026-06-11

`pnpm build` falla con `ERR_PNPM_IGNORED_BUILDS` para `esbuild`, `msw` y `sharp` — es una restricción de seguridad de pnpm que bloquea scripts de instalación no aprobados. Este error es preexistente (no introducido por la instalación de skills).

Para verificar builds se usa `npx next build` directamente. Para resolver el problema raíz: `pnpm approve-builds` y aprobar `esbuild`, `msw` y `sharp`.

**Nota para Diego:** este problema puede afectar CI si el pipeline usa `pnpm build`. Evaluar `pnpm approve-builds` en el repo.
